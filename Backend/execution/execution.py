# execute.py

import requests
from datetime import datetime

AGENT_URL = "http://localhost:8001"  # This is where agent.py is running

def execute_fix(fix_plan: dict):
    action = fix_plan.get("action")
    service = fix_plan.get("service")
    task = fix_plan.get("task")

    if not action:
        return {"status": "error", "message": "Missing fix_plan.action"}

    try:
        if action == "flush_dns":
            res = requests.post(f"{AGENT_URL}/flush/dns")
        elif action == "restart" and service:
            res = requests.post(f"{AGENT_URL}/restart/service", json={"service_name": service})
        elif action == "run_task" and task:
            res = requests.post(f"{AGENT_URL}/run/task", json={"task_name": task})
        elif action == "winsock_reset":
            res = requests.post(f"{AGENT_URL}/network/winsock-reset")
        elif action == "adapter_reset":
            res = requests.post(f"{AGENT_URL}/network/reset")
        else:
            return {
                "status": "error",
                "message": f"Unsupported or missing parameters: action={action}, service={service}, task={task}"
            }

        return {
            "status": "executed",
            "executed_action": action,
            "service": service,
            "task": task,
            "result": res.json(),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_agent_logs():
    try:
        res = requests.get(f"{AGENT_URL}/logs")
        return res.json()
    except Exception as e:
        return {"status": "error", "message": str(e)}
