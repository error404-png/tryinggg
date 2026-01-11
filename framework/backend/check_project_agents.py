import requests
import json

BASE_URL = "http://localhost:8000"

def check_project():
    # 1. Login as Admin
    print("Logging in as Admin...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": "admin@example.com", "password": "admin123"})
    if resp.status_code != 200:
        print(f"Admin Login Failed: {resp.text}")
        return
    admin_token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Get Projects
    print("Fetching Projects...")
    resp = requests.get(f"{BASE_URL}/projects", headers=headers)
    projects = resp.json()
    
    # 3. Find test5
    target_project = next((p for p in projects if p["name"] == "test5"), None)
    
    if not target_project:
        print("Project 'test5' not found.")
        # List available projects for clarity
        print("Available projects:", [p["name"] for p in projects])
        return
    
    print(f"Found Project: {target_project['name']} (ID: {target_project['_id']})")
    print(f"Agents Assigned: {target_project.get('agents', [])}")
    
    if target_project.get('agents'):
        print("Agents details:")
        for agent_id in target_project['agents']:
             # Fetch agent details if possible, or just list IDs
             print(f" - Agent ID: {agent_id}")

if __name__ == "__main__":
    check_project()
