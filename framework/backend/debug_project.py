import asyncio
from database import get_database
from bson import ObjectId

async def debug_project():
    db = await get_database()
    # Find the project
    project = await db.projects.find_one({"name": "Test 3"})
    print(f"Project: {project}")
    
    if project:
        print(f"Project Agents: {project.get('agents')}")
        
        # Find all agents to see what's available
        agents = await db.agents.find({}).to_list(length=100)
        print("Available Agents:")
        for a in agents:
            print(f"- {a['_id']}: {a['name']}")
            
        # Update to english to hindi 2
        target_agent = next((a for a in agents if a["name"] == "english to hindi 2"), None)
        if target_agent:
            print(f"Swapping to agent {target_agent['name']} ({target_agent['_id']}) for project...")
            await db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": {"agents": [str(target_agent["_id"])]}}
            )
            print("Update complete.")
        else:
            print("Target agent not found.")
            
    # Update User Permissions or Create User
    user = await db.users.find_one({"email": "user@test.com"})
    if user:
        print(f"Updating user {user['email']} permissions...")
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$addToSet": {"allowed_projects": project["_id"] if isinstance(project["_id"], str) else str(project["_id"])}}
        )
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$addToSet": {"allowed_projects": project["_id"]}} 
        ) # Ensure both formats just in case
        print("User permissions updated.")
    else:
        print("User user@test.com not found. Creating...")
        from models import User
        # Need password hash
        from auth import get_password_hash
        hashed = get_password_hash("user123")
        new_user = {
            "email": "user@test.com",
            "hashed_password": hashed,
            "role": "user",
            "is_active": True,
            "allowed_projects": [project["_id"], str(project["_id"])]
        }
        await db.users.insert_one(new_user)
        print("User created.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(debug_project())
