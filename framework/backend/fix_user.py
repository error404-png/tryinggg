import asyncio
from database import get_database
from bson import ObjectId

async def fix_user():
    db = await get_database()
    user = await db.users.find_one({"email": "user@test.com"})
    if user:
        print(f"User found: {user['allowed_projects']}")
        # Filter to only strings
        new_projects = [str(p) for p in user.get("allowed_projects", [])]
        # De-duplicate
        new_projects = list(set(new_projects))
        
        print(f"Updating to: {new_projects}")
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"allowed_projects": new_projects}}
        )
        print("User updated.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(fix_user())
