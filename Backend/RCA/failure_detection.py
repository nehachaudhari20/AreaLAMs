import pandas as pd
from memory.db import get_engine
import json

from sqlalchemy import Table, MetaData
from sqlalchemy.dialects.mysql import insert as mysql_insert
from vectordb.add_to_db import add_failure_summary

class FailureDetectionAgent:
    def __init__(self):
        self.engine = get_engine()

    def load_logs(self):
        query = """
        SELECT *,
               error_count / NULLIF(total_requests, 0) AS error_rate
        FROM new_uploaded_data
        WHERE status='fail' AND latency_ms IS NOT NULL
        """
        df = pd.read_sql(query, self.engine)
        df['error_rate'] = df['error_rate'].fillna(0)
        return df

    def detect_anomalies(self, df):
        metrics = ['latency_ms', 'error_rate', 'cpu', 'memory']
        threshold = 1.5
        all_anomalies = []

        for metric in metrics:
            if metric not in df.columns:
                continue
            mean_val = df[metric].mean()
            std_val = df[metric].std()
            if std_val == 0 or pd.isna(std_val):
                print(f"No variance in {metric} - skipping anomaly detection for this metric.")
                continue

            df[f'z_score_{metric}'] = (df[metric] - mean_val) / std_val
            anomalies = df[df[f'z_score_{metric}'] > threshold]

            print(f"Metric: {metric}, Mean: {mean_val:.2f}, Std: {std_val:.2f}, Anomalies found: {len(anomalies)}")

            for _, row in anomalies.iterrows():
                all_anomalies.append({
                    "status": "anomaly_detected",
                    "txn_id": row["txn_id"],
                    "service": row["service"],
                    "metric": metric,
                    "value": row[metric],
                    "timestamp": str(row["timestamp"]),
                    "z_score": round(row[f'z_score_{metric}'], 2)
                })

        return all_anomalies

    def format_output(self, anomalies):
        return anomalies

    def run(self):
        df = self.load_logs()
        if df.empty:
            print("No failed transactions with latency found.")
            return []

        anomalies = self.detect_anomalies(df)
        if not anomalies:
            print("No anomalies detected based on z-score threshold.")
            return []

        formatted = self.format_output(anomalies)
        print(json.dumps(formatted, indent=2))
        return formatted

    def save_anomalies(self, anomalies):
        metadata = MetaData()
        metadata.reflect(bind=self.engine)
        table = metadata.tables.get("anomaly_logs")

        if table is None:
            print("Table anomaly_logs not found.")
            return

        with self.engine.connect() as conn:
            for anomaly in anomalies:
                stmt = mysql_insert(table).values(
                    txn_id=anomaly["txn_id"],
                    service=anomaly["service"],
                    metric=anomaly["metric"],
                    value=anomaly["value"],
                    timestamp=anomaly["timestamp"],
                    z_score=anomaly["z_score"]
                )
                conn.execute(stmt)
            conn.commit()
        print(f"{len(anomalies)} anomalies saved to MySQL.")

        # Also store fingerprint to Chroma
        for anomaly in anomalies:
            summary = f"{anomaly['service']} {anomaly['metric']} anomaly: {anomaly['value']} at {anomaly['timestamp']}"
            add_failure_summary(summary, anomaly['txn_id'], anomaly['service'], f"{anomaly['metric']}_spike")

if __name__ == "__main__":
    agent = FailureDetectionAgent()
    anomalies = agent.run()
    if anomalies:
        agent.save_anomalies(anomalies)