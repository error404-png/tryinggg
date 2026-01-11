
from botbuilder.core import ActivityHandler, TurnContext, MessageFactory
from botbuilder.schema import ChannelAccount
from chat_service import process_chat_request
import os
import re

class TeamsBot(ActivityHandler):
    def __init__(self, project_id: str = None):
        # Allow default project ID
        self.default_project_id = project_id

    async def on_members_added_activity(
        self, members_added: ChannelAccount, turn_context: TurnContext
    ):
        for member in members_added:
            if member.id != turn_context.activity.recipient.id:
                await turn_context.send_activity("Hello and welcome! I am your Agent Assistant.")

    async def on_message_activity(self, turn_context: TurnContext):
        text = turn_context.activity.text
        
        # Simple Logic: 
        # 1. Check if user specified project in message like "Project <Name>: <Message>"
        # 2. Else use default project ID from env or similar
        # For this implementation, we will try to infer or just use the one we configured.
        
        # NOTE: In a real Teams app, we would map the Conversation ID or Channel ID to a Project ID in our DB.
        # For now, let's look for a default project ID in environment variables if not passed in constructor.
        project_id = self.default_project_id or os.getenv("TEAMS_DEFAULT_PROJECT_ID")
        
        if not project_id:
            await turn_context.send_activity("Error: No Default Project Configured. Please ask Admin to set TEAMS_DEFAULT_PROJECT_ID.")
            return

        # User identification
        user_email = "teams_user@example.com" # Placeholder logic as we might not get real email easily without graph
        if turn_context.activity.from_property and turn_context.activity.from_property.aad_object_id:
             # We could use AAD ID to map to a user
             pass
             
        await turn_context.send_activity(f"Processing your request via Agent (Project: {project_id})...")
        
        try:
            # Call our Chat Service
            # We treat the Teams Bot as an ADMIN for now or a specific system user
            # Adjust permissions as strictly as needed.
            result = await process_chat_request(
                project_id=project_id,
                query=text,
                user_email=user_email, # Will create a specific session for "Teams User"
                user_role="admin", # Give Bot Admin power for now to access the project
                allowed_projects=[project_id]
            )
            
            response_text = result.get("answer", "No response from agent.")
            await turn_context.send_activity(MessageFactory.text(response_text))
            
        except Exception as e:
            await turn_context.send_activity(f"Error processing request: {str(e)}")
