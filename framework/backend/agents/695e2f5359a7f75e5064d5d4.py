from agents.base import BaseAgent
from deep_translator import GoogleTranslator

class EnglishToHindiAgent(BaseAgent):
    def run(self, message: str) -> str:
        try:
            translator = GoogleTranslator(source='en', target='hi')
            
            # chunk limit is usually 5000, keep it safe at 2000
            chunk_size = 2000
            chunks = [message[i:i+chunk_size] for i in range(0, len(message), chunk_size)]
            
            translated_chunks = []
            for chunk in chunks:
                try:
                    res = translator.translate(chunk)
                except Exception:
                    res = "" # fallback
                
                if not res:
                     res = "" 
                translated_chunks.append(res)
                
            return " ".join(translated_chunks)
        except Exception as e:
            return f"Translation Error: {str(e)}"
