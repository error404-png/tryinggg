from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from datetime import timedelta
import shutil
import tempfile
from typing import List
from database import get_database
from models import Project, ProjectCreate, ChatSession, ChatMessage, ChatRequest, Agent, ProjectScreen, ChainAgentConfig
from rag_service import RAGService
from project_generator import ProjectGenerator
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import importlib.util
import sys
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from fastapi.security import OAuth2PasswordRequestForm
from chat_service import process_chat_request
from auth import (
    create_access_token, 
    get_current_active_user, 
    get_admin_user, 
    get_password_hash, 
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from models import User, UserCreate, Token

load_dotenv()

app = FastAPI(title="Agent Framework API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


rag_service = RAGService()
project_generator = ProjectGenerator()

# Teams Bot Setup
from botbuilder.core import BotFrameworkAdapter, BotFrameworkAdapterSettings
from botbuilder.schema import Activity
from teams_bot import TeamsBot
from fastapi import Request, Response
import json

BOT_SETTINGS = BotFrameworkAdapterSettings(
    app_id=os.environ.get("MICROSOFT_APP_ID", ""),
    app_password=os.environ.get("MICROSOFT_APP_PASSWORD", ""),
    channel_auth_tenant=os.environ.get("MICROSOFT_APP_TENANT_ID", "")
)

ADAPTER = BotFrameworkAdapter(BOT_SETTINGS)
BOT = TeamsBot()

@app.post("/api/messages")
async def messages(req: Request):
    if "application/json" in req.headers.get("content-type", ""):
        body = await req.json()
    else:
        return Response(status_code=415)

    activity = Activity().deserialize(body)
    
    auth_header = req.headers.get("Authorization", "")
    
    try:
        response = await ADAPTER.process_activity(activity, auth_header, BOT.on_turn)
        if response:
            return Response(content=json.dumps(response.body), media_type="application/json", status_code=200)
        return Response(status_code=201)
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Teams expects 200/202 usually, but for error we might log it
        raise HTTPException(status_code=500, detail=str(e))


LOCAL_REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "local_repository"))
os.makedirs(LOCAL_REPO_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Agent Framework API is running"}

# Auth Routes
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = await get_database()
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/users", response_model=User)
async def create_user(user: UserCreate, current_user: User = Depends(get_admin_user)):
    db = await get_database()
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        allowed_projects=user.allowed_projects or [],
        is_active=True
    )
    result = await db.users.insert_one(new_user.dict(by_alias=True, exclude={"id"}))
    created_user = await db.users.find_one({"_id": result.inserted_id})
    return created_user

@app.get("/users", response_model=List[User])
async def read_users(current_user: User = Depends(get_admin_user)):
    db = await get_database()
    users = await db.users.find().to_list(1000)
    return users

# Projects
class AnalyzePromptRequest(BaseModel):
    prompt: str

@app.post("/projects/analyze-prompt")
async def analyze_prompt(request: AnalyzePromptRequest, current_user: User = Depends(get_admin_user)):
    screens = await project_generator.analyze_requirements(request.prompt)
    return screens

class ProjectCreateFull(BaseModel):
    name: str
    description: Optional[str] = None
    about: Optional[str] = None
    screens: List[ProjectScreen] = []
    allow_user_chaining: bool = False

@app.post("/projects", response_model=Project)
async def create_project(project: ProjectCreateFull, current_user: User = Depends(get_admin_user)):
    db = await get_database()
    
    # Generate code for screens
    if project.screens:
        try:
            generated_code_map = await project_generator.generate_code(project.screens)
            for screen in project.screens:
                screen.code_content = generated_code_map.get(screen.name, "")
        except Exception as e:
            print(f"Code generation failed: {e}")
        
    new_project = Project(
        name=project.name, 
        description=project.description,
        screens=project.screens,
        allow_user_chaining=project.allow_user_chaining,
        agents=[] # Agents added via chat now
    )
    result = await db.projects.insert_one(new_project.dict(by_alias=True, exclude={"id"}))
    created_project = await db.projects.find_one({"_id": result.inserted_id})
    
    # Create documents folder for project
    project_doc_dir = os.path.join("documents", str(result.inserted_id))
    os.makedirs(project_doc_dir, exist_ok=True)
    
    return created_project

