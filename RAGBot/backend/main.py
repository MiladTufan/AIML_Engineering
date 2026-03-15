from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models.chat_element import ChatElement, DeleteRequest, AddModelRequest
from models.llm import Ollama_LLM
from config import *
from data_loader import DataLoader
from langchain_huggingface import HuggingFaceEmbeddings
import os


app = FastAPI()

hf_embed = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = Ollama_LLM(GEMMA_2b_ID, hf_embed)

@app.get("/knowledgeBase")
def get_knowledge_base():
    all_doc_names = []
    if llm.data_loader.docs is None:
        return

    for doc in llm.data_loader.docs:
        basename = os.path.basename(doc.metadata["file_path"])
        if basename not in all_doc_names:
            all_doc_names.append(basename)

    return all_doc_names

@app.get("/chat")
def get_chat_history():
    memory = llm.get_memory(None)
    chat_elements = [
        ChatElement(
            sender="user" if msg.type == "human" else "ai",
            text=msg.content
        )
        for msg in memory
    ]
    return chat_elements

@app.get("/models")
def get_models():
    return ALL_AVAILABLE_MODELS

@app.post("/chat")
def post_message(message: ChatElement):
    if message.sender == "user":
        llm.chain = llm.rag_chain()
        response = llm.chain.invoke(message.text)
        ai_response = {"sender": "ai", "text": response}

        llm.memory.save_context(
            {"input": message.text},
            {"output": response}
        )
        return ai_response
    return message

@app.post("/upload-pdf")
async def upload_pdf(pdf: UploadFile = File(...)):
    if not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    filename = os.path.basename(pdf.filename) 
    save_path = os.path.join(DATA_PATH, filename)
    
    try:
        content = await pdf.read()
        with open(save_path, "wb") as f:
            f.write(content)

        llm.data_loader = DataLoader(DATA_PATH, hf_embed) 

        return {"filename": filename, "status": "success", "path": save_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/delete-pdf")
async def delete_pdf(request: DeleteRequest):
    # Delete file from DATA_PATH as we dont have a DB at the moment.
    for root, dirs, files  in os.walk(DATA_PATH):
        if request.fileName in files:
            file_path = os.path.join(root, request.fileName)
            os.remove(file_path)
            break
    
    llm.data_loader = DataLoader(DATA_PATH, hf_embed) # refresh data to also include the new PDF

    return request.fileName

@app.post("/set-model")
async def set_model(request: AddModelRequest):
    global llm
    try:
        temp = Ollama_LLM(request.modelName, hf_embed)
        llm = temp
    except:
        raise Exception("Model could not be set!")

@app.post("/add-model")
async def add_model(request: AddModelRequest):
    ALL_AVAILABLE_MODELS.append(request.modelName)


