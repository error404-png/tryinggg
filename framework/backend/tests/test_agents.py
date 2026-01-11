import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_agent(client_app: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    agent_data = {
        "name": "Test Agent",
        "description": "An agent that does nothing",
        "type": "custom",
        "config": {}
    }
    response = await client_app.post("/agents", json=agent_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Agent"
    assert "file_path" in data

@pytest.mark.asyncio
async def test_param_validation(client_app: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Missing name
    agent_data = {
        "description": "Invalid agent"
    }
    response = await client_app.post("/agents", json=agent_data, headers=headers)
    assert response.status_code == 422
