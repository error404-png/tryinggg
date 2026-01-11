from agents.base import BaseAgent
class SkillsFinderAgent(BaseAgent):
    def __init__(self):
        super().__init__()
        self.skills = []

    def run(self, message: str) -> str:
        # Assuming the message is a json object containing the uploaded document
        try:
            import json
            document = json.loads(message)
            text = document.get('text', '')

            # Using Natural Language Processing (NLP) techniques to find skills
            from nltk.tokenize import word_tokenize
            from nltk.corpus import stopwords
            from nltk.stem import PorterStemmer

            nltk.download('punkt')
            nltk.download('stopwords')

            stemmer = PorterStemmer()
            tokens = word_tokenize(text)
            tokens = [stemmer.stem(token) for token in tokens]
            tokens = [token for token in tokens if token.isalpha()]
            tokens = [token for token in tokens if token not in stopwords.words('english')]

            self.skills = tokens
            return json.dumps({'skills': self.skills})
        except Exception as e:
            return json.dumps({'error': str(e)})