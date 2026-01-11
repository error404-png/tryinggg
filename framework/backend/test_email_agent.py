from agents.email_attachment_agent import EmailAttachmentAgent
import os

# We pass an empty config so it uses the defaults defined in the class (which user just updated)
TEST_CONFIG = {
    # "email_user": ... (Using default from file)
    # "email_pass": ... (Using default from file)
    # "imap_server": ... (Using default from file)
    "output_folder": "test_email_downloads"
}

def test_agent():
    print("Initializing Email Attachment Agent...")
    # Passing config with just output_folder, so it falls back to class defaults for creds
    agent = EmailAttachmentAgent(name="TestEmailAgent", config=TEST_CONFIG)
    
    print(f"Testing with user: {agent.EMAIL_USER}")
    
    print("Running Agent...")
    try:
        response = agent.run("check emails")
        print("Agent Response:")
        print(response)
    except Exception as e:
        print(f"Agent failed with error: {e}")

if __name__ == "__main__":
    test_agent()
