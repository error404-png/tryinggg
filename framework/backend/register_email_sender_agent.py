import asyncio
from database import get_database
from bson import ObjectId
import os

async def register_agent():
    db = await get_database()
    
    agent_name = "Email Sender"
    search_criteria = {"name": agent_name}
    existing = await db.agents.find_one(search_criteria)

    agent_data = {
        "name": agent_name,
        "description": "Sends emails using SMTP. Input format:\nTo: recipient@example.com\nSubject: ...\n\nBody...",
        "type": "utility",
        "file_path": os.path.abspath("agents/email_sender_agent.py"),
        "config": {
            "email_user": "manishramlani2004@gmail.com",
            "email_pass": "vaqw dmpk mxgv uppa",
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587
        }
    }
    
    if existing:
        print(f"Deleting existing agent '{agent_name}' to force update...")
        await db.agents.delete_one({"_id": existing["_id"]})
        print("Deleted.")
        
    print(f"Creating new agent '{agent_name}'...")
    result = await db.agents.insert_one(agent_data)
    print(f"Created with ID: {result.inserted_id}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(register_agent())
