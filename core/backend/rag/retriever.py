import os
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from rag.embedding import get_embeddings
from typing import List

# Phase 3 imports for Hybrid Search
from langchain_community.retrievers import BM25Retriever

FAISS_BASE_DIR = "data/faiss_indexes"
os.makedirs(FAISS_BASE_DIR, exist_ok=True)

def get_index_path(project_id: str) -> str:
    return os.path.join(FAISS_BASE_DIR, f"project_{project_id}")

def get_vectorstore(project_id: str) -> FAISS:
    embeddings = get_embeddings()
    index_path = get_index_path(project_id)
    if os.path.exists(index_path):
        return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
    
    # Return an empty FAISS index
    dummy_vs = FAISS.from_texts([""], embeddings)
    dummy_vs.delete([dummy_vs.index_to_docstore_id[0]])
    return dummy_vs

def save_vectorstore(project_id: str, vectorstore: FAISS):
    index_path = get_index_path(project_id)
    vectorstore.save_local(index_path)

def add_chunks_to_project(project_id: str, chunks: List[Document]):
    if not chunks:
        return
    vectorstore = get_vectorstore(project_id)
    vectorstore.add_documents(chunks)
    save_vectorstore(project_id, vectorstore)

def reciprocal_rank_fusion(faiss_results, bm25_results, k=60, alpha=0.5):
    rrf_scores = {}
    
    # faiss_results gets alpha weight
    for rank, doc in enumerate(faiss_results):
        chunk_id = doc.metadata.get("chunk_id", doc.page_content[:50])
        if chunk_id not in rrf_scores:
            rrf_scores[chunk_id] = {"score": 0.0, "doc": doc}
        rrf_scores[chunk_id]["score"] += alpha * (1.0 / (rank + 1 + k))
        
    # bm25_results gets (1 - alpha) weight
    for rank, doc in enumerate(bm25_results):
        chunk_id = doc.metadata.get("chunk_id", doc.page_content[:50])
        if chunk_id not in rrf_scores:
            rrf_scores[chunk_id] = {"score": 0.0, "doc": doc}
        rrf_scores[chunk_id]["score"] += (1.0 - alpha) * (1.0 / (rank + 1 + k))
        
    fused_docs = sorted(rrf_scores.values(), key=lambda x: x["score"], reverse=True)
    return [item["doc"] for item in fused_docs]

def search_project_chunks(project_id: str, query: str, top_k: int = 5, filter_filename: str = None) -> List[Document]:
    index_path = get_index_path(project_id)
    if not os.path.exists(index_path):
        return []
        
    vectorstore = get_vectorstore(project_id)
    
    search_kwargs = {"k": top_k}
    if filter_filename:
        # Some FAISS versions use a callable for filtering, but Langchain FAISS handles dict filters by checking metadata
        search_kwargs["filter"] = {"filename": filter_filename}
        
    # 1. Semantic Search (FAISS)
    try:
        faiss_retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)
        faiss_results = faiss_retriever.invoke(query)
    except Exception as e:
        print(f"FAISS search failed (possibly filter syntax): {e}")
        faiss_results = []
    
    # Extract all stored chunks from FAISS docstore
    all_docs = list(vectorstore.docstore._dict.values())
    
    # Apply filter to BM25 candidate pool
    if filter_filename:
        all_docs = [d for d in all_docs if d.metadata.get("filename") == filter_filename]
        
    if not all_docs:
        return faiss_results
        
    # 2. Keyword Search (BM25)
    bm25_retriever = BM25Retriever.from_documents(all_docs)
    bm25_retriever.k = top_k
    bm25_results = bm25_retriever.invoke(query)
    
    # Get custom alpha from DB if set
    from database.json_db import projects_db
    alpha = 0.5
    if project_id in projects_db and "hybrid_alpha" in projects_db[project_id]:
        alpha = projects_db[project_id]["hybrid_alpha"]
        
    # 3. Hybrid Search (Manual RRF)
    final_results = reciprocal_rank_fusion(faiss_results, bm25_results, alpha=alpha)
    
    return final_results[:top_k]
