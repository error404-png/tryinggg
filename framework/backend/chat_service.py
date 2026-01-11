
from typing import List, Optional, Dict, Any
from database import get_database
from models import ChainAgentConfig, ChatMessage, ChatSession, Project
from rag_service import RAGService
from bson import ObjectId
import os
import sys
import importlib.util
from langchain_community.document_loaders import TextLoader, PyPDFLoader

# Initialize RAG Service (shared instance logic)
rag_service = RAGService()

async def process_chat_request(
    project_id: str,
    query: str,
    user_email: str,
    chain_config: Optional[List[ChainAgentConfig]] = None,
    user_role: str = "user",
    allowed_projects: List[str] = []
) -> Dict[str, Any]:
    """
    Core logic to process a chat request for a specific project.
    Can be used by API, Websockets, or Teams Bot.
    """
    
    # Permission Check Logic (Basic)
    if not ObjectId.is_valid(project_id):
        raise ValueError("Invalid Project ID")

    db = await get_database()
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    
    if not project:
        raise ValueError("Project not found")
        
    # Check permissions
    if user_role != "admin" and project_id not in allowed_projects:
         raise ValueError("Not authorized to access this project")

    # Determine Chain Configuration
    project_chain_config = []
    if project.get("chain_config") and len(project["chain_config"]) > 0:
        project_chain_config = [ChainAgentConfig(**c) for c in project["chain_config"]]
    elif project.get("agents"):
        # Legacy support
        project_chain_config = [ChainAgentConfig(agent_id=str(aid) if isinstance(aid, ObjectId) else str(aid)) for aid in project["agents"] if ObjectId.is_valid(aid)]

    # Determine execution chain
    final_execution_chain = []
    
    if chain_config and len(chain_config) > 0:
        if user_role == "admin":
             final_execution_chain = chain_config
        else:
             # Basic users: Validate subset
             allowed_agent_ids = set(c.agent_id for c in project_chain_config)
             requested_agent_ids = set(c.agent_id for c in chain_config)
             
             if requested_agent_ids.issubset(allowed_agent_ids):
                  final_execution_chain = chain_config
             else:
                  # Fallback to project default
                  final_execution_chain = project_chain_config
    else:
        # Default to project config
        final_execution_chain = project_chain_config

    # Execute Chain
    final_response = ""
    source_docs = []
    
    if final_execution_chain and len(final_execution_chain) > 0:
        current_input = query
        
        for i, chain_item in enumerate(final_execution_chain):
            agent_id = chain_item.agent_id
            agent_doc = await db.agents.find_one({"_id": ObjectId(agent_id)})
            
            if not agent_doc:
                continue

            # Prepare context
            context_prompt = ""
            if chain_item.context:
                context_prompt += f"\nContext: {chain_item.context}\n"
            
            if chain_item.files:
                 file_context = ""
                 for filename in chain_item.files:
                     file_path = os.path.join("documents", project_id, filename)
                     if not os.path.exists(file_path):
                         continue
                         
                     try:
                         content = ""
                         if filename.endswith(".pdf"):
                             loader = PyPDFLoader(file_path)
                             pages = loader.load()
                             content = "\n".join([p.page_content for p in pages])
                         elif filename.endswith(".txt"):
                             loader = TextLoader(file_path, encoding="utf-8")
                             docs = loader.load()
                             content = "\n".join([d.page_content for d in docs])
                         
                         content = content.replace("\x00", "") 
                         file_context += f"\n--- Content of {filename} ---\n{content}\n"
                         
                     except Exception as e:
                         print(f"Error reading file {filename}: {e}")
                 
                 if file_context:
                     context_prompt += f"\nFile Contents:\n{file_context}\n"
                 else:
                     context_prompt += f"\nReferenced Files: {', '.join(chain_item.files)} (Could not read content)\n"

            # Execute Agent
            try:
                # Handle RAG Agents
                if agent_doc.get("type", "").lower() == "rag" or "document" in agent_doc.get("type", "").lower():  
                     rag_query = f"{current_input} {context_prompt}"
                     rag_result = await rag_service.query(project_id, rag_query)
                     response = rag_result["answer"]
                else:
                    # Dynamic Load Code Agent
                    if not agent_doc.get("file_path"):
                         current_input = f"Error: Agent {agent_doc['name']} has no file path."
                         continue
                         
                    # Load module dynamically
                    # We might need to ensure sys.path is correct or use absolute imports appropriately
                    spec = importlib.util.spec_from_file_location(agent_doc["name"], agent_doc["file_path"])
                    module = importlib.util.module_from_spec(spec)
                    # We need to handle potential module name collisions if not careful, 
                    # but for now we trust the agent name is unique enough or we overwrite
                    sys.modules[agent_doc["name"]] = module
                    spec.loader.exec_module(module)
                    
                    # Find agent class
                    class_name = f"{agent_doc['name'].replace(' ', '')}Agent"
                    agent_class = getattr(module, class_name, None)
                    
                    if not agent_class:
                         for name, obj in module.__dict__.items():
                            if isinstance(obj, type) and "Agent" in name:
                                agent_class = obj
                                break
                
                    if not agent_class:
                        raise Exception("Agent class not found")
                    
                    agent_config_dict = agent_doc.get("config", {})
                    agent_input = f"{current_input}{context_prompt}"
                    
                    agent_instance = agent_class(name=agent_doc["name"], config=agent_config_dict)
                    response = agent_instance.run(agent_input)
            
                current_input = response # Output becomes input for next
            
            except Exception as e:
                import traceback
                traceback.print_exc()
                current_input = f"Error executing agent {agent_doc['name']}: {str(e)}"
    
        final_response = current_input

    else:
        # Default RAG behavior if no chain
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        agent_contexts = []
        if project and project.get("agents"):
            agent_ids = [ObjectId(aid) for aid in project["agents"] if ObjectId.is_valid(aid)]
            agents_cursor = db.agents.find({"_id": {"$in": agent_ids}})
            async for agent_doc in agents_cursor:
                agent_contexts.append({
                    "name": agent_doc["name"],
                    "type": agent_doc.get("type", "general"),
                    "description": agent_doc.get("description", ""),
                    "config": agent_doc.get("config", {}),
                    "file_path": agent_doc.get("file_path")
                })

        result = await rag_service.query(project_id, query, agents_metadata=agent_contexts)
        final_response = result["answer"]
        source_docs = result.get("source_documents", [])
    
    # Save History
    user_msg = ChatMessage(role="user", content=query)
    ai_msg = ChatMessage(
        role="assistant", 
        content=final_response, 
        sources=source_docs
    )
    
    existing_session = await db.chat_sessions.find_one({
        "project_id": project_id,
        "user_email": user_email
    })
    
    chain_data = [c.dict() for c in final_execution_chain] if final_execution_chain else []

    if existing_session:
        update_data = {
            "$push": {"messages": {"$each": [user_msg.dict(), ai_msg.dict()]}},
            "$set": {"current_chain": chain_data}
        }
        await db.chat_sessions.update_one({"_id": existing_session["_id"]}, update_data)
    else:
        new_session = ChatSession(
            project_id=project_id,
            user_email=user_email,
            messages=[user_msg, ai_msg],
            current_chain=final_execution_chain 
        )
        await db.chat_sessions.insert_one(new_session.dict(by_alias=True, exclude={"id"}))
    
    return {
        "answer": final_response,
        "source_documents": source_docs,
        "agent_type": "chain" if final_execution_chain else "rag"
    }
