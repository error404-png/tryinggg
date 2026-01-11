import langchain_core
import langchain_core.language_models
import inspect

print(f"langchain_core version: {langchain_core.__version__}")
print(f"langchain_core file: {langchain_core.__file__}")

try:
    from langchain_core.language_models import ModelProfile
    print("ModelProfile imported successfully")
except ImportError as e:
    print(f"Error importing ModelProfile: {e}")

print("Available in langchain_core.language_models:")
print(dir(langchain_core.language_models))
