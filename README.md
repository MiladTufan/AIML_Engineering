### 📝 Online PDF Editor — ✅
* **Tech Stack:** Angular, TypeScript, Tailwind CSS, Python (FastAPI), PostgreSQL

#### 💡 The "Why"
Most online PDF editors are either locked behind expensive monthly subscriptions or pose significant privacy risks by storing your sensitive documents on third-party servers. I built **VersaPDF** to create a lightweight, private-first alternative. The goal was to master the complex challenge of browser-based file manipulation and to provide a seamless UI for document state management without the "enterprise" price tag.

#### 🚀 How to Get Started
I’ve automated the entire environment configuration to get you up and running in seconds. 

1.  **Clone the repository:** `git clone git@github.com:MiladTufan/AIML_Engineering.git`

2.  **Environment Configuration**
To keep the project secure, environment variables are not stored in the repository. 
    1. Locate the `token.env` file in the `/db` folder.
    2. (Optional) Replace the test secret with your own.
    3. (Optional) if you have local PostgreSQL credentials, locate `db_example.env` inside the `db` folder. Create a copy named `db.env` and update the values with your local PostgreSQL credentials. 
    * *Note: If you don't provide credentials, the system will automatically use SQLite.*

2.  **Run the setup script:**
    Open PowerShell in the project root and run:
    ```powershell
    ./start.ps1
    ```
    *This script will automatically handle dependency installation for both the Angular frontend and Python backend, initialize the PostgreSQL database, and launch the local development server.*