@app.get("/projects", response_model=List[Project])
async def list_projects(current_user: User = Depends(get_current_active_user)):
    db = await get_database()
    if current_user.role == "admin":
        projects = await db.projects.find().to_list(1000)
    else:
        # Filter by allowed_projects
        # Convert string IDs to ObjectIds
        allowed_ids = []
        for pid in current_user.allowed_projects:
             if ObjectId.is_valid(pid):
                 allowed_ids.append(ObjectId(pid))
        
        if not allowed_ids:
             return []
             
        projects = await db.projects.find({"_id": {"$in": allowed_ids}}).to_list(1000)
    return projects

@app.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: User = Depends(get_current_active_user)):
    db = await get_database()
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check permissions
    if current_user.role != "admin" and project_id not in current_user.allowed_projects:
         raise HTTPException(status_code=403, detail="Not authorized to view this project")
         
    return project

class ProjectUpdate(BaseModel):
    agents: Optional[List[str]] = None
    chain_config: Optional[List[dict]] = None # We take dicts to avoid strict Pydantic parsing issues from frontend
    allow_user_chaining: Optional[bool] = None

@app.put("/projects/{project_id}")
async def update_project(project_id: str, update: ProjectUpdate, current_user: User = Depends(get_admin_user)):
    db = await get_database()
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")
    
    update_data = {}
    if update.agents is not None:
         update_data["agents"] = update.agents
    
    if update.chain_config is not None:
         update_data["chain_config"] = update.chain_config

    if update.allow_user_chaining is not None:
         update_data["allow_user_chaining"] = update.allow_user_chaining
         
    if not update_data:
        return {"message": "No changes provided"}
        
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return {"message": "Project updated successfully"}

@app.get("/repositories")
async def list_repositories(current_user: User = Depends(get_admin_user)):
    """List all files in the local repository"""
    files = []
    if os.path.exists(LOCAL_REPO_DIR):
        for f in os.listdir(LOCAL_REPO_DIR):
            if os.path.isfile(os.path.join(LOCAL_REPO_DIR, f)):
                 files.append(f)
    return files

