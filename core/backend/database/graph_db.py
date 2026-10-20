import json
import os

GRAPH_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "graphs")
os.makedirs(GRAPH_DIR, exist_ok=True)

def get_graph_path(project_id: str):
    return os.path.join(GRAPH_DIR, f"{project_id}_graph.json")

def load_graph(project_id: str):
    path = get_graph_path(project_id)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"nodes": [], "edges": []}

def save_graph(project_id: str, graph_data: dict):
    path = get_graph_path(project_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(graph_data, f, indent=4)

def merge_graph_data(project_id: str, new_nodes: list, new_edges: list):
    graph = load_graph(project_id)
    
    # Merge nodes (by id)
    existing_node_ids = {n["id"] for n in graph["nodes"]}
    for node in new_nodes:
        if node.get("id") and node["id"] not in existing_node_ids:
            graph["nodes"].append(node)
            existing_node_ids.add(node["id"])
            
    # Merge edges (by source, target, relation)
    existing_edges = {(e.get("source"), e.get("target"), e.get("relation", "")) for e in graph["edges"]}
    for edge in new_edges:
        key = (edge.get("source"), edge.get("target"), edge.get("relation", ""))
        if key not in existing_edges and edge.get("source") and edge.get("target"):
            graph["edges"].append(edge)
            existing_edges.add(key)
            
    save_graph(project_id, graph)
    return graph
