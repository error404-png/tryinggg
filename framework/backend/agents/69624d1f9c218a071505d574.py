from agents.base import BaseAgent
from deep_translator import GoogleTranslator

class englishtohindi2Agent(BaseAgent):
    def __init__(self, name, config):
        self.name = name
        self.config = config
        self.translator = GoogleTranslator(source='auto', target='hi')

    def run(self, message: str) -> str:
        try:
            translation = self.translator.translate(message)
            return translation
        except Exception as e:
            return f"Error: {str(e)}"
