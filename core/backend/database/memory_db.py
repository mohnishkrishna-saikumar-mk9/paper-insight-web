import json
import os

MEMORY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "user_memory.json")

def load_memory():
    if os.path.exists(MEMORY_PATH):
        with open(MEMORY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"preferences": []}

def save_memory(data):
    os.makedirs(os.path.dirname(MEMORY_PATH), exist_ok=True)
    with open(MEMORY_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

def add_preference(preference: str):
    data = load_memory()
    if preference not in data["preferences"]:
        data["preferences"].append(preference)
        save_memory(data)

def get_preferences():
    return load_memory().get("preferences", [])
