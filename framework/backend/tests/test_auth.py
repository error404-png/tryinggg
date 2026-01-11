import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_signup_flow(client_app: AsyncClient, admin_token: str):
    # Admin creates a new user via API (since /users POST is protected by admin)
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_data = {
        "email": "newuser@test.com",
        "password": "password123",
        "role": "user",
        "allowed_projects": []
    }
    response = await client_app.post("/users", json=user_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert "_id" in data

@pytest.mark.asyncio
async def test_login_success(client_app: AsyncClient, db):
    from auth import get_password_hash
    # Manually insert user
    await db.users.insert_one({
        "email": "login@test.com",
        "hashed_password": get_password_hash("securepass"),
        "role": "user",
        "is_active": True
    })
    
    # Attempt login
    response = await client_app.post("/token", data={"username": "login@test.com", "password": "securepass"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_failure(client_app: AsyncClient):
    response = await client_app.post("/token", data={"username": "wrong@test.com", "password": "wrongpassword"})
    assert response.status_code == 401
