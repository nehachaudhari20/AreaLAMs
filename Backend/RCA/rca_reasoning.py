import json
import pandas as pd
from sentence_transformers import SentenceTransformer
from vectordb.chroma_client import get_chroma_collection
from groq import Groq
from memory.db import get_engine
from sqlalchemy import update, MetaData
from datetime import datetime, timedelta
from sqlalchemy.dialects.mysql import insert as mysql_insert
import os
from dotenv import load_dotenv


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
model_id = os.getenv("MODEL_ID")

client = Groq(api_key=GROQ_API_KEY)


embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
collection = get_chroma_collection()

class RCAReasoningAgent:
    def __init__(self):
        self.engine = get_engine()

    def fetch_recent_anomalies(self):
        past_days = 14
        start_date = (datetime.now() - timedelta(days=past_days)).strftime('%Y-%m-%d')
        query = f"""
            SELECT * FROM anomaly_logs
            WHERE timestamp >= '{start_date}' AND context_used = FALSE
            ORDER BY timestamp DESC
            LIMIT 5
        """
        return pd.read_sql(query, self.engine)

    def query_similar_patterns(self, description):
        emb = embedding_model.encode(description).tolist()
        results = collection.query(query_embeddings=[emb], n_results=3)
        return results.get("documents", [[]])[0]

    def prompt_llm(self, anomaly, similar_patterns):
        messages = [
            {
                "role": "system",
                "content": "You are an expert in root cause analysis of service outages and transaction failures."
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

What is the likely root cause and a possible fix?
Provide a brief, clear reasoning summary.
"""
            }
        ]

        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            temperature=0.4
        )
        return response.choices[0].message.content.strip()

    def save_to_chroma(self, summary, anomaly):
        emb = embedding_model.encode(summary).tolist()
        collection.add(
            documents=[summary],
            embeddings=[emb],
            metadatas=[{
                "txn_id": anomaly["txn_id"],
                "service": anomaly["service"],
                "timestamp": str(anomaly["timestamp"]),
                "type": "rca_summary"
            }],
            ids=[f"rca_{anomaly['txn_id']}"],
        )
        print(f"RCA Summary stored in ChromaDB for txn_id: {anomaly['txn_id']}")

    def save_to_mysql(self, summary, anomaly):
        metadata = MetaData()
        metadata.reflect(bind=self.engine)
        table = metadata.tables.get("anomaly_logs")

        if table is None:
            print("Table 'anomaly_logs' not found in MySQL.")
            return

        with self.engine.connect() as conn:
            stmt = mysql_insert(table).values(
                txn_id=anomaly["txn_id"],
                service=anomaly["service"],
                metric=anomaly["metric"],
                value=anomaly["value"],
                timestamp=anomaly["timestamp"],
                z_score=anomaly["z_score"],
                rca_summary=summary
        )
            conn.execute(stmt)
            conn.commit()
            print(f"RCA Summary updated in MySQL for txn_id: {anomaly['txn_id']}")

    def run(self):
        anomalies = self.fetch_recent_anomalies()
        if anomalies.empty:
            print("No new anomalies found for RCA.")
            return

        for _, row in anomalies.iterrows():
            anomaly = row.to_dict()
            desc = f"{anomaly['service']} {anomaly['metric']} anomaly: {anomaly['value']} at {anomaly['timestamp']}"
            similar_patterns = self.query_similar_patterns(desc)
            rca_summary = self.prompt_llm(anomaly, similar_patterns)

            self.save_to_chroma(rca_summary, anomaly)
            self.save_to_mysql(rca_summary, anomaly)

if __name__ == "__main__":
    RCAReasoningAgent().run()
