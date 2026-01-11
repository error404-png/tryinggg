import sys
import os
# Ensure we can import from agents directory
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from agents.email_attachment_agent import EmailDownloaderAgent
# Import SkillscheckerAgent dynamically/directly
# We know the filename from previous list_dir: 6963370853091f33c54628de.py
# But modules starting with numbers are hard to import directly.
import importlib.util

def load_agent(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SkillscheckerAgent

def test_full_chain():
    print("--- 1. Running Email Agent ---")
    email_agent = EmailDownloaderAgent()
    email_output = email_agent.run("check")
    
    print("\n[Email Agent Output Preview]:")
    print(email_output[:200] + "..." if len(email_output) > 200 else email_output)
    
    if "No new unread emails" in email_output or "No attachments found" in email_output:
        print("\n[!] Stopping Chain: No data to process.")
        return

    print("\n--- 2. Running Skills Checker Agent ---")
    skills_agent_path = os.path.abspath("agents/6963370853091f33c54628de.py")
    if not os.path.exists(skills_agent_path):
        print(f"Error: Skills agent file not found at {skills_agent_path}")
        return

    SkillscheckerAgent = load_agent("SkillscheckerAgent", skills_agent_path)
    skills_agent = SkillscheckerAgent()
    
    # Pass email output to skills agent
    final_output = skills_agent.run(email_output)
    
    print("\n[Skills Checker Output]:")
    print(final_output)

if __name__ == "__main__":
    test_full_chain()
