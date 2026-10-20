from typing import TypedDict
from langgraph.graph import StateGraph, END
from llm.models import execute_with_llm
from llm.prompts import AGENT_SYNTHESIZE_PROMPT, AGENT_CRITIC_PROMPT, PREFERENCE_EXTRACTION_PROMPT
from rag.retriever import search_project_chunks
from database.memory_db import get_preferences, add_preference

class AgentState(TypedDict):
    project_id: str
    question: str
    context: str
    draft: str
    feedback: str
    loop_count: int
    user_preferences: str

def research_node(state: AgentState):
    print("Agent: Researcher fetching chunks...")
    retrieved = search_project_chunks(state["project_id"], state["question"], top_k=5)
    context_str = ""
    for chunk in retrieved:
        filename = chunk.metadata.get("filename", "Unknown")
        context_str += f"=== Paper: {filename} ===\n{chunk.page_content}\n\n"
    
    return {"context": context_str}

def synthesize_node(state: AgentState):
    print(f"Agent: Synthesizer drafting (Loop {state.get('loop_count', 0) + 1})...")
    response = execute_with_llm(AGENT_SYNTHESIZE_PROMPT, {
        "question": state["question"],
        "context": state.get("context", ""),
        "feedback": state.get("feedback", "None"),
        "user_preferences": state.get("user_preferences", "None")
    })
    return {"draft": response.content, "loop_count": state.get("loop_count", 0) + 1}

def critic_node(state: AgentState):
    print("Agent: Critic reviewing draft...")
    response = execute_with_llm(AGENT_CRITIC_PROMPT, {
        "question": state["question"],
        "draft": state.get("draft", "")
    })
    
    content = response.content.strip()
    if content.startswith("ACCEPT"):
        print("Agent: Critic ACCEPTED draft.")
        return {"feedback": "ACCEPT"}
    else:
        print(f"Agent: Critic REJECTED draft. Feedback: {content[:100]}...")
        return {"feedback": content}

def route_critic(state: AgentState):
    if state.get("feedback") == "ACCEPT":
        return "end"
    if state.get("loop_count", 0) >= 3:
        print("Agent: Max loops reached. Forcing end.")
        return "end"
    return "rewrite"

def build_agent_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("Researcher", research_node)
    workflow.add_node("Synthesizer", synthesize_node)
    workflow.add_node("Critic", critic_node)
    
    workflow.set_entry_point("Researcher")
    workflow.add_edge("Researcher", "Synthesizer")
    workflow.add_edge("Synthesizer", "Critic")
    
    workflow.add_conditional_edges(
        "Critic",
        route_critic,
        {
            "end": END,
            "rewrite": "Synthesizer"
        }
    )
    
    return workflow.compile()

agent_app = build_agent_graph()

def run_agentic_query(project_id: str, question: str):
    # Extract preference in background
    pref_response = execute_with_llm(PREFERENCE_EXTRACTION_PROMPT, {"message": question})
    extracted_pref = pref_response.content.strip()
    if extracted_pref and extracted_pref != "NONE" and "NONE" not in extracted_pref:
        print(f"Agent: Extracted new preference: {extracted_pref}")
        add_preference(extracted_pref)
        
    prefs = get_preferences()
    prefs_str = "\n".join([f"- {p}" for p in prefs]) if prefs else "None"
    
    initial_state = {
        "project_id": project_id,
        "question": question,
        "context": "",
        "draft": "",
        "feedback": "",
        "loop_count": 0,
        "user_preferences": prefs_str
    }
    
    final_state = agent_app.invoke(initial_state)
    return final_state.get("draft", "Failed to generate answer.")
