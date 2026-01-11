import streamlit as st
import os
import tempfile
from rag_agent import RAGAgent

# Page Config
st.set_page_config(page_title="EIF RAG Agent", layout="wide")

st.title("🤖 EIF RAG Agent")

# Initialize Session State
if "agent" not in st.session_state:
    try:
        st.session_state.agent = RAGAgent()
        st.success("Agent initialized successfully!")
    except Exception as e:
        st.error(f"Failed to initialize agent: {e}")

if "messages" not in st.session_state:
    st.session_state.messages = []

# Sidebar - File Upload
with st.sidebar:
    st.header("📂 Data Ingestion")
    uploaded_file = st.file_uploader("Upload a document", type=["txt", "pdf"])
    
    if uploaded_file:
        if st.button("Ingest File"):
            with st.spinner("Ingesting..."):
                try:
                    # Save to temp file
                    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{uploaded_file.name.split('.')[-1]}") as tmp_file:
                        tmp_file.write(uploaded_file.getvalue())
                        tmp_path = tmp_file.name
                    
                    # Ingest
                    if "agent" in st.session_state:
                        st.session_state.agent.ingest_file(tmp_path)
                        st.success(f"Ingested {uploaded_file.name}!")
                    
                    # Cleanup
                    os.remove(tmp_path)
                except Exception as e:
                    st.error(f"Error ingesting file: {e}")

    st.divider()
    if st.button("⚠️ Reset Knowledge Base"):
        if "agent" in st.session_state:
            with st.spinner("Clearing database..."):
                st.session_state.agent.reset_database()
                st.success("Database cleared!")


# Chat Interface
st.subheader("💬 Chat")

# Display chat messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Chat Input
if prompt := st.chat_input("Ask a question about your documents..."):
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Generate response
    with st.chat_message("assistant"):
        if "agent" in st.session_state:
            with st.spinner("Thinking..."):
                try:
                    result = st.session_state.agent.query(prompt)
                    answer = result["answer"]
                    sources = result["source_documents"]
                    
                    st.markdown(answer)
                    st.session_state.messages.append({"role": "assistant", "content": answer})
                    
                    # Display Retrieved Context
                    with st.expander("📚 View Retrieved Context (Top 5 Chunks)"):
                        for i, doc in enumerate(sources):
                            st.markdown(f"**Chunk {i+1}** (Source: {doc.metadata.get('source', 'Unknown')})")
                            st.info(doc.page_content)
                            st.divider()
                except Exception as e:
                    st.error(f"Error generating response: {e}")
        else:
            st.error("Agent is not initialized.")
