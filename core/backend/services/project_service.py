import uuid
from datetime import datetime
from database.json_db import projects_db, save_db

def setup_project(topic: str, context: str):
    project_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    projects_db[project_id] = {
        "topic": topic,
        "context": context,
        "papers": [],
        "chat_history": [],
        "recommendations": [],
        "related_papers": [],
        "created_at": now,
        "updated_at": now
    }
    save_db()
    return project_id

def clear_chat_history(project_id: str):
    if project_id in projects_db:
        projects_db[project_id]["chat_history"] = []
        save_db()
        return True
    return False

def delete_project(project_id: str):
    if project_id in projects_db:
        del projects_db[project_id]
        save_db()
        return True
    return False

def get_project_data(project_id: str):
    if project_id not in projects_db:
        return None
    project = projects_db[project_id]
    safe_papers = []
    for p in project.get("papers", []):
        safe_papers.append({
            "filename": p["filename"],
            "title": p.get("title", p["filename"]),
            "authors": p.get("authors", []),
            "year": p.get("year", "Unknown"),
            "abstract": p.get("abstract", ""),
            "keywords": p.get("keywords", []),
            "relevance": p.get("relevance", "Medium"),
            "reason": p.get("reason", "")
        })
    return {
        "id": project_id,
        "topic": project.get("topic", ""),
        "context": project.get("context", ""),
        "papers": safe_papers,
        "chat_history": project.get("chat_history", []),
        "recommendations": project.get("recommendations", []),
        "related_papers": project.get("related_papers", [])
    }

def get_all_projects():
    result = []
    for pid, pdata in projects_db.items():
        papers = pdata.get("papers", [])
        result.append({
            "id": pid,
            "topic": pdata.get("topic", ""),
            "context": pdata.get("context", ""),
            "papers_count": len(papers),
            "updated_at": pdata.get("updated_at", pdata.get("created_at", None))
        })
    return result
