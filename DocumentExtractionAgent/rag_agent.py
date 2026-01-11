import os
import re
from dotenv import load_dotenv
from pymongo import MongoClient
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
import certifi

# Load environment variables
load_dotenv()

class RAGAgent:
    def __init__(self, collection_name="rag_documents"):
        """
        Initialize the RAG Agent with Embeddings, LLM, and Vector Store.
        """
        # 1. Initialize Embeddings
        print("Initializing Embeddings...")
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        # 2. Initialize LLM (Groq)
        print("Initializing LLM (Groq)...")
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables.")
        
        self.llm = ChatGroq(
            groq_api_key=api_key,
            model_name="llama-3.1-8b-instant"
        )

        # 3. Initialize Vector Store (MongoDB)
        print("Initializing Vector Store (MongoDB)...")
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise ValueError("MONGO_URI not found in environment variables.")
        
        # Use certifi for SSL verification
        self.client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
        
        self.db_name = "eif_db"
        self.collection_name = collection_name
        self.collection = self.client[self.db_name][self.collection_name]

        # Initialize Atlas Vector Search
        self.vector_store = MongoDBAtlasVectorSearch(
            collection=self.collection,
            embedding=self.embeddings,
            index_name="vector_index", # Ensure this index exists in Atlas
            relevance_score_fn="cosine",
        )

    def reset_database(self):
        """
        Clears all documents from the vector store.
        """
        print("Resetting database...")
        self.collection.delete_many({})
        print("Database cleared.")

    def ingest_file(self, file_path):
        """
        Ingest a file (Text or PDF), split it, and store embeddings in MongoDB.
        """
        print(f"Ingesting file: {file_path}")
        
        # 1. Load Document
        if file_path.endswith(".txt"):
            loader = TextLoader(file_path, encoding="utf-8")
        elif file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        else:
            raise ValueError("Unsupported file type. Only .txt and .pdf are supported.")
        
        docs = loader.load()
        
        # Clean text (remove excessive newlines/spaces)
        for doc in docs:
            doc.page_content = re.sub(r'\s+', ' ', doc.page_content).strip()

        # 2. Split Text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.split_documents(docs)
        print(f"Split into {len(splits)} chunks.")
        if len(splits) > 0:
            print(f"Sample content (Chunk 1): {splits[0].page_content[:200]}...")

        # 3. Store in MongoDB
        self.vector_store.add_documents(splits)
        print("Documents stored in MongoDB.")

    def query(self, user_query):
        """
        Query the RAG system and get a response from the LLM.
        """
        print(f"Processing query: {user_query}")

        # 1. Create Retriever
        retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        
        # Debug: Check what retrieval finds
        retrieved_docs = retriever.invoke(user_query)
        print(f"Retrieved {len(retrieved_docs)} documents.")
        for i, doc in enumerate(retrieved_docs):
            print(f"Retrieved Chunk {i+1}: {doc.page_content[:100]}...")

        # 2. Create Chain
        system_prompt = (
            "You are an intelligent assistant for the Enterprise Intelligence Framework (EIF). "
            "The content below is retrieved from the user's uploaded document. "
            "Use this context to answer the question. "
            "If the answer is not in the context, say that you don't know. "
            "Keep the answer concise."
            "\n\n"
            "Context:\n"
            "{context}"
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                ("human", "{input}"),
            ]
        )

        question_answer_chain = create_stuff_documents_chain(self.llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)

        # 3. Invoke Chain
        response = rag_chain.invoke({"input": user_query})
        
        # Return both answer and context (source documents)
        return {
            "answer": response["answer"],
            "source_documents": response["context"]
        }

if __name__ == "__main__":
    # Example Usage
    try:
        agent = RAGAgent()
        print("RAG Agent initialized successfully.")
    except Exception as e:
        print(f"Error: {e}")
