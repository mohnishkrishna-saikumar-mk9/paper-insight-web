import os
import json
from typing import Dict, Any
import threading

os.makedirs("data", exist_ok=True)
DB_FILE = "data/projects_db.json"

db_lock = threading.Lock()

def load_db() -> Dict[str, Any]:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading DB: {e}")
    return {}

projects_db: Dict[str, Any] = load_db()

def save_db(project_id: str = None) -> None:
    """Save the projects database. If project_id is given, update its updated_at timestamp."""
    from datetime import datetime
    if project_id and project_id in projects_db:
        projects_db[project_id]["updated_at"] = datetime.utcnow().isoformat()
    with db_lock:
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(projects_db, f, indent=2)
        except Exception as e:
            print(f"Error saving DB: {e}")
