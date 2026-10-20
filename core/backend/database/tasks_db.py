import json
import os
import uuid
from datetime import datetime

import threading

TASKS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "tasks_db.json")
_lock = threading.Lock()

def load_tasks():
    if os.path.exists(TASKS_PATH):
        try:
            with open(TASKS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading tasks_db: {e}")
    return {}

def save_tasks(data):
    os.makedirs(os.path.dirname(TASKS_PATH), exist_ok=True)
    with open(TASKS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def create_task(project_id: str, topic: str):
    task_id = str(uuid.uuid4())
    with _lock:
        tasks = load_tasks()
        tasks[task_id] = {
            "task_id": task_id,
            "project_id": project_id,
            "topic": topic,
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "report": None,
            "logs": []
        }
        save_tasks(tasks)
    return task_id

def append_task_log(task_id: str, log_msg: str):
    with _lock:
        tasks = load_tasks()
        if task_id in tasks:
            if "logs" not in tasks[task_id]:
                tasks[task_id]["logs"] = []
            tasks[task_id]["logs"].append(log_msg)
            save_tasks(tasks)

def update_task_status(task_id: str, status: str, report: str = None):
    with _lock:
        tasks = load_tasks()
        if task_id in tasks:
            tasks[task_id]["status"] = status
            if report:
                tasks[task_id]["report"] = report
            save_tasks(tasks)

def update_task_plan(task_id: str, plan: list):
    with _lock:
        tasks = load_tasks()
        if task_id in tasks:
            tasks[task_id]["plan"] = plan
            save_tasks(tasks)

def get_task(task_id: str):
    with _lock:
        tasks = load_tasks()
        return tasks.get(task_id)

def get_project_tasks(project_id: str):
    with _lock:
        tasks = load_tasks()
        project_tasks = []
        for task_id, task in tasks.items():
            if task.get("project_id") == project_id:
                # We don't want to send huge reports in the list endpoint, just metadata
                project_tasks.append({
                    "task_id": task["task_id"],
                    "topic": task["topic"],
                    "status": task["status"],
                    "created_at": task["created_at"]
                })
        # Sort descending by created_at
        project_tasks.sort(key=lambda x: x["created_at"], reverse=True)
        return project_tasks

def delete_task(task_id: str) -> bool:
    with _lock:
        tasks = load_tasks()
        if task_id in tasks:
            del tasks[task_id]
            save_tasks(tasks)
            return True
        return False
