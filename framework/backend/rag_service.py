import os
import re
import importlib.util
from typing import List, Dict, Any
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import Tool, tool, StructuredTool


from langchain.agents import AgentExecutor, create_tool_calling_agent
from pymongo import MongoClient
import certifi
from database import get_database

class RAGService:
    def __init__(self):
        # Initialize Embeddings
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        # Initialize LLM
        api_key = os.getenv("GROQ_API_KEY")
        # Initialize Vector Store
        mongo_uri = os.getenv("MONGO_URI")
        self.client = MongoClient(mongo_uri, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
        self.db_name = "agent_framework"
        # self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2") # Duplicated
        self.llm = ChatGroq(model="llama-3.1-8b-instant", api_key=os.getenv("GROQ_API_KEY"))
        
        # Ensure index exists
        self.collection_name = "vectors"
        self.index_name = "vector_index"
        self.db = self.client["agent_framework"]
        self.collection = self.db[self.collection_name]

        self.vector_store = MongoDBAtlasVectorSearch(
            collection=self.collection,
            embedding=self.embeddings,
            index_name=self.index_name,
            relevance_score_fn="cosine",
        )

    async def ingest_file(self, project_id: str, file_path: str, original_filename: str):
        print(f"--- Ingesting file: {original_filename} for project: {project_id} ---")
        # Load Document
        if file_path.endswith(".txt"):
            loader = TextLoader(file_path, encoding="utf-8")
        elif file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        else:
            raise ValueError("Unsupported file type")
            
        docs = loader.load()
        print(f"Loaded {len(docs)} pages/documents.")
        
        # Add metadata
        for doc in docs:
            doc.page_content = re.sub(r'\s+', ' ', doc.page_content).strip()
            doc.metadata["project_id"] = project_id
            doc.metadata["source"] = original_filename

        # Split Text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        print(f"Split into {len(splits)} chunks.")
        
        # Store in MongoDB
        if splits:
            self.vector_store.add_documents(splits)
            print("Successfully added documents to vector store.")
        else:
            print("No splits to add.")

    def _get_rag_tool(self, project_id: str):
        """Creates a Tool for querying the knowledge base."""
        
        def rag_search(query: str):
            print(f"DEBUG: RAG Tool called with query: {query}")
            retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": 5,
                    "pre_filter": {"project_id": {"$eq": project_id}}
                }
            )
            
            # Simple retrieval for tool use
            docs = retriever.invoke(query)
            context = "\n".join([doc.page_content for doc in docs])
            if not context:
                return "No relevant information found in the knowledge base."
            return f"Context found from knowledge base:\n{context}"

        return StructuredTool.from_function(
            name="KnowledgeBase",
            func=rag_search,
            description="Useful for answering questions based on the uploaded project documents. Use this whenever you need to look up information from the project's files. Input should be a search query."
        )

    def _create_rag_tool_for_agent(self, project_id: str, agent: Dict[str, Any]):
        """Creates a specific RAG tool for a RAG-type agent."""
        
        def simple_rag_search(query: str):
            print(f"DEBUG: {agent['name']} (RAG) called with query: {query}")
            retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": 5,
                    "pre_filter": {"project_id": {"$eq": project_id}}
                }
            )
            docs = retriever.invoke(query)
            context = "\n".join([doc.page_content for doc in docs])
            if not context:
                return "No relevant documents found."
            return f"Context found:\n{context}"

        return StructuredTool.from_function(
            name=agent['name'].replace(" ", ""),
            func=simple_rag_search,
            description=f"{agent['description']} Input should be a search query."
        )

    def _load_project_agents(self, project_id: str, agents_metadata: List[Dict[str, Any]]) -> List[Tool]:
        """Loads agents based on metadata: either RAG tools or dynamic Python files."""
        tools = []
        for agent in agents_metadata:
            try:
                # 1. Handle RAG Agents
                if agent.get("type") == "rag":
                    print(f"DEBUG: Creating RAG Tool for {agent['name']}")
                    tools.append(self._create_rag_tool_for_agent(project_id, agent))
                    continue

                # 2. Handle Code/General Agents (Load from File)
                path = agent.get("file_path")
                if not path:
                    continue

                full_path = os.path.abspath(path)
                module_name = os.path.splitext(os.path.basename(path))[0]
                
                spec = importlib.util.spec_from_file_location(module_name, full_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    for name, obj in module.__dict__.items():
                        if isinstance(obj, type) and name.endswith("Agent") and name != "BaseAgent":
                            print(f"DEBUG: Loaded Agent Class: {name} from {path}")
                            agent_instance = obj()
                            
                            tool = StructuredTool.from_function(
                                name=agent_instance.__class__.__name__,
                                func=agent_instance.run,
                                description=f"Custom agent tool. Use this to perform actions related to {name}."
                            )
                            tools.append(tool)
                            break
            except Exception as e:
                print(f"Error loading agent {agent.get('name')}: {e}")
        return tools

    async def query(self, project_id: str, user_query: str, agents_metadata: List[Dict[str, Any]] = []):
        short_query = user_query[:200] + "..." if len(user_query) > 200 else user_query
        print(f"--- Processing query: '{short_query}' for project: {project_id} ---")
        
        # 1. Define Tools
        rag_tool = self._get_rag_tool(project_id)
        dynamic_tools = self._load_project_agents(project_id, agents_metadata)
        
        tools = [rag_tool] + dynamic_tools
        print(f"DEBUG: Available Tools: {[t.name for t in tools]}")

        # 2. Create Agent
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an intelligent project assistant with access to a KnowledgeBase and specialized Agents (Tools). "
                       "Your goal is to fulfill the user's request, which may require using multiple tools in a sequence. "
                       "\n\nGUIDELINES:"
                       "\n1. Analyze the request to see if it requires multiple steps (e.g., 'Translate X then convert to Y')."
                       "\n2. If multiple steps are needed: Call Tool 1 -> Get Output -> Call Tool 2 with Tool 1's output -> ... -> Final Result."
                       "\n3. Do NOT stop after the first tool if the second part of the request hasn't been done yet."
                       "\n4. If the user asks a question about documents, use the KnowledgeBase."
                       "\n5. IMPORTANT: Once the full request is complete, your final answer MUST be the exact output of the final tool used. Do NOT add conversational filler."
                       "\n6. Do NOT call the KnowledgeBase to verify the result of another tool."),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])

        agent = create_tool_calling_agent(self.llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

        # 3. Execute
        try:
            response = await agent_executor.ainvoke({"input": user_query})
            answer = response["output"]
        except Exception as e:
            print(f"Agent execution failed: {e}")
            answer = "I encountered an error while processing your request."

        # Note: We lose the explicit 'source_documents' list from the RAG chain in this architecture
        # unless we parse the intermediate steps or have the tool return them in a specific way.
        return {
            "answer": answer,
            "source_documents": [] # Future: Parse tool outputs to recover sources
        }

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Generates a simple response using the configured LLM."""
        try:
            messages = [
                ("system", system_prompt),
                ("human", user_prompt)
            ]
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Error gathering response: {str(e)}"

