# PaperInsight AI - Comprehensive Technical Architecture & Implementation Roadmap (Phases 6-16)

This master document serves as the granular software architecture blueprint for transforming PaperInsight AI into a flagship **Autonomous Research Assistant**. It provides detailed engineering steps, file structures, library choices, and example prompts for every remaining phase.

---

## Phase 6: Figure & Table Understanding (Multimodal OCR)
### Objective
Extend the RAG engine beyond text. Research papers contain critical data in charts, graphs, and tables. We need to extract these, interpret them using Vision models, and embed their textual descriptions into the FAISS index so they can be queried semantically.

### Libraries & Dependencies
- `PyMuPDF` (already installed): For extracting image objects from the PDF binary.
- `paddleocr` or `pytesseract`: For extracting raw text from tables.
- Vision LLM API (e.g., Gemini 1.5 Pro, GPT-4o): For generating natural language descriptions of complex charts.

### Affected Files
- `core/backend/rag/parser.py`: Update to extract images alongside text.
- `core/backend/services/paper_service.py`: Handle vision-based LLM calls.
- `core/backend/rag/chunker.py`: Handle image caption chunks.

### Detailed Implementation Steps
1. **Extraction:** Inside `rag/parser.py`, iterate through every page using `pymupdf`. Identify `Image` blocks.
2. **Storage:** Save extracted images to a local directory: `core/backend/data/images/<project_id>/<paper_id>_fig_X.png`.
3. **Caption Generation:** Pass the image binary to a multimodal LLM with the prompt: 
   *"You are an expert data scientist. Describe this academic figure or table in extreme detail. What data is it conveying? What are the axes? What is the core takeaway?"*
4. **Metadata Tagging:** Chunk the resulting description. Attach metadata: `{"type": "figure", "source_image": "path/to/image.png", "page": X}`.
5. **Retrieval:** When a user asks a question, FAISS retrieves the text caption. The frontend can use the `source_image` metadata to display the actual chart alongside the chat answer.

---

## Phase 7: Multi-Paper RAG
### Objective
Currently, queries operate over a general pool of chunks. Multi-paper RAG allows the system to execute targeted comparative queries (e.g., "Compare the methodology of Paper A and Paper B").

### Affected Files
- `core/backend/rag/retriever.py`
- `core/backend/rag/generator.py`
- `core/backend/llm/prompts.py`

### Detailed Implementation Steps
1. **Targeted Retrieval:** Update `search_project_chunks` in `retriever.py` to accept a `filter_metadata` dictionary. This allows FAISS to retrieve chunks *only* from specific filenames.
2. **Entity Extraction (Pre-Retrieval):** When a user asks "Compare Paper A and Paper B", use an LLM router to extract the targeted paper names from the user's query.
3. **Parallel Search:** Perform a separate hybrid search for Paper A, and a separate hybrid search for Paper B.
4. **Context Formatting:** Merge the results in `generator.py` like this:
   ```
   [Context from Paper A]
   - Chunk 1...
   - Chunk 2...
   
   [Context from Paper B]
   - Chunk 1...
   - Chunk 2...
   ```
5. **Prompting:** Use a new `MULTI_PAPER_COMPARE_PROMPT`: 
   *"Compare and contrast the methodologies based on the provided context. You MUST structure your answer with sections: Similarities, Differences, and Conclusion. Cite both papers."*

---

## Phase 8: Research Gap Generator
### Objective
Move from answering questions to generating novel insights. The system will autonomously scan papers to find acknowledged limitations and future work, proposing new research directions.

### Detailed Implementation Steps
1. **The 'Gap' Sub-Query:** Create a dedicated API route `/api/project/{id}/generate_gaps`.
2. **Vector Space Mapping:** We don't wait for the user to ask. The system automatically searches the FAISS index using predefined semantic vectors: `"limitations", "drawbacks", "future work", "unsolved problems", "dataset bias"`.
3. **Synthesis Engine:** All chunks retrieved from these queries are fed into `GAP_DETECTION_PROMPT`.
4. **Structured JSON Output:** The LLM must output a strictly typed JSON array:
   ```json
   [
     {
       "identified_gap": "Lack of diverse training data",
       "source_papers": ["Attention Is All You Need"],
       "proposed_research_direction": "Train a similar architecture on non-English datasets.",
       "expected_impact": "High"
     }
   ]
   ```
5. **Frontend Integration:** Display these gaps in a dedicated dashboard tab, allowing the user to click "Start Draft" on a specific gap.

---

## Phase 9: Literature Review Generator
### Objective
Automate the most tedious part of academic research. The system will read all uploaded papers, group them logically, and write a formatted literature review.

### Detailed Implementation Steps
1. **Chronological Sorting:** Fetch metadata for all papers in `projects_db.json`. Sort them strictly by `Year` (oldest to newest).
2. **Core Concept Grouping:** Use a lightweight clustering algorithm (or an LLM classification step) to group papers by their `keywords` (extracted in Phase 5).
3. **Iterative Drafting (Chunked LLM Calls):** A literature review of 20 papers exceeds most context windows. 
   - **Step A:** Summarize Papers 1-5.
   - **Step B:** Summarize Papers 6-10.
   - **Step C:** Feed summaries A and B into a final LLM call to stitch them together with transition sentences.
4. **Plagiarism Prevention:** The `LITERATURE_REVIEW_PROMPT` must explicitly command: *"Paraphrase extensively. Do not copy sentences verbatim from the context. Use academic tone."*

---

