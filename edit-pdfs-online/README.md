# Online PDF Editor

## 🛠️ Tech Stack

* **Frontend:** Angular, TypeScript, Tailwind CSS
* **Backend:** Python (FastAPI)
* **Database:** PostgreSQL (with automatic SQLite fallback)
* **Environment:** PowerShell automation for rapid setup

---

## 🚦 Project Status

The project is currently in an active development phase, bridging a robust backend with an evolving frontend.

### **✅ Backend (Stable Core)**
* **Proper Logging:** Full traceability for server-side operations and error handling.
* **Session Management:** Secure handling of user states during document manipulation.
* **Database Integration:** Fully configured PostgreSQL support for persistent data storage.
* **PDF Engine:** Core logic for simple PDF editing and secure file streaming for downloads is functional.

### **🏗️ Frontend (Under Construction)**
* **PDF Viewer:** A functional interface to load and view documents.
* **Annotation Tools:** Users can currently add text, customize styles, and insert images onto the document.
* **Page Navigator:** A sidebar navigation system is implemented to browse through all pages of the PDF.
* **Organize View:** The UI layout for reordering and managing pages is visible (currently acts as a placeholder while the logic is being finalized).

---

## 🚀 How to Get Started

I’ve automated the entire environment configuration to get you up and running in seconds.

### 1. Clone the Repository
```bash
git clone git@github.com:MiladTufan/AIML_Engineering.git
```

### 2.  Environment Configuration
To keep the project secure, environment variables are not stored in the repository. 
    1. Locate the `token.env` file in the `/db` folder.
    2. (Optional) Replace the test secret with your own.
    3. (Optional) if you have local PostgreSQL credentials, locate `db_example.env` inside the `db` folder. Create a copy named `db.env` and update the values with your local PostgreSQL credentials. 
    * *Note: If you don't provide credentials, the system will automatically use SQLite.*

### 3.  Run the setup script:
    Open PowerShell in the project root and run:
    ```powershell
    ./start.ps1
    ```
    *This script will automatically handle dependency installation for both the Angular frontend and Python backend, initialize the PostgreSQL database, and launch the local development server.*