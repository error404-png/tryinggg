import sys
print("Starting full import test...")
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    print("HuggingFaceEmbeddings imported.")
    import transformers
    print(f"Transformers version: {transformers.__version__}")
    import torch
    print(f"Torch version: {torch.__version__}")
except Exception as e:
    print(f"Error during import: {e}")
