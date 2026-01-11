from pydantic import BaseModel, Field
from pydantic_core import core_schema
from typing import Any, List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.str_schema(),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    agents: Optional[List[str]] = []

class ChatMessage(BaseModel):
    role: str
    content: str
    sources: Optional[List[str]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChainAgentConfig(BaseModel):
    agent_id: str
    name: Optional[str] = None
    type: Optional[str] = None
    context: Optional[str] = None
    files: Optional[List[str]] = []

class ChatSession(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    project_id: str
    user_email: Optional[str] = None # Link session to specific user
    title: Optional[str] = "New Chat"
    messages: List[ChatMessage] = []
    current_chain: Optional[List[ChainAgentConfig]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class ChatRequest(BaseModel):
    query: str
    chain: Optional[List[ChainAgentConfig]] = None

class Agent(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    description: Optional[str] = None
    type: str  # e.g., "rag", "code_gen", "general"
    config: Optional[dict] = {}
    file_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class ProjectScreen(BaseModel):
    name: str
    description: str
    code_path: Optional[str] = None
    code_content: Optional[str] = None

class Project(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    description: Optional[str] = None
    agents: Optional[List[str]] = []
    chain_config: Optional[List[ChainAgentConfig]] = []
    screens: Optional[List[ProjectScreen]] = []
    allow_user_chaining: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class User(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: str
    hashed_password: str
    role: str = "user"  # "admin" or "user"
    allowed_projects: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "user"
    allowed_projects: Optional[List[str]] = []

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
