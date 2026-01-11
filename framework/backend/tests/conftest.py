import sys
import os
import asyncio
from unittest.mock import MagicMock
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from auth import get_password_hash, verify_password
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import database # Import the module to patch it

# Fix for Windows Event Loop
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Correctly mock RAGService
import rag_service
rag_service.RAGService = MagicMock()

# Now import main
from main import app
from models import User

TEST_DB_NAME = "agent_framework_test"

@pytest_asyncio.fixture(scope="function")
async def db():
    # Original values
    original_db = database.db
    original_client = database.client

    # Create a new client for each test
    mongo_uri = os.getenv("MONGO_URI")
    client = AsyncIOMotorClient(mongo_uri, tlsCAFile=certifi.where())
    test_db = client[TEST_DB_NAME]
    
    # Patch the global variables in database module
    database.client = client
    database.db = test_db
    
    yield test_db
    
    # Cleanup
    await client.drop_database(TEST_DB_NAME)
    client.close()
    
    # Restore (though pytest handles module reload isolation poorly, best effor)
    database.client = original_client
    database.db = original_db

@pytest_asyncio.fixture(scope="function")
async def start_app(db):
    yield app

@pytest_asyncio.fixture(scope="function")
async def client_app(start_app):
    async with AsyncClient(transport=ASGITransport(app=start_app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def admin_token(client_app, db):
    # Create admin user
    hashed = get_password_hash("admin123")
    admin_data = {
        "email": "admin@test.com",
        "hashed_password": hashed,
        "role": "admin",
        "is_active": True,
        "allowed_projects": []
    }
    await db.users.insert_one(admin_data)
    
    # Login
    response = await client_app.post("/token", data={"username": "admin@test.com", "password": "admin123"})
    if response.status_code != 200:
        raise Exception(f"Failed to get admin token: {response.text}")
    return response.json()["access_token"]
