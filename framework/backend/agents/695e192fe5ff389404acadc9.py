from agents.base import BaseAgent
class TexttoBinaryAgent(BaseAgent):
    def run(self, message: str) -> str:
        binary_message = ' '.join(format(ord(char), '08b') for char in message)
        return binary_message