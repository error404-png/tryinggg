from agents.base import BaseAgent
from deep_translator import GoogleTranslator

class hinditoenglishAgent(BaseAgent):
    def __init__(self):
        self.translator = GoogleTranslator(source='auto', target='en')

    def run(self, message: str) -> str:
        try:
            translation = self.translator.translate(message)
            return translation
        except Exception as e:
            return f"An error occurred: {str(e)}"
