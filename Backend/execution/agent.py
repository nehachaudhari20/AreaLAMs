# agent.py

import platform
import subprocess
import os
import time
from datetime import datetime

IS_WINDOWS = platform.system().lower() == "windows"
LOGS = []

def is_admin():
    if IS_WINDOWS:
        try:
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin()
        except:
            return False
    return os.geteuid() == 0

def run_command(command_list):
    if not IS_WINDOWS and not is_admin():
        command_list.insert(0, "sudo")
    try:
        output = subprocess.check_output(command_list, stderr=subprocess.STDOUT, text=True)
        return {"status": "success", "output": output.strip()}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "output": e.output.strip()}

def restart_service(service_name: str):
    timestamp = datetime.now().isoformat()
    if IS_WINDOWS:
        stop_result = run_command(["sc", "stop", service_name])
        if stop_result["status"] == "success" or "1062" in stop_result.get("output", ""):
            for _ in range(30):
                query_result = run_command(["sc", "query", service_name])
                if query_result["status"] == "success" and "STOPPED" in query_result["output"]:
                    break
                time.sleep(1)
            else:
                return {"status": "error", "output": f"Service '{service_name}' did not stop."}
        start_result = run_command(["sc", "start", service_name])
        result = {
            "status": "partial" if start_result["status"] == "error" else "success",
            "output": {
                "initial_stop_result": stop_result,
                "final_start_result": start_result
            }
        }
    else:
        result = run_command(["systemctl", "restart", service_name])
    LOGS.append({"time": timestamp, "action": "restart", "target": service_name, "result": result})
    return result

def flush_dns():
    timestamp = datetime.now().isoformat()
    result = run_command(["ipconfig", "/flushdns"] if IS_WINDOWS else ["resolvectl", "flush-caches"])
    LOGS.append({"time": timestamp, "action": "flush_dns", "result": result})
    return result

def run_task(task_name: str):
    timestamp = datetime.now().isoformat()
    if IS_WINDOWS:
        result = run_command(["schtasks", "/Run", "/TN", task_name])
    else:
        result = {"status": "error", "output": "Task Scheduler not supported on Linux"}
    LOGS.append({"time": timestamp, "action": "run_task", "target": task_name, "result": result})
    return result

def network_reset():
    timestamp = datetime.now().isoformat()
    if IS_WINDOWS:
        if not is_admin():
            return {"status": "error", "output": "Administrator privileges required"}
        ps_command = "Get-NetAdapter | Where-Object {$_.Status -ne 'Not Present'} | Restart-NetAdapter -Confirm:$false"
        result = run_command(["powershell", "-Command", ps_command])
    else:
        result = {"status": "error", "output": "Only implemented on Windows"}
    LOGS.append({"time": timestamp, "action": "network_reset", "result": result})
    return result

def reset_winsock():
    timestamp = datetime.now().isoformat()
    if IS_WINDOWS:
        if not is_admin():
            return {"status": "error", "output": "Administrator privileges required"}
        result = run_command(["netsh", "winsock", "reset"])
        if result["status"] == "success":
            result["output"] += "\n\nRestart required to complete Winsock reset."
            result["restart_required"] = True
    else:
        result = {"status": "error", "output": "Only implemented on Windows"}
    LOGS.append({"time": timestamp, "action": "winsock_reset", "result": result})
    return result

def get_logs():
    return {"logs": LOGS}

def whoami():
    return {
        "is_windows": IS_WINDOWS,
        "is_admin": is_admin(),
        "user": os.environ.get("USERNAME") if IS_WINDOWS else os.getlogin()
    }
