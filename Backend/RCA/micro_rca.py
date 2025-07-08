'''
import pandas as pd

class MicroRCAAgent:
    def __init__(self, trace_df):
        self.trace_df = trace_df

    def run(self):
        if self.trace_df.empty:
            print("⚠️ Trace is empty. Skipping RCA.")
            return []

        if len(self.trace_df) == 1:
            print("🔍 Only one span in trace. Flagging as potential root cause.")
            return self.trace_df[["service", "latency_ms", "error_code", "timestamp"]].to_dict(orient="records")

        # Compute mean and std deviation
        mean_latency = self.trace_df["latency_ms"].mean()
        std_latency = self.trace_df["latency_ms"].std()

        print(f"📊 Mean latency: {mean_latency:.2f}, Std Dev: {std_latency:.2f}")

        # Threshold-based filtering
        threshold = mean_latency + 0.75 * std_latency
        suspicious = self.trace_df[
            (self.trace_df["latency_ms"] > threshold) | 
            (self.trace_df["latency_ms"] > 3500)  # hard upper bound
        ]

        if suspicious.empty:
            print("⚠️ No suspicious spans found.")
            return []

        root_causes = suspicious[["service", "latency_ms", "error_code", "timestamp"]]
        print(f"✅ Identified {len(root_causes)} potential root spans.")
        return root_causes.to_dict(orient="records")
'''