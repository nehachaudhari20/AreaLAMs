# execution/decision.py
'''
import json
from dns_executor import DNSFixerAgent
from service_executor import ServiceRecoveryAgent

class ExecutionDecisionAgent:
    def __init__(self):
        # You can add logging or telemetry initialization here
        pass

    def decide_executor(self, anomaly):
        """
        Route the execution to the right agent based on the anomaly.
        """
        issue = anomaly.get("rca_summary", "").lower()

        if "dns" in issue or "domain" in issue:
            return "dns"
        elif "service down" in issue or "restart" in issue:
            return "service"
        else:
            return None

    def run(self, anomaly, dry_run=True):
        """
        Run the correct fixer agent based on RCA summary.
        """
        print(f"Received anomaly: {anomaly['txn_id']}")
        agent_type = self.decide_executor(anomaly)

        if agent_type == "dns":
            print("Routing to DNSFixerAgent...")
            agent = DNSFixerAgent()
            agent.run(dry_run=dry_run)

        elif agent_type == "service":
            print("Routing to ServiceRecoveryAgent...")
            agent = ServiceRecoveryAgent()
            agent.run(dry_run=dry_run)

        else:
            print("No matching execution agent found for this anomaly.")

# Sample standalone run
if __name__ == "__main__":
    # Mock anomaly input
    sample_anomaly = {
        "txn_id": "abc123",
        "rca_summary": "The DNS resolution failed due to outdated nameserver entries."
    }

    agent = ExecutionDecisionAgent()
    agent.run(sample_anomaly, dry_run=True)

'''