# The Developer Sandbox: A Journey of Continuous Learning

Welcome to my public repository! This space serves as a "Digital Garden" for the projects, experiments, and deep-dives I work on during my free time. 

### 💡 The Philosophy
I believe that growth happens in the "messy middle." This repository is designed to showcase my **process**, my **curiosity**, and my **commitment to continuous improvement.**

> **Note:** The projects found here are **Works in Progress (WIP)**. They are subject to frequent refactoring, architectural shifts, and experimental commits as I learn new frameworks and best practices.

---

## 🛠️ Project Status Board
To help you navigate this repository, I use the following legend to indicate the maturity of each project:

| Icon | Status | Description |
| :--- | :--- | :--- |
| 🏗️ | **In Progress** | Active development; core features being built. |
| 🔬 | **Experimental** | Testing a specific library, API, or proof-of-concept. |
| ⏸️ | **On Ice** | Paused to focus on other priorities, but still contains valuable logic. |
| ✅ | **MVP Reached** | Minimum Viable Product functionality achieved. |

---

## 📂 Featured WIP Projects

### 📄 Online PDF Editor — 🏗️
* **Tech Stack:** Angular, TypeScript, Tailwind CSS, Python (FastAPI), PostgreSQL
* **Current State:** * **Backend:** Stable core with robust logging, session management, and database integration (PostgreSQL/SQLite). PDF editing logic and secure downloads are functional.
    * **Frontend:** Under construction. Includes a page navigator and PDF viewer. Users can currently add/style text and insert images. The "Organize View" UI is implemented as a placeholder for upcoming drag-and-drop logic.

### 🤖 Local RAGBot: Private AI Assistant — 🏗️
* **Tech Stack:** Angular, TypeScript, Tailwind CSS, Python (FastAPI), LangChain, Ollama
* **The Goal:** A ChatGPT-like interface performing Retrieval-Augmented Generation (RAG) on local documents, ensuring 100% data privacy.
* **Current State:** * **Initial Phase:** Essential features are live. Users can upload PDFs to the knowledge base and chat with the local LLM.
    * **Data Strategy:** Currently uses local file system ingestion with `sentence-transformers` for real-time indexing. Database integration (pgvector/ChromaDB) is planned for the next milestone to replace the current disk-based storage.

---

## 🚀 How to Get Started

I’ve automated the entire environment configuration to get you up and running in seconds. Please refer to each of the project README.md to get started with the project.

## 📈 Learning Roadmap (2026)
My current focus is transitioning from standard applications to **Intelligent Systems**:

1.  **Agentic AI & RAG:** I am currently pursuing the **IBM AI Engineering Certification** via Coursera. The RAGBot project is my primary laboratory for these concepts.
2.  **Advanced RAG Techniques:** Moving from simple similarity search to "Agentic RAG"—implementing reasoning loops where the AI decides when and how to fetch data.
3.  **Performance Optimization:** Focusing on reducing latency in local LLM inference and optimizing frontend rendering for real-time streaming responses.

---

## 📫 Let’s Connect!
I am always open to feedback or discussing the architectural decisions I’ve made in these folders.

* [**LinkedIn**](https://www.linkedin.com/in/milad-tufan/)

---
*“Done is better than perfect, but 'in-progress' is where the real learning happens.”*