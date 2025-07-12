import json
import pandas as pd
from sentence_transformers import SentenceTransformer
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from vectordb.chroma_client import get_chroma_collection
from groq import Groq
from memory.db import get_engine
from sqlalchemy import update, MetaData, text
from datetime import datetime, timedelta
from sqlalchemy.dialects.mysql import insert as mysql_insert
from dotenv import load_dotenv
 
 
load_dotenv()
 
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
model_id = os.getenv("MODEL_ID")
 
client = Groq(api_key=GROQ_API_KEY)
 
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
collection = get_chroma_collection()
 
class RCAReasoningAgent:
    def __init__(self):
        self.engine = get_engine()

    def calculate_confidence_score(self, success_rate, similarity, severity, sla_urgency, w1=0.3, w2=0.4, w3=0.2, w4=0.1):
        """
        Calculate the confidence score as a weighted sum of the four factors.
        All factors should be in the range [0, 1].
        Confidence Score = Success Rate * w1 + Similarity * w2 + Severity * w3 + SLA Urgency * w4
        """
        return (
            success_rate * w1 +
            similarity * w2 +
            severity * w3 +
            sla_urgency * w4
        )

    def fetch_anomalies_for_rca(self):
        """
        Fetch ALL anomalies to update their rca_summary to network-related issues only.
        """
        # First, let's check what anomalies exist
        check_query = """
            SELECT COUNT(*) as total_anomalies,
                   COUNT(CASE WHEN rca_summary IS NOT NULL THEN 1 END) as with_rca_summary,
                   COUNT(CASE WHEN rca_summary IS NULL THEN 1 END) as null_rca_summary
            FROM anomaly_logs
        """
        check_result = pd.read_sql(check_query, self.engine)
        print(f"Database status: {check_result.to_dict('records')}")
        
        # Get all anomalies to update their rca_summary
        query = """
            SELECT * FROM anomaly_logs
            ORDER BY timestamp DESC
        """
        result = pd.read_sql(query, self.engine)
        print(f"Found {len(result)} total anomalies to update with network-focused RCA")
        return result

    def query_similar_patterns(self, description):
        emb = embedding_model.encode(description).tolist()
        results = collection.query(query_embeddings=[emb], n_results=3)
        # Return both the best document and its similarity score (assume Chroma returns 'distances' as a list of lists)
        documents = results.get("documents", [[]])[0]
        distances = results.get("distances", [[1]])[0]  # Lower distance = higher similarity
        if documents and distances:
            best_doc = documents[0]
            best_distance = distances[0]
            # Convert distance to similarity (cosine similarity = 1 - distance)
            best_similarity = 1 - best_distance
            return best_doc, best_similarity
        return None, 0.0

    def prompt_llm(self, anomaly, similar_patterns):
        messages = [
            {
                "role": "system",
                "content": "You are an expert in root cause analysis focusing specifically on network-related issues. Analyze the given anomaly and provide a concise RCA summary that identifies network-related root causes and solutions."
            },
            {
                "role": "user",
                "content": f"""
Given the anomaly:
Service: {anomaly['service']}
Metric: {anomaly['metric']}
Value: {anomaly['value']}
Timestamp: {anomaly['timestamp']}

And similar past patterns:
{chr(10).join(similar_patterns)}

Analyze this anomaly specifically for network-related issues. Consider:
- Network connectivity problems
- DNS resolution issues
- Network latency spikes
- Network bandwidth constraints
- Network configuration issues
- Load balancer problems
- CDN issues
- Network security issues

Provide a brief, clear reasoning summary focusing only on network-related root causes and solutions.
"""
            }
        ]

        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            temperature=0.4
        )

        full_response = response.choices[0].message.content.strip()
        summary = full_response.strip()
        return summary

    def get_success_rate(self, anomaly, similar_patterns):
        """
        Calculate the success rate as the proportion of similar anomalies with rca_confidence > 0.7.
        similar_patterns: list of similar anomaly descriptions (best_doc, ...)
        """
        if not similar_patterns or not similar_patterns[0]:
            return 0.0
        best_doc = similar_patterns[0]
        with self.engine.connect() as conn:
            query = text("""
                SELECT COUNT(*) as total, SUM(CASE WHEN rca_confidence > 0.7 THEN 1 ELSE 0 END) as success
                FROM anomaly_logs
                WHERE rca_summary LIKE :like_pattern
            """)
            like_pattern = f"%{best_doc[:30]}%"
            result = conn.execute(query, {"like_pattern": like_pattern}).fetchone()
            # result is a tuple: (total, success)
            total = result[0] if result and result[0] else 0
            success = result[1] if result and result[1] else 0
            if total == 0:
                return 0.0
            return success / total

    def get_similarity(self, anomaly, similar_patterns):
        """
        Use the similarity score of the best match from the vector DB (already in [0, 1]).
        """
        # similar_patterns is now a tuple: (best_doc, best_similarity)
        _, best_similarity = similar_patterns
        return best_similarity

    def get_severity(self, anomaly):
        """
        Dynamically calculate severity by normalizing the value field based on metric-specific min/max.
        Focus on network-related metrics for network issue analysis.
        Returns a value in [0, 1].
        """
        metric = anomaly.get('metric', '').lower()
        try:
            value = float(anomaly.get('value', 0))
        except Exception:
            value = 0.0
        # Define min/max for network-related metrics
        metric_ranges = {
            'latency_ms': (0, 5000),   # 0ms (best) to 5000ms (worst)
            'error_rate': (0, 1),      # 0% to 100%
            'network_latency': (0, 3000),  # Network-specific latency
            'dns_resolution_time': (0, 1000),  # DNS resolution time
            'connection_timeout': (0, 1),  # Connection timeout rate
        }
        min_val, max_val = metric_ranges.get(metric, (0, 1))
        if max_val == min_val:
            return 0.0
        severity = (value - min_val) / (max_val - min_val)
        return max(0.0, min(1.0, severity))  # Clamp to [0, 1]

    def get_sla_urgency(self, anomaly):
        """
        Dynamically calculate SLA urgency. High if severity is high or if 'sla_breach' is True in anomaly.
        Returns a value in [0, 1].
        """
        severity = self.get_severity(anomaly)
        if 'sla_breach' in anomaly and anomaly['sla_breach']:
            return 1.0
        if severity > 0.8:
            return 1.0
        elif severity > 0.5:
            return 0.7
        else:
            return 0.3

    def save_to_chroma(self, summary, anomaly, confidence):
        emb = embedding_model.encode(summary).tolist()
        collection.add(
            documents=[summary],
            embeddings=[emb],
            metadatas=[{
                "txn_id": anomaly["txn_id"],
                "service": anomaly["service"],
                "timestamp": str(anomaly["timestamp"]),
                "type": "rca_summary",
                "confidence": confidence
            }],
            ids=[f"rca_{anomaly['txn_id']}"],
        )
        print(f"RCA Summary stored in ChromaDB for txn_id: {anomaly['txn_id']}")

    def save_to_mysql(self, summary, anomaly, confidence):
        """
        Save the RCA summary and confidence to the anomaly_logs table.
        If the txn_id exists, update the row; otherwise, insert a new row.
        """
        metadata = MetaData()
        metadata.reflect(bind=self.engine)
        table = metadata.tables.get("anomaly_logs")

        if table is None:
            print("Table 'anomaly_logs' not found in MySQL.")
            return

        with self.engine.connect() as conn:
            # Check if txn_id exists
            select_stmt = table.select().where(table.c.txn_id == anomaly["txn_id"])
            result = conn.execute(select_stmt).fetchone()
            if result:
                # Update existing row
                update_stmt = (
                    table.update()
                    .where(table.c.txn_id == anomaly["txn_id"])
                    .values(
                        rca_summary=summary,
                        rca_confidence=confidence
                    )
                )
                conn.execute(update_stmt)
                print(f"RCA Summary updated in MySQL for txn_id: {anomaly['txn_id']}")
            else:
                # Insert new row
                insert_stmt = mysql_insert(table).values(
                    txn_id=anomaly["txn_id"],
                    service=anomaly["service"],
                    metric=anomaly["metric"],
                    value=anomaly["value"],
                    timestamp=anomaly["timestamp"],
                    z_score=anomaly["z_score"],
                    rca_summary=summary,
                    rca_confidence=confidence
                )
                conn.execute(insert_stmt)
                print(f"RCA Summary inserted in MySQL for txn_id: {anomaly['txn_id']}")
            conn.commit()

    def run(self):
        anomalies = self.fetch_anomalies_for_rca()
        if anomalies.empty:
            print("No network-related anomalies found that need RCA processing.")
            print("Creating a test network anomaly for demonstration...")
            
            # Create a test anomaly for demonstration
            test_anomaly = {
                "txn_id": "test_network_001",
                "service": "Gateway_A",
                "metric": "latency_ms",
                "value": 3500,
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "z_score": 1.5
            }
            
            desc = f"{test_anomaly['service']} {test_anomaly['metric']} network anomaly: {test_anomaly['value']} at {test_anomaly['timestamp']}"
            best_doc, best_similarity = self.query_similar_patterns(desc)
            rca_summary = self.prompt_llm(test_anomaly, [best_doc] if best_doc else [])

            # Calculate each factor
            success_rate = self.get_success_rate(test_anomaly, [best_doc] if best_doc else [])
            similarity = self.get_similarity(test_anomaly, (best_doc, best_similarity))
            severity = self.get_severity(test_anomaly)
            sla_urgency = self.get_sla_urgency(test_anomaly)

            confidence = self.calculate_confidence_score(success_rate, similarity, severity, sla_urgency)

            self.save_to_chroma(rca_summary, test_anomaly, confidence)
            self.save_to_mysql(rca_summary, test_anomaly, confidence)
            print("Test network anomaly processed and saved.")
            return

        print(f"Processing {len(anomalies)} network-related anomalies for RCA...")
        for _, row in anomalies.iterrows():
            anomaly = row.to_dict()
            desc = f"{anomaly['service']} {anomaly['metric']} network anomaly: {anomaly['value']} at {anomaly['timestamp']}"
            best_doc, best_similarity = self.query_similar_patterns(desc)
            rca_summary = self.prompt_llm(anomaly, [best_doc] if best_doc else [])

            # Calculate each factor (replace with real logic as needed)
            success_rate = self.get_success_rate(anomaly, [best_doc] if best_doc else [])
            similarity = self.get_similarity(anomaly, (best_doc, best_similarity))
            severity = self.get_severity(anomaly)
            sla_urgency = self.get_sla_urgency(anomaly)

            confidence = self.calculate_confidence_score(success_rate, similarity, severity, sla_urgency)

            self.save_to_chroma(rca_summary, anomaly, confidence)
            self.save_to_mysql(rca_summary, anomaly, confidence)
        
        print(f"Network RCA processing completed for {len(anomalies)} anomalies.")
 
if __name__ == "__main__":
    RCAReasoningAgent().run()