# Ingestion
@app.post("/projects/{project_id}/ingest")
async def ingest_document(project_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_active_user)):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")

    db = await get_database()
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check permissions
    is_admin = current_user.role == "admin"
    is_allowed_basic = (
        project_id in current_user.allowed_projects and 
        project.get("allow_user_chaining", False)
    )

    if not is_admin and not is_allowed_basic:
        raise HTTPException(status_code=403, detail="Not authorized to upload files to this project")
    
    # Save to project specific folder
    project_doc_dir = os.path.join("documents", project_id)
    os.makedirs(project_doc_dir, exist_ok=True)
    project_file_path = os.path.join(project_doc_dir, file.filename)
    
    # Save to local repository (global) - Parallel save
    local_repo_path = os.path.join(LOCAL_REPO_DIR, file.filename)
    
    # Save temp file first to handle stream
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    try:
        # Copy to project dir
        shutil.copy2(tmp_path, project_file_path)
        # Copy to local repo
        shutil.copy2(tmp_path, local_repo_path)
        
        # We only ingest into RAG for the project (optional: could be dynamic based on chaining)
        # For now, we still ingest into the base RAG service for the project context
        await rag_service.ingest_file(project_id, tmp_path, file.filename)
    except Exception as e:
        print(f"ERROR: Ingest failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path)
    
    return {"message": f"Successfully ingested {file.filename}"}

# Chat
# Chat
@app.post("/projects/{project_id}/chat")
async def chat(project_id: str, request: ChatRequest, current_user: User = Depends(get_current_active_user)):
    # Check permissions
    if current_user.role != "admin" and project_id not in current_user.allowed_projects:
         raise HTTPException(status_code=403, detail="Not authorized to access this project chat")
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")
    

    # Use Logic from Chat Service
    try:
        # Determine chain to pass
        chain_to_process = request.chain
        
        result = await process_chat_request(
             project_id=project_id,
             query=request.query,
             user_email=current_user.email,
             chain_config=chain_to_process,
             user_role=current_user.role,
             allowed_projects=current_user.allowed_projects
        )
        return result
        
    except ValueError as ve:
         raise HTTPException(status_code=403, detail=str(ve))
    except Exception as e:
         import traceback
         traceback.print_exc()
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/chat")
async def get_chat_history(project_id: str, current_user: User = Depends(get_current_active_user)):
    # Check permissions
    if current_user.role != "admin" and project_id not in current_user.allowed_projects:
         raise HTTPException(status_code=403, detail="Not authorized to access this project chat")
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid Project ID")
    
    db = await get_database()
    
    # Find session
    session = await db.chat_sessions.find_one({
        "project_id": project_id,
        "user_email": current_user.email
    })
    
    if not session:
        return {"messages": [], "chain": []}
        
    return {
        "messages": session.get("messages", []),
        "chain": session.get("current_chain", [])
    }

# Agents
@app.post("/agents", response_model=Agent)
async def create_agent(agent: Agent, current_user: User = Depends(get_admin_user)):
    db = await get_database()
    
    # Generate Agent Code
    code = await project_generator.generate_agent_code(agent.name, agent.description, agent.type)
    
    # Save code to file
    agent_id = str(ObjectId())
    filename = f"{agent_id}.py"
    filepath = os.path.join("agents", filename)
    os.makedirs("agents", exist_ok=True)
    
    with open(filepath, "w") as f:
        f.write(code)
    
    # Save to DB
    new_agent = agent.dict(by_alias=True, exclude={"id"})
    new_agent["file_path"] = filepath
    
    result = await db.agents.insert_one(new_agent)
    created_agent = await db.agents.find_one({"_id": result.inserted_id})
    return created_agent

@app.post("/agents/{agent_id}/chat")
async def chat_agent(agent_id: str, request: ChatRequest):
    db = await get_database()
    if not ObjectId.is_valid(agent_id):
        raise HTTPException(status_code=400, detail="Invalid Agent ID")
        
    agent_doc = await db.agents.find_one({"_id": ObjectId(agent_id)})
    if not agent_doc or not agent_doc.get("file_path"):
        raise HTTPException(status_code=404, detail="Agent or agent code not found")
        
    # Dynamic Load
    filepath = agent_doc["file_path"]
    module_name = f"agents.{agent_id}"
    
    spec = importlib.util.spec_from_file_location(module_name, filepath)
    if not spec or not spec.loader:
         raise HTTPException(status_code=500, detail="Could not load agent module")
         
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    
    # Instantiate
    # We expect the class name to be NameAgent, e.g. CalculatorBotAgent
    # But since we generated it, let's find the class that inherits from BaseAgent
    from agents.base import BaseAgent
    import inspect
    
    agent_class = None
    for name, obj in inspect.getmembers(module):
        if inspect.isclass(obj) and issubclass(obj, BaseAgent) and obj is not BaseAgent:
            agent_class = obj
            break
            
    if not agent_class:
         # Fallback: try to find any class
         for name, obj in inspect.getmembers(module):
            if inspect.isclass(obj) and obj.__module__ == module.__name__:
                 agent_class = obj
                 break
    
    if not agent_class:
        raise HTTPException(status_code=500, detail="Could not find Agent class in generated code")
        
    agent_instance = agent_class(name=agent_doc["name"], config=agent_doc.get("config"))
    
    try:
        response = agent_instance.run(request.query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")


@app.get("/agents", response_model=List[Agent])
async def list_agents():
    db = await get_database()
    agents = await db.agents.find().to_list(1000)
    return agents

@app.get("/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str):
    db = await get_database()
    if not ObjectId.is_valid(agent_id):
        raise HTTPException(status_code=400, detail="Invalid Agent ID")
    agent = await db.agents.find_one({"_id": ObjectId(agent_id)})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@app.get("/api/stats")
async def get_stats(current_user: User = Depends(get_admin_user)):
    db = await get_database()
    
    # metrics
    total_users = await db.users.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_agents = await db.agents.count_documents({})
    
    # Active projects (projects that have chat sessions)
    active_projects_ids = await db.chat_sessions.distinct("project_id")
    active_projects = len(active_projects_ids)
    
    return {
        "total_users": total_users,
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_agents": total_agents,
        "system_status": "healthy"
    }

