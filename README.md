<div align="center">

# 📚 PaperInsight AI
### *Autonomous Agentic Research Assistant with Local Grounded RAG & Deep Literature Synthesis*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-Orchestration-1C3C3C?style=for-the-badge)](https://langchain.com/)
[![FAISS](https://img.shields.io/badge/FAISS-Vector%20Database-blue?style=for-the-badge)](https://github.com/facebookresearch/faiss)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local%20Index-success?style=for-the-badge)](./docs/TECHNICAL_DOCUMENTATION.md)

<p align="center">
  <b>PaperInsight AI</b> accelerates scientific discovery by transforming complex academic literature into actionable research intelligence. Featuring zero-cloud vector storage, multi-agent synthesis, automated literature matrices, and grounded citation verification.
</p>

[System Architecture](#-system-architecture) • [Work Progress & Screenshots](#-work-progress--visual-walkthrough) • [Key Features](#-key-features) • [Quick Start](#-quick-start) • [Folder Structure](#-folder-structure) • [Documentation](#-project-documentation)

---

</div>

## 📌 Executive Summary

Modern scientific research demands sifting through hundreds of dense, multi-column PDF manuscripts, evaluating conflicting methodologies, and manually synthesizing findings. Traditional cloud-based AI tools risk exposing proprietary datasets or unpublished manuscripts to third parties.

**PaperInsight AI** is engineered from the ground up as a **privacy-first, locally hosted academic workbench**:
- **Local Ingestion & Indexing:** PDF parsing (`PyMuPDF`) and vector embeddings (`all-MiniLM-L6-v2`) run entirely in-memory on your local hardware using FAISS.
- **Agentic Deep Research:** Autonomous multi-step research agent that decomposes research hypotheses, queries literature iteratively, and synthesizes publishable reports.
- **Methodology Debates & Matrices:** Synthetically contrasts opposing academic papers to surface contradictions, algorithmic trade-offs, and research gaps.
- **Hallucination Prevention:** Strict prompt engineering with confidence scoring and interactive source citation chips linking directly to paper excerpts.

---

## 🏗️ System Architecture

PaperInsight operates on a decoupled client-server architecture with zero external database dependencies. All indexes and databases reside strictly on the local filesystem.

<div align="center">
  <img src="./screenshots/01_architecture_diagram.png" alt="PaperInsight System Architecture" width="950" />
  <p><i>Figure 1: Full-stack Architectural Topology (Frontend, FastAPI Services, Local Storage & Inference Pipeline)</i></p>
</div>

### Architectural Highlights
1. **Frontend Layer (Next.js 14):** Modern React App Router interface built with custom dark/light UI tokens, fluid typography (`Hanken Grotesk` & `Literata`), optimistic UI updates, and real-time polling.
2. **API & Routing (FastAPI + Uvicorn):** High-throughput asynchronous endpoints handling authentication, paper binary ingestion, vector queries, and task orchestration.
3. **Local RAG Pipeline:**
   - **Parser:** `PyMuPDF` extracts multi-column text while filtering noise and headers.
   - **Chunker:** Recursive character chunking (1000 chars, 200 overlap) preserves semantic boundaries.
   - **Embedder:** `sentence-transformers/all-MiniLM-L6-v2` produces 384-dimensional dense vectors locally.
   - **Vector Store:** In-memory `FAISS` index per research project enabling sub-millisecond similarity retrieval.
4. **LLM Orchestration:** Supports **OmniRoute** local proxy load-balancing and fallback across state-of-the-art models (Claude 3.7 / 3.5 Sonnet, Llama 3.1 8B/70B, GPT-4o, GLM-5).

---

## 📸 Work Progress & Visual Walkthrough

> **Note:** The following progress figures represent verified experimental results and test workflows conducted on real-world academic papers (Traffic Sign Recognition with Deep Learning) as documented in the technical project report.

### Phase 1: Project Scoping & Workspace Creation
Define isolated research workspaces with custom domain topics and contextual problem statements.

| Empty Dashboard Overview | New Research Project Modal |
| :---: | :---: |
| ![Figure 2: Dashboard](./screenshots/02_project_dashboard_empty.png) | ![Figure 3: New Project Dialog](./screenshots/03_create_project_modal.png) |
| *Figure 2: Clean dashboard showing active projects and provider status.* | *Figure 3: Configuring topic scope and specific research context.* |

---

### Phase 2: PDF Document Ingestion & Local Indexing
Users drag and drop PDF files directly into the workspace. Ingestion parses text and generates vector embeddings synchronously—indexing 8+ academic papers in under 3 seconds.

| Workspace Initial View | PDF Batch Selection | Indexed Papers Ready |
| :---: | :---: | :---: |
| ![Figure 4: Workspace](./screenshots/04_project_workspace_initial.png) | ![Figure 5: Upload](./screenshots/05_pdf_batch_upload.png) | ![Figure 6: Indexed](./screenshots/06_papers_indexed_and_ready.png) |
| *Figure 4: Workspace before files are uploaded.* | *Figure 5: Batch selection of multi-column PDF files.* | *Figure 6: Eight papers indexed with relevance scoring.* |

---

### Phase 3: Grounded RAG Chat with Citation & Confidence Tracking
Query the indexed literature conversationally. Every claim is attributed to specific paper sources with automated confidence scoring.

| Comparative Chat Output | Confidence Score & Attribution |
| :---: | :---: |
| ![Figure 7: Chat Table](./screenshots/07_grounded_rag_chat_table.png) | ![Figure 8: Confidence](./screenshots/08_confidence_score_sources.png) |
| *Figure 7: RAG chat generating structured comparative tables across models.* | *Figure 8: Verification chip showing high confidence and cited sources.* |

---

### Phase 4: Autonomous Multi-Step Deep Research Agent
Enter a complex research question. The agent autonomously designs a multi-point investigation plan, searches the vector index for each point, and synthesizes a comprehensive academic report.

| 1. Deep Research Setup | 2. Agentic Research Planning |
| :---: | :---: |
| ![Figure 9: Topic Entry](./screenshots/09_deep_research_setup.png) | ![Figure 10: Plan Execution](./screenshots/10_agentic_research_planning.png) |
| *Figure 9: Prompting the deep research agent with a broad goal.* | *Figure 10: Agent executing sub-queries step-by-step with live status.* |

| 3. Real-Time Report Synthesis | 4. Final Comprehensive Synthesis |
| :---: | :---: |
| ![Figure 11: Synthesis](./screenshots/11_live_report_synthesis.png) | ![Figure 12: Final Report](./screenshots/12_comprehensive_research_report.png) |
| *Figure 11: Real-time synthesis combining retrieved literature context.* | *Figure 12: Completed academic report with Markdown export and history save.* |

---

### Phase 5: Automated Literature Review & Historical Vault
Synthesize comprehensive literature review tables and store historical syntheses for instant recall.

| Tabular Literature Review Matrix | Historical Research Vault Explorer |
| :---: | :---: |
| ![Figure 13: Literature Review](./screenshots/13_tabular_literature_review.png) | ![Figure 14: History](./screenshots/14_historical_vault_explorer.png) |
| *Figure 13: Generating structured matrices (Methods, Limitations, Gaps).* | *Figure 14: History explorer retrieving past deep research reports.* |

---

## ⚡ Key Features

- [x] **Zero-Cloud Local Ingestion:** Full PDF parsing and vector indexing without cloud data exposure.
- [x] **In-Memory FAISS Vector Database:** Blazing-fast L2 similarity search over dense 384D embeddings.
- [x] **Autonomous Deep Research Engine:** Multi-stage planning and execution producing complete literature reviews.
- [x] **Methodology Debate Simulation:** Contrasts opposing claims and experimental setups between conflicting papers.
- [x] **Research Gap Detection:** Identifies unaddressed limitations across related literature pools.
- [x] **Interactive Source Attribution:** Clickable citation chips highlight the exact passage in the source paper.
- [x] **Silent Windows Launcher:** One-click launch with background daemonization and auto-browser opening.
- [x] **OmniRoute & Multi-Model Inference:** Seamless failover between Groq (Llama 3.1), Anthropic (Claude), and OpenAI (GPT-4o).

---

## 📂 Folder Structure

The repository is cleanly structured following modern monorepo and software engineering conventions:

```text
paper-insight-web/
├── PaperInsight.bat                # 🚀 One-click Windows launcher & auto-installer
├── Stop-Servers.bat                # 🛑 One-click graceful background server shutdown
├── docker-compose.yml              # 🐳 Multi-container Docker deployment configuration
├── LICENSE                         # 📄 MIT Open-Source License
├── README.md                       # 📖 Showcase documentation with visual progress
├── .gitignore                      # 🛡️ Hardened ignore rules (protects API keys & data)
│
├── screenshots/                    # 🖼️ High-resolution figures from the research report
│   ├── 01_architecture_diagram.png
│   ├── 02_project_dashboard_empty.png
│   ├── ...
│   └── 14_historical_vault_explorer.png
│
├── docs/                           # 📚 Comprehensive technical specifications & reports
│   ├── PROJECT_REPORT.md           # Full academic project report & benchmarks
│   ├── TECHNICAL_DOCUMENTATION.md  # System architecture & engineering specification
│   ├── DEEP_RESEARCH_REPORT.md     # Example deep research synthesized output
│   ├── ROADMAP_IMPLEMENTATION.md   # Architectural roadmap & future extensions
│   ├── MODEL_GUIDE.md              # Embedding & LLM integration guide
│   └── PaperInsight_Project_Report.docx
│
└── core/                           # 💻 Source Code (Frontend & Backend)
    ├── package.json                # Next.js frontend package manifest
    ├── next.config.mjs             # Next.js API rewrites & reverse proxy
    ├── .env.example                # Frontend environment template
    ├── scripts/                    # Automation utilities
    │   ├── Start-Hidden.vbs        # Silent background VBScript daemon launcher
    │   └── capture.js              # Automated browser screenshot utility
    ├── src/                        # Next.js 14 Frontend Application
    │   ├── app/                    # App Router routes (login, dashboard, project/[id])
    │   └── components/             # Reusable UI components (Navbar, Providers)
    └── backend/                    # FastAPI Backend Application
        ├── main.py                 # FastAPI application root & CORS setup
        ├── requirements.txt        # Python backend dependencies
        ├── api/                    # REST API routers (papers, rag, tasks, memory)
        ├── rag/                    # RAG engine (chunker, embedding, retriever, agents)
        ├── database/               # Local JSON database controllers
        ├── security/               # WebAuthn and credential vault services
        └── keys/                   # Profile & API key management
```

---

## 🚀 Quick Start

### Option A: One-Click Windows Launch (Recommended)

Double-click `PaperInsight.bat` in the repository root.

The script automatically:
1. Validates that **Node.js** and **Python** are installed.
2. Creates the Python virtual environment and installs `requirements.txt`.
3. Installs frontend `npm` dependencies.
4. Spawns both the FastAPI backend and Next.js frontend silently in the background.
5. Automatically opens your default browser at `http://localhost:3000`.

To stop all running background services at any time, run `Stop-Servers.bat`.

---

### Option B: Manual Cross-Platform Setup (Linux / macOS / Windows)

#### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

#### 2. Backend Setup
```bash
# Navigate to the backend directory
cd core/backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```
*The backend API will be live at `http://localhost:8000` (Docs: `http://localhost:8000/docs`).*

#### 3. Frontend Setup
```bash
# Open a new terminal and navigate to the frontend directory
cd core

# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
*Open `http://localhost:3000` in your web browser.*

---

### Option C: Docker Compose

```bash
docker-compose up --build
```

---

## 🔐 Security & Privacy Architecture

PaperInsight is built with strict privacy controls:
- **Zero Document Leakage:** Uploaded manuscripts are chunked and vectorized locally. Raw PDF text is never dispatched to cloud vector databases.
- **Credential Protection:** Secrets, WebAuthn credentials, and API keys are stored in gated local configuration vaults and excluded from version control via `.gitignore`.
- **Configurable Fallback:** Users can utilize local OmniRoute proxies or bring their own API keys with granular provider switching.

---

## 📖 Project Documentation

For in-depth architectural analyses and engineering specifications, explore the [`docs/`](./docs) directory:
- [Technical Documentation (System Architecture & Pipeline)](./docs/TECHNICAL_DOCUMENTATION.md)
- [Comprehensive Academic Project Report](./docs/PROJECT_REPORT.md)
- [Deep Research Synthesis Sample Output](./docs/DEEP_RESEARCH_REPORT.md)
- [Roadmap & Advanced Agentic Extensions](./docs/ROADMAP_IMPLEMENTATION.md)
- [AI Model Selection & Evaluation Guide](./docs/MODEL_GUIDE.md)

---

## 👥 Authors & Academic Attribution

Developed as an advanced academic research assistant project:
- **G Mohnish Krishna Sai Kumar** ([AV.SC.U4CSE23013])
- **Pallapothu Moulika** ([AV.SC.U4CSE23036])

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.