## Phase 10: Knowledge Graph
### Objective
Vector databases (FAISS) are bad at answering relational queries like *"Which authors cite this specific paper?"* or *"What datasets are used most often?"*. A Knowledge Graph solves this.

### Libraries & Dependencies
- `Neo4j` (Requires local Neo4j desktop or Docker container)
- `langchain-community` (Neo4jGraph integration)

### Detailed Implementation Steps
1. **Entity Extraction (On Upload):** Update `paper_service.py`. When a paper is uploaded, run an LLM prompt: *"Extract all mentioned Datasets, Algorithms, and Metrics."*
2. **Graph Population:** Write Cypher queries to create nodes and edges:
   - `MERGE (p:Paper {title: "X"})`
   - `MERGE (d:Dataset {name: "MNIST"})`
   - `MERGE (p)-[:USES_DATASET]->(d)`
3. **Graph QA Chain:** When the user asks a relational question, the LLM converts the user's natural language into a Cypher query, executes it against Neo4j, and returns the exact relational data.

---

## Phase 11: AI Agents (LangGraph)
### Objective
Replace the hard-coded RAG script in `generator.py` with an autonomous, cyclic reasoning engine.

### Libraries & Dependencies
- `langgraph`

### Detailed Implementation Steps
1. **Define State:** Create a `TypedDict` for the agent's state containing: `query`, `retrieved_docs`, `draft_answer`, `errors`, `iterations`.
2. **Create Nodes (Functions):**
   - `Node 1: Plan`: Deconstructs complex queries.
   - `Node 2: Retrieve`: Calls FAISS and Neo4j.
   - `Node 3: Generate`: Drafts the answer.
   - `Node 4: Critique`: A separate LLM call that asks: *"Does this draft answer the query accurately based on the docs?"*
3. **Create Edges (Routing):** If the Critique node returns "Fail", loop back to `Node 2` with a modified search query. If "Pass", end the graph.
4. **Execution:** Compile the graph and stream the step-by-step reasoning tokens to the frontend so the user can watch the AI "think".

---

## Phase 12: Memory
### Objective
Allow the system to remember what was discussed 10 messages ago.

### Detailed Implementation Steps
1. **Database Update:** Add `sqlite3` integration. Replace `projects_db.json` chat history with an SQLite table: `Messages(id, project_id, role, content, timestamp)`.
2. **Context Window Management:** Before passing history to the LLM, use a `ConversationSummaryBufferMemory` approach. 
   - If history > 2000 tokens, trigger a background LLM call to summarize the oldest messages into a single paragraph.
3. **Injection:** Prepend this summary to the system prompt: *"Summary of previous conversation: The user is investigating CNNs. They have discarded RNNs as an option."*

---

## Phase 13: Citation Verification
### Objective
Zero hallucinations. Every claim must be mathematically linked to a specific sentence in a PDF.

### Detailed Implementation Steps
1. **Generation:** When the LLM generates an answer, it must output inline citations like `[Chunk_ID: 1234-5678]`.
2. **Post-Processing (Verifier):** Intercept the output before sending to the frontend.
3. **Cross-Encoder Validation:** Take the generated sentence and the cited chunk. Pass them through a Cross-Encoder (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2`) to get a logical entailment score (0.0 to 1.0).
4. **Redaction:** If the score is below 0.6, the system redacts the claim and replaces it with: *"[Warning: AI generated a claim that could not be verified in the source text]"*.

---

## Phase 14: Recommendation System
### Objective
Act as a true librarian by finding papers the user hasn't even uploaded yet.

### Detailed Implementation Steps
1. **Project Centroid:** Calculate the average embedding vector of all paper abstracts currently in the project. This represents the "Project Vector".
2. **External API Integration:** Connect to the `Semantic Scholar Graph API`.
3. **Querying:** Periodically ping the API with keywords from the project.
4. **Scoring:** Embed the abstracts of the results returned by Semantic Scholar. Calculate Cosine Similarity against the "Project Vector".
5. **UI Rendering:** Display a "Recommended Reading" sidebar on the frontend with links to the PDFs.

---

## Phase 15: Deep Research Mode (Flagship Feature)
### Objective
An intensive, long-running (10+ minute) agent that simulates an entire week of human literature review.

### Detailed Implementation Steps
1. **Asynchronous Execution:** Must be run as a background `Celery` worker or similar task queue.
2. **The Loop:**
   - Agent generates 20 different search queries based on the project topic.
   - Agent executes queries and reads hundreds of chunks.
   - Agent maintains a "Scratchpad" in SQLite, taking notes on findings.
   - Agent writes a 5,000-word comprehensive markdown report with sections, citations, and analysis.
3. **WebSocket Streaming:** The backend streams live status logs (`"Searching for X..."`, `"Reading Paper Y..."`, `"Drafting section Z..."`) to the frontend so the user knows it hasn't frozen.

---

## Phase 16: Autonomous Research Assistant
### Objective
The final orchestration. Tie all features into a unified, seamless user experience.

### Detailed Implementation Steps
1. **Semantic Router:** Use `semantic-router` or an LLM classifier to determine user intent from a single text box.
   - Intent A: `Generate Literature Review` -> Triggers Phase 9 background task.
   - Intent B: `Deep Research` -> Triggers Phase 15.
   - Intent C: `Specific Question` -> Triggers Phase 11 LangGraph Agent.
2. **Final Polish:** Ensure all metadata, vectors, graphs, and chat histories are cleanly namespaced by `project_id`. Add robust error handling, loading states, and export options (Export to PDF/Word) for the generated reports.
