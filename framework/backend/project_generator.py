import os
import json
from typing import List, Dict
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from models import ProjectScreen

class ProjectGenerator:
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.1-8b-instant", api_key=os.getenv("GROQ_API_KEY"))

    async def analyze_requirements(self, prompt: str) -> List[Dict[str, str]]:
        system_prompt = (
            "You are an expert software architect. "
            "Analyze the user's project description and suggest a list of necessary screens for a web application. "
            "Return ONLY a JSON array of objects, where each object has 'name' and 'description' fields. "
            "Do not include any explanation or markdown formatting outside the JSON."
        )

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])

        chain = prompt_template | self.llm
        
        try:
            response = await chain.ainvoke({"input": prompt})
            content = response.content.strip()
            
            # Attempt to clean potential markdown code blocks
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            screens = json.loads(content)
            return screens
        except Exception as e:
            print(f"Error analyzing requirements: {e}")
            # Fallback
            return [{"name": "Dashboard", "description": "Main overview of the application."}]

    async def generate_code(self, screens: List[ProjectScreen]) -> Dict[str, str]:
        # For MVP, we will generate a simple placeholder for each screen.
        # Real code generation would require more complex prompting and context.
        generated_code = {}
        
        for screen in screens:
            code = f"""import React from 'react';

const {screen.name.replace(" ", "")} = () => {{
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{screen.name}</h1>
            <p className="text-gray-600 mb-6">{screen.description}</p>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <p>Content for {screen.name} goes here.</p>
            </div>
        </div>
    );
}};

export default {screen.name.replace(" ", "")};
"""
            generated_code[screen.name] = code
            
        return generated_code

    async def generate_agent_code(self, name: str, description: str, agent_type: str) -> str:
        system_prompt = (
            "You are an expert Python developer. "
            "Write a Python class that inherits from 'BaseAgent'. "
            "The class name should be '{class_name}'. "
            "It must implement the 'run(self, message: str) -> str' method. "
            "The 'run' method should implement the logic described in the description. "
            "Return ONLY the python code. No markdown formatting."
        )
        
        class_name = name.replace(" ", "") + "Agent"
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Description: {description}\nType: {agent_type}"),
        ])
        
        chain = prompt_template | self.llm
        
        try:
            response = await chain.ainvoke({
                "description": description, 
                "agent_type": agent_type,
                "class_name": class_name
            })
            content = response.content.strip()
            
            # Clean markdown
            if content.startswith("```python"):
                content = content[9:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            # Fix common inheritance issue
            content = content.replace("(agents.base.BaseAgent)", "(BaseAgent)")

            # Ensure import exists
            if "from agents.base import BaseAgent" not in content:
                content = "from agents.base import BaseAgent\n" + content
                
            return content
        except Exception as e:
            print(f"Error generating agent code: {e}")
            return f"""from agents.base import BaseAgent

class {class_name}(BaseAgent):
    def run(self, message: str) -> str:
        return f"Hello, I am {name}. You said: {{message}}"
"""
