import langchain
import os
import sys

print(f"LangChain Version: {langchain.__version__}")
print(f"LangChain File: {langchain.__file__}")
print(f"LangChain Path: {langchain.__path__}")

try:
    import langchain.chains
    print("langchain.chains imported successfully")
except ImportError as e:
    print(f"Error importing langchain.chains: {e}")

try:
    from langchain.chains import create_retrieval_chain
    print("create_retrieval_chain imported successfully")
except ImportError as e:
    print(f"Error importing create_retrieval_chain: {e}")

# Check if we can import from langchain.chains.retrieval
try:
    from langchain.chains.retrieval import create_retrieval_chain
    print("create_retrieval_chain imported from langchain.chains.retrieval")
except ImportError as e:
    print(f"Error importing from langchain.chains.retrieval: {e}")
