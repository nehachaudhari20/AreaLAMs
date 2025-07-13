# pattern_detector.py

import pandas as pd
from datetime import datetime, timedelta
from sentence_transformers import SentenceTransformer
from memory.db import get_engine
from vectordb.chroma_client import client
from vectordb.chroma_client import get_chroma_collection

# Load ChromaDB collection
collection = client.get_or_create_collection("failure_patterns")

model = SentenceTransformer("all-MiniLM-L6-v2") 

class PatternDetectorAgent:
    def __init__(self):
        self.engine = get_engine()

    def load_anomalies(self):
        past_days = 14
        start_date = (datetime.now() - timedelta(days=past_days)).strftime('%Y-%m-%d')
        query = f"""
            SELECT * FROM anomaly_logs
            WHERE timestamp >= '{start_date}'
        """
        return pd.read_sql(query, self.engine)

    def detect_patterns(self, df):
        patterns = []

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp")

        for (service, metric), group in df.groupby(["service", "metric"]):
            group = group.set_index("timestamp")
            bucketed = group.resample("2H").count()
            threshold = 3

            for timestamp, row in bucketed.iterrows():
                if row["txn_id"] >= threshold:
                    pattern_summary = f"Spike in {metric} for {service} around {timestamp.strftime('%Y-%m-%d %H:%M')}"
                    patterns.append({
                        "summary": pattern_summary,
                        "service": service,
                        "metric": metric,
                        "timestamp": timestamp,
                    })

        return patterns

    def save_to_chroma(self, patterns):
        collection = get_chroma_collection()
        for i, p in enumerate(patterns):
            embedding = model.encode(p["summary"]).tolist()
            collection.add(
                documents=[p["summary"]],
                embeddings=[embedding],
                metadatas=[{
                    "service": p["service"],
                    "metric": p["metric"],
                    "timestamp": str(p["timestamp"]),
                    "type": "pattern"
                }],
                ids=[f"pattern_{p['service']}_{p['metric']}_{i}"]
            )
            print(f"Pattern added to ChromaDB: {p['summary']}")

    def run(self):
        df = self.load_anomalies()
        if df.empty:
            print("No anomalies found in last 24 hours.")
            return

        patterns = self.detect_patterns(df)
        if not patterns:
            print("No repeating patterns found.")
            return

        self.save_to_chroma(patterns)


if __name__ == "__main__":
    agent = PatternDetectorAgent()
    agent.run()