# AI Architecture & RAG Pipeline (PaperInsight)

PaperInsight leverages a highly optimized Retrieval-Augmented Generation (RAG) architecture powered by cutting-edge Open-Source LLMs and Groq's high-speed inference engine.

## 1. Large Language Models (LLMs) Used

We are currently utilizing **1 primary AI model** across the entire stack, accessed via the `ChatGroq` integration in LangChain.

- **Model:** `llama-3.1-8b-instant` (Meta LLaMA 3.1 8B)
- **Provider:** Groq
- **Why this model?** LLaMA 3.1 8B offers an incredible balance of zero-shot reasoning capabilities, deep scientific comprehension, and blazing fast inference speeds (especially when running on Groq's LPUs). This ensures that complex document evaluation, RAG question-answering, and search-query generation happen in milliseconds rather than seconds.

## 2. RAG (Retrieval-Augmented Generation) Architecture

The application implements a unique, context-aware RAG pipeline broken down into several distinct phases:

### A. Zero-Shot Relevance Evaluation
When a user uploads a PDF, the system does not immediately vectorize it blindly. Instead, it uses the LLM as an intelligent filter:
1. **Extraction:** PyPDF is used to extract raw text from the document.
2. **Evaluation:** The LLM is given the user's *Project Topic*, *Research Context*, and an excerpt from the paper.
3. **Scoring:** The LLM evaluates the paper and strictly categorizes it as `High`, `Medium`, or `Low` relevance, outputting the reasoning in a structured JSON format. Only High/Medium papers are accepted into the RAG context pool.

### B. Context-Aware Chatbot (RAG)
The Project Chatbot acts as an expert research assistant. 
1. **Context Construction:** Unlike traditional RAG that relies entirely on vector-similarity search over thousands of chunks, our system currently employs a **Naive Chunking + Full Context Injection** approach. Because research projects often rely on synthesizing a few core, highly relevant papers, we dynamically assemble a massive prompt containing the user's core Project Context *and* the top excerpts (first 4,000 chars) of their Highly/Medium relevant papers.
2. **Inference:** The LLM is prompted to strictly use the provided excerpts to answer the user's queries, ensuring zero hallucination.

### C. Project Analysis & Literature Recommendation
The Analysis engine runs two concurrent RAG tasks:
1. **Search Optimization:** The LLM analyzes the user's context to generate 3 highly optimized Boolean search queries for databases like Google Scholar and IEEE Xplore.
2. **Literature Recommendation:** The LLM acts as a University Librarian, recommending fictional but structurally accurate examples of related literature, complete with computed "Impact Scores" tailored to the user's exact context.

## Summary of Technologies
- **LangChain Core & LangChain Groq:** Orchestration and Prompt Templates.
- **Llama 3.1 8B:** The sole intelligence engine driving evaluations, chatbot interactions, and insights.
- **PyPDF:** Document parsing.
