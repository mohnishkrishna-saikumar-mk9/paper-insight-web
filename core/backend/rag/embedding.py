import os
from langchain_community.embeddings import HuggingFaceEmbeddings

# Create a singleton embedding model to avoid reloading on every request
_embeddings_instance = None

def get_embeddings():
    global _embeddings_instance
    if _embeddings_instance is None:
        # We use all-MiniLM-L6-v2 as specified in Phase 1 roadmap
        model_name = "sentence-transformers/all-MiniLM-L6-v2"
        model_kwargs = {'device': 'cpu'}
        encode_kwargs = {'normalize_embeddings': True}
        _embeddings_instance = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs
        )
    return _embeddings_instance
