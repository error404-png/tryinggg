from agents.base import BaseAgent
import requests
import json
import re

class SkillscheckerAgent(BaseAgent):
    def __init__(self, name: str = None, config: dict = None):
        super().__init__(name, config)
        self.GROQ_API_KEY = "PLACEHOLDER_KEY" # Replace with actual key or use env var

    def run(self, message: str) -> str:
        try:
            # message is likely raw text from a PDF
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            # Prompt to extract skills
            prompt_content = (
                f"Analyze the technical skills, qualifications, and key competencies from the following text. "
                f"Provide a comprehensive summary in plain English paragraphs. Do not return JSON.\n\n"
                f"Text:\n{message[:15000]}" # Limit context window just in case
            )
            
            messages = [{
                "role": "user", 
                "content": prompt_content
            }]
            
            data = {
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.3, # Slightly higher for more natural text
                "max_tokens": 1000
            }
            
            # Call LLM
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            content = response.json()["choices"][0]["message"]["content"]
            
            return content

        except Exception as e:
            return f"Error extracting skills: {str(e)}"