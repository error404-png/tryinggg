from agents.email_attachment_agent import EmailAttachmentAgent

def test_chaining():
    agent = EmailAttachmentAgent()
    print("Running Email Agent (Expect Text Output)...")
    
    # Run agent
    output = agent.run("check")
    
    print("\n--- AGENT OUTPUT START ---")
    print(output)
    print("--- AGENT OUTPUT END ---\n")
    
    # Verify if it looks like extracted text
    if "Content of" in output:
        print("SUCCESS: Output contains extracted file content.")
    else:
        print("WARNING: Output might be just status message. If you had no new emails, this is expected.")

if __name__ == "__main__":
    test_chaining()
