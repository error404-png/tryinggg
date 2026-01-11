import sys
print(f"Python version: {sys.version}")

try:
    import torch
    print(f"Torch version: {torch.__version__}")
    print("Torch imported successfully.")
except OSError as e:
    print(f"OSError importing torch: {e}")
except ImportError as e:
    print(f"ImportError importing torch: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
