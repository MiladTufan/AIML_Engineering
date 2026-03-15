from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_classic.memory import ConversationBufferMemory
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from data_loader import DataLoader
from config import *

callback_handler = StreamingStdOutCallbackHandler()

class Ollama_LLM:
    def __init__(self, model_id, hf_embed, params = None):
        if params is None:
            params = {
                   "temperature": 0.7, # Controls randomness/creativity: 0 = deterministic, 1 = very creative
                    "callbacks": [callback_handler], # Callback manager for streaming or custom token handling (optional)
                    "num_ctx": 2048
            }

        self.model = OllamaLLM(model=model_id, **params)
        self.memory = self.create_memory()
        self.data_loader = DataLoader(DATA_PATH, hf_embed)
        self.chain = self.rag_chain()
    
    def get_rag_prompt_template(self):
        template_with_memory = """
            You are a helpful AI assistant.

            Conversation History:
            {memory}
            
            Answer questions using ONLY the information provided in the context below,
            and also considers the conversation history with the user.

            Instructions:
            1. Use ONLY the context provided. Do NOT use any outside knowledge.
            2. Use the conversation history to understand follow-up questions or clarify ambiguities.
            3. If the answer cannot be found in the context, respond:
            "The answer is not available in the provided documents."
            7. Keep the answer concise and clear.

            Context:
            {context}

            Question:
            {question}

            Answer format:
            <concise answer>
        """

        return PromptTemplate(template=template_with_memory, input_variables=["context", "chat_history", "question"])
    
    def create_memory(self):
        memory = ConversationBufferMemory(
            memory_key="memory",
            return_messages=True
        )

        return memory
    
    def get_memory(self, _):
        return self.memory.load_memory_variables({})["memory"]
    
    def rag_chain(self):
        rag_chain = (
            {
                "context" : RunnableLambda(self.data_loader.retrieve),
                "question" : RunnablePassthrough(),
                "memory" : RunnableLambda(self.get_memory)
            } 
            | self.get_rag_prompt_template()
            | self.model 
            | StrOutputParser()
        )
        return rag_chain
