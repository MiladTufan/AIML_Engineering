from llama_index.core import SimpleDirectoryReader
from langchain_core.documents import Document
from llama_index.core.node_parser import SentenceSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_community.vectorstores import FAISS

class DataLoader:
    def __init__(self, data_path, hf_embed):
        self.data_path = data_path
        self.docs = None

        try:
            self.docs = self.load_documents(data_path)
            self.chunks = self.split_documents(self.docs)
            self.vector_db = self.create_vector_store(self.chunks, hf_embed)
            self.retriever = self.vector_db.as_retriever(search_kwargs={"k": 6})
        except:
            pass # Knowledge base is currently empty => user has to upload pdfs

    # -----------------------------
    # 1 Load Documents (LlamaIndex)
    # -----------------------------
    def load_documents(self, data_path):
        docs = SimpleDirectoryReader(data_path).load_data()
        # convert llamaindex docs -> langchain docs
        lc_docs = [
            Document(page_content=d.text, metadata=d.metadata)
            for d in docs
        ]

        return lc_docs 
    
    # -----------------------------
    # 2 Chunk Documents
    # -----------------------------
    def split_documents(self, docs):
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150
        )

        chunks = splitter.split_documents(docs)
        return chunks

    # -----------------------------
    # 3 Create Vector DB
    # -----------------------------
    def create_vector_store(self, chunks, hf_embed):
        faiss_db = FAISS.from_documents(chunks, hf_embed)

        return faiss_db
    
    # -----------------------------
    # 4 retrieve from Vector DB
    # -----------------------------
    def retrieve(self, question):
        docs = self.retriever.invoke(question)
        context = "\n\n".join(
            [d.page_content for d in docs]
        )

        return context