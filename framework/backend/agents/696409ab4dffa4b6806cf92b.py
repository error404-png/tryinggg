from agents.base import BaseAgent
class TestAgentAgent(BaseAgent):
    def run(self, message: str) -> str:
        return "Agent received message: " + message