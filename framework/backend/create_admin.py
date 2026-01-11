import asyncio
import os
from database import get_database, client
from auth import get_password_hash
from models import User

async def create_admin():
    print("Creating Admin User...")
    email = input("Enter Admin Email (default: admin@example.com): ").strip() or "admin@example.com"
    password = input("Enter Admin Password (default: admin123): ").strip() or "admin123"
    
    db = await get_database()
    
    # Check if exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        print(f"User {email} already exists. Updating to admin...")
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "hashed_password": get_password_hash(password),
                "role": "admin",
                "is_active": True
            }}
        )
    else:
        new_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role="admin",
            allowed_projects=[],
            is_active=True
        )
        await db.users.insert_one(new_user.dict(by_alias=True, exclude={"id"}))
        print(f"Admin user {email} created successfully.")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(create_admin())
