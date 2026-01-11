import os
from rag_agent import RAGAgent

def main():
    print("--- EIF RAG Agent ---")
    
    # Check for .env
    if not os.path.exists(".env"):
        print("WARNING: .env file not found. Please create one based on .env.example.")
        return

    try:
        agent = RAGAgent()
        
        while True:
            print("\nOptions:")
            print("1. Ingest File")
            print("2. Ask Question")
            print("3. Exit")
            
            choice = input("Enter choice (1-3): ")
            
            if choice == "1":
                file_path = input("Enter absolute file path: ")
                if os.path.exists(file_path):
                    agent.ingest_file(file_path)
                else:
                    print("File not found.")
            
            elif choice == "2":
                query = input("Enter your question: ")
                result = agent.query(query)
                print(f"\nAnswer: {result['answer']}")
                print("\n--- Retrieved Context ---")
                for i, doc in enumerate(result['source_documents']):
                    print(f"\n[Chunk {i+1}]")
                    print(doc.page_content[:200] + "...") # Print first 200 chars

            
            elif choice == "3":
                print("Exiting...")
                break
            
            else:
                print("Invalid choice.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
