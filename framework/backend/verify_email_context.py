from agents.email_sender_agent import EmailSenderAgent

def test_email_context():
    print("Testing EmailSenderAgent with Context-style input...")
    
    agent = EmailSenderAgent()
    
    # Simulate input where the previous agent sends just text, 
    # and the framework appends the context.
    
    # Case 1: Just body + Context
    message = """Here is the translated text in Hindi...
    
    Context: send email to manishramlani2004@gmail.com
    """
    
    print(f"--- Input Message ---\n{message}\n---------------------")
    
    response = agent.run(message)
    print(f"Agent Response: {response}")
    
    assert "sent successfully" in response
    assert "manishramlani2004@gmail.com" in response

if __name__ == "__main__":
    test_email_context()
