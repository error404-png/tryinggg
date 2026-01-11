from agents.email_sender_agent import EmailSenderAgent

def test_email_sender():
    print("Testing EmailSenderAgent...")
    
    # Initialize with default config (which has the hardcoded creds)
    agent = EmailSenderAgent()
    
    # usage: run(message)
    # The agent expects:
    # To: <recipient>
    # Subject: <subject>
    # <Body>
    
    recipient = "manishramlani2004@gmail.com" # Sending to self to test
    subject = "Test from Agent"
    body = "This is a test email sent from the EmailSenderAgent verification script."
    
    message = f"To: {recipient}\nSubject: {subject}\n\n{body}"
    
    response = agent.run(message)
    print(f"Agent Response: {response}")

if __name__ == "__main__":
    test_email_sender()
