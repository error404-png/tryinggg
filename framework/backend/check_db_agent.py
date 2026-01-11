import asyncio
from database import get_database
from bson import ObjectId

async def check_agent_config():
    db = await get_database()
    agent_name = "Email Downloader"
    agent = await db.agents.find_one({"name": agent_name})
    
    if not agent:
        print(f"Agent '{agent_name}' not found!")
        return

    print(f"Agent ID: {agent['_id']}")
    print(f"Config in DB: {agent.get('config')}")

    # Check if password matches
    db_pass = agent.get('config', {}).get('email_pass')
    expected_pass = "vaqw dmpk mxgv uppa"
    
    if db_pass == expected_pass:
        print("MATCH: Password in DB is correct.")
    else:
        print(f"MISMATCH: Password in DB is '{db_pass}' (Expected: '{expected_pass}')")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(check_agent_config())
