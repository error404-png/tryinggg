# Agent Orchestration System

An advanced platform for managing, chaining, and deploying AI agents. Built with a modern React frontend and a robust FastAPI backend.

## 🚀 Project Overview

This application allows users to:
- **Create & Manage Projects**: Organize agents into distinct projects.
- **Agent Library**: extensive library of pre-built agents (Email, RAG, etc.).
- **Agent Chaining**: Visually drag-and-drop agents to create complex workflows where the output of one agent becomes the input of another.
- **RAG Support**: Upload documents to empower agents with specific knowledge bases.
- **Real-time Chat**: Interact with agents via a responsive, glassmorphism-styled chat interface.
- **Access Logs**: Monitor usage and performance via a dedicated dashboard.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: FastAPI, MongoDB (Motor), Python
- **AI/LLM**: Integration with Groq and external Agent frameworks
- **Authentication**: JWT-based auth with strict role management (Admin/Basic)

## 📦 Setup & Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB instance

### 1. Backend Setup
```bash
cd framework/backend

# Create virtual environment
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Copy the example env file and fill in your credentials
cp .env.example .env
# Required keys: GROQ_API_KEY, MONGO_URI, etc.

# Run the server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd framework/frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

## 🔄 Demo Flow

1.  **Register/Login**: Create a new account. The first user might need to be set as Admin (check `create_admin.py` if needed) or just register normally.
2.  **Dashboard**: Land on the "Access Log" dashboard. Click "Create New Project" to start.
3.  **Project Details**: Enter the project.
4.  **Add Agents**: Use the "Agent Library" to add a "Chat Agent" and "Document Retrieval Agent".
5.  **Configure Chain**: (Optional) Drag agents to define an execution order.
6.  **Chat**: Go to the Chat interface.
7.  **Interactive**: Type a message. If using RAG, upload a file first. Watch the agents process and respond in real-time.

## 🔒 Security Note
- `.env` files are excluded from version control.
- No sensitive keys are hardcoded in the repository.
- Use `.env.example` to set up your local environment.
