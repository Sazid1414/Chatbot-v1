# Chatbot-v1

LLM Chatbot powered by **Ollama** (local inference), **FastAPI** (backend), **Next.js** (frontend), and **Supabase** (auth + database).

## Architecture

| Layer    | Tech                     | Purpose                                |
|----------|--------------------------|----------------------------------------|
| Frontend | Next.js 15 + Tailwind    | Chat UI, auth pages, SSE streaming     |
| Backend  | FastAPI + Python         | API server, context builder, Ollama proxy |
| Auth     | Supabase Auth            | Email/password + Google OAuth, JWT     |
| Database | Supabase Postgres        | Sessions, messages (with RLS)          |
| LLM      | Ollama                   | Local model inference (Llama 3, etc.)  |

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **Yarn**
- **Ollama** running locally (`ollama serve`)
- **Supabase** project (free tier works)

## Quick Start

### 1. Clone and configure

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your Supabase public keys
```

### 2. Set up Supabase

Create the `sessions` and `messages` tables in your Supabase project. See `implementation.md` section 3 for the full schema and RLS policies.

### 3. Install and run

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (use source venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
yarn install
yarn dev

# Terminal 3 — Ollama
ollama serve
ollama pull llama3
```

### 4. Open

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py           # App entry point
│   │   ├── config.py         # Environment settings
│   │   ├── dependencies.py   # JWT auth middleware
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── models/           # Pydantic schemas
│   │   └── db/               # Supabase client
│   └── requirements.txt
├── frontend/         # Next.js TypeScript frontend
│   └── src/
│       ├── app/              # Pages (login, chat, auth callback)
│       ├── components/       # React components
│       ├── hooks/            # Custom hooks (useAuth, useChat, useSessions)
│       ├── lib/              # Supabase client, API helpers, SSE parser
│       └── types/            # TypeScript interfaces
├── design/           # Architecture diagrams and design docs
└── implementation.md # Detailed implementation plan
```

## API Endpoints

| Method | Route                          | Auth | Description                     |
|--------|--------------------------------|------|---------------------------------|
| GET    | `/api/health`                  | No   | Health check + Ollama status    |
| POST   | `/api/chat`                    | Yes  | Send message, receive SSE stream |
| GET    | `/api/sessions`                | Yes  | List user sessions              |
| POST   | `/api/sessions`                | Yes  | Create new session              |
| GET    | `/api/sessions/{id}`           | Yes  | Get session details             |
| DELETE | `/api/sessions/{id}`           | Yes  | Delete session                  |
| GET    | `/api/sessions/{id}/messages`  | Yes  | Get session messages            |
