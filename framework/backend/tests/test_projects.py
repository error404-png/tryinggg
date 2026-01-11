import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_project(client_app: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    project_data = {
        "name": "Test Project",
        "description": "A project for testing",
        "about": "Testing about section",
        "screens": [],
        "allow_user_chaining": True
    }
    response = await client_app.post("/projects", json=project_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    assert "_id" in data
    return data["_id"]

@pytest.mark.asyncio
async def test_list_projects(client_app: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client_app.get("/projects", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # dependent on test_create_project running first or isolated db
    
@pytest.mark.asyncio
async def test_get_project_details(client_app: AsyncClient, admin_token: str):
    # First create a project
    headers = {"Authorization": f"Bearer {admin_token}"}
    project_data = {"name": "Detail Project", "description": "desc"}
    create_res = await client_app.post("/projects", json=project_data, headers=headers)
    project_id = create_res.json()["_id"]
    
    # Get details
    response = await client_app.get(f"/projects/{project_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["_id"] == project_id
