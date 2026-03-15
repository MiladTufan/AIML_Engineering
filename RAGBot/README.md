# Retrieval Augmented Generation (RAG) Bot

**A private, local-first RAG implementation for chatting with your personal documents without data leaks.**

---

## 🛠️ Tech Stack

* **Frontend:** Angular, TypeScript, Tailwind CSS
* **Backend:** Python (FastAPI)
* **AI Orchestration:** LangChain
* **Local LLM:** Ollama (for privacy-centric inference)
* **Embeddings:** HuggingFace (`sentence-transformers`)

---

## 🚦 Project Status: Initial Phase

The project is currently in its **MVP (Minimum Viable Product)** stage. While the architecture is evolving, the essential core features are fully functional:

* **✅ Knowledge Base Ingestion:** Users can upload PDF documents through the Angular interface.
* **✅ Real-time Indexing:** The system automatically processes uploads, chunks the text, and generates embeddings using `sentence-transformers`.
* **✅ Context-Aware Chat:** A functional chat interface allows users to query the LLM. The bot retrieves the most relevant document sections to provide grounded, non-hallucinatory answers.
* **✅ Local Inference:** All LLM processing is handled via Ollama, ensuring zero latency from external APIs and total data privacy.

---

## 🚀 How to Get Started

I’ve automated the entire environment configuration to get you up and running in seconds.

### 1. Clone the Repository
```bash
git clone git@github.com:MiladTufan/AIML_Engineering.git
```

2.  **Run the setup script:**
    Open PowerShell in the project root and run:
    ```powershell
    ./start.ps1
    ```
    *This script will automatically handle dependency installation for both the Angular frontend and Python backend, initialize the PostgreSQL database, and launch the local development server.*


### Data Ingestion
Currently, the RAGBot utilizes a **Local File System Ingestion** strategy:
* **Current State:** PDFs are uploaded via Angular, validated by FastAPI, and stored in a secure local directory.
* **LLM Integration:** Upon successful upload, the `DataLoader` triggers a re-indexing of the document using `sentence-transformers` (HuggingFace) to update the bot's knowledge base in real-time.
* **Next Milestone:** Transitioning from disk-based storage to a managed **PostgreSQL/pgvector** or **ChromaDB** instance for scalable semantic search.