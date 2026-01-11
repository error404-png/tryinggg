from agents.base import BaseAgent
class DocumentanalyzerAgent(BaseAgent):
    def run(self, message: str) -> str:
        # Assuming the message is a string containing the uploaded document text
        import nltk
        from nltk.tokenize import word_tokenize
        from nltk.corpus import stopwords
        from nltk.stem import WordNetLemmatizer
        lemmatizer = WordNetLemmatizer()
        stop_words = set(stopwords.words('english'))

        # Tokenize the message into words
        tokens = word_tokenize(message)

        # Remove stopwords and lemmatize the tokens
        skills = [lemmatizer.lemmatize(token) for token in tokens if token.isalpha() and token.lower() not in stop_words]

        # Join the skills into a string
        return ' '.join(skills)