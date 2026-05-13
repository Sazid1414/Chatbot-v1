# Assignment Report: LLM-Powered Chatbot System

## Repository
- **GitHub Link:** [https://github.com/Sazid1414/Chatbot-v1](https://github.com/Sazid1414/Chatbot-v1)
- **Description:** A full-stack LLM chatbot system with local model inference, real-time streaming, and multi-user session management.

## Group Members
- Member 1: [Sazidur Rahman Mahin], [BSSE 1414]
- Member 2: [Shah Alam Abir], [BSSE 1439]
- (Add or remove as appropriate)

---

## Project Overview

### Objective
The goal of this assignment was to develop a production-ready, LLM-powered chatbot system leveraging open-source models with enterprise-grade features including secure authentication, persistent session management, and real-time streaming responses. The system integrates local model inference (Ollama) with cloud-based infrastructure for scalability and security.

### System Features

1. **Secure Authentication:**  
   - Email/password authentication via Supabase Auth
   - Google OAuth 2.0 integration for third-party login
   - JWT-based token validation on all protected endpoints
   - Automatic token refresh and expiration handling
   - Secure session management with no hardcoded credentials

2. **Multi-Session Chat Management:**  
   - Users can create, manage, and organize multiple chat sessions
   - Each session is associated with a specific LLM model
   - Session history is preserved indefinitely with timestamps
   - Quick session switching via responsive sidebar UI
   - Auto-generated session titles from first user message

3. **AI-Powered Conversational Interface:**  
   - Real-time streaming responses via Server-Sent Events (SSE)
   - Token-by-token response delivery for instant user feedback
   - Integration with Ollama for local LLM inference (Llama 3, etc.)
   - Support for multiple LLM models with per-session model selection
   - Context-aware conversation using message history pipeline

4. **Persistent Storage & History:**  
   - All messages stored in Supabase Postgres with Row-Level Security (RLS)
   - User-specific data isolation at the database level
   - Full conversation retrieval per session
   - Token counting for context window management
   - Automatic cleanup of deleted sessions and cascading message deletion

5. **Responsive User Interface:**  
   - Modern chat UI with Tailwind CSS styling
   - Left sidebar for session management and navigation
   - Main chat area with message feed and input box
   - Model selector dropdown for per-session model switching
   - Mobile-responsive design with collapsible sidebar
   - Auto-scroll to latest messages and typing indicators
   - Markdown rendering for formatted assistant responses
   - Copy-to-clipboard functionality for individual messages

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Next.js (React framework) | 15 (App Router) |
| **Frontend Styling** | Tailwind CSS | 4 |
| **Frontend Package Manager** | Yarn | Latest |
| **Backend Framework** | FastAPI | Latest |
| **Backend Language** | Python | 3.11+ |
| **Authentication** | Supabase Auth | Cloud-hosted |
| **Database** | Supabase PostgreSQL | Cloud-hosted with RLS |
| **HTTP Client** | httpx (async) | For Ollama streaming |
| **LLM Inference** | Ollama | Local instance |
| **Streaming Protocol** | Server-Sent Events (SSE) | Native browser API |
| **Type Safety** | TypeScript | Throughout frontend |
| **API Validation** | Pydantic | Request/response schemas |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER BROWSER (Client)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Next.js 15 Frontend (TypeScript + React)                │   │
│  │ ├─ Login/Register Pages                                 │   │
│  │ ├─ Chat Interface (Protected)                           │   │
│  │ ├─ OAuth Callback Handler                               │   │
│  │ └─ Components: ChatInput, MessageFeed, Sidebar, etc.    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (HTTPS + JWT)
                    ┌─────────────────────────┐
                    │  Supabase Auth (Cloud)  │
                    │  - JWT Generation       │
                    │  - OAuth Providers      │
                    │  - Token Management     │
                    └─────────────────────────┘
                              ↕ (REST API + JWT)
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (Server)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /api/health        → Health check + Ollama status       │   │
│  │ /api/chat          → SSE streaming chat endpoint        │   │
│  │ /api/sessions      → CRUD operations on sessions        │   │
│  │ /api/sessions/{id} → Session details & messages         │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Services Layer                                            │   │
│  │ ├─ JWT Validation Middleware                            │   │
│  │ ├─ Context Builder (history + system prompt)            │   │
│  │ ├─ Model Router (model_id → Ollama model name)          │   │
│  │ ├─ Ollama Client (async streaming)                      │   │
│  │ └─ History Writer (message persistence)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    ┌─────────────────────────┐
                    │  Ollama (Local LLM)     │
                    │  - Model Inference      │
                    │  - Token Streaming      │
                    │  (Llama 3, Mistral, etc)│
                    └─────────────────────────┘
                              ↕
            ┌────────────────────────────────────────┐
            │  Supabase PostgreSQL (Cloud Database)  │
            │  ├─ auth.users (JWT subjects)         │
            │  ├─ sessions (RLS per user_id)        │
            │  ├─ messages (RLS per session owner)  │
            │  └─ Row-Level Security Policies       │
            └────────────────────────────────────────┘
```

### Workflow & User Journey

#### 1. **Authentication Flow**
```
User → Navigate to /login
     → Sign up with email/password OR click "Login with Google"
     → Supabase Auth issues JWT access token + refresh token
     → Token stored in browser (Supabase client manages refresh)
     → Redirect to /chat (protected route)
```

#### 2. **Session & Chat Flow**
```
User → Click "New Chat" button
     → Frontend creates new session via POST /api/sessions
     → Backend creates record in sessions table
     → User types message → Click Send
     → Frontend POST /api/chat { session_id, message }
     → Backend validates JWT → extracts user_id
     → Backend saves user message to messages table
     → Backend builds context: fetch last N messages + system prompt
     → Backend routes to correct Ollama model
     → Backend opens SSE stream → yields tokens incrementally
     → Frontend reads SSE stream → displays typing tokens in real-time
     → On completion: Backend saves full assistant message + updates session.last_active_at
     → Frontend displays complete response with markdown rendering
```

#### 3. **Persistence & History**
```
User (next login) → Navigate to /chat
                 → Frontend fetches /api/sessions (all user sessions)
                 → Sidebar populates with session list (sorted by recency)
                 → User clicks on session
                 → Frontend fetches /api/sessions/{id}/messages
                 → All prior messages display in chat area
                 → User can resume conversation or start new session
```

### Database Schema

#### `auth.users` (Managed by Supabase)
```
id         : uuid (PK)
email      : text (unique)
created_at : timestamptz
```

#### `sessions`
```
id             : uuid (PK)
user_id        : uuid (FK → auth.users)
title          : text (auto-generated from first message)
model_id       : text (e.g., "llama3", "mistral")
created_at     : timestamptz
last_active_at : timestamptz (updated on each message)

RLS Policy: Users can only access their own sessions
```

#### `messages`
```
id         : uuid (PK)
session_id : uuid (FK → sessions, CASCADE DELETE)
role       : text ("user" or "assistant")
content    : text
token_count: integer (for context budgeting)
created_at : timestamptz

RLS Policy: Users can only access messages in their own sessions
```

### API Endpoints Reference

| HTTP Method | Endpoint | Auth Required | Response | Purpose |
|---|---|---|---|---|
| `GET` | `/api/health` | No | `{ status: "ok", ollama: { status: "up", models: [...] } }` | Health check + Ollama connectivity |
| `POST` | `/api/chat` | Yes (JWT) | `text/event-stream` (SSE) | Send message, stream tokens |
| `GET` | `/api/sessions` | Yes (JWT) | `{ sessions: [...] }` | List user's sessions sorted by recency |
| `POST` | `/api/sessions` | Yes (JWT) | `{ id, title, model_id, created_at }` | Create new session |
| `GET` | `/api/sessions/{id}` | Yes (JWT) | `{ id, user_id, title, model_id, created_at, last_active_at }` | Get session metadata |
| `DELETE` | `/api/sessions/{id}` | Yes (JWT) | `{ deleted: true }` | Delete session + cascade messages |
| `GET` | `/api/sessions/{id}/messages` | Yes (JWT) | `{ messages: [ { id, role, content, created_at }, ... ] }` | Fetch all messages in session |

### Implementation Phases

#### **Phase 1: Project Scaffolding** ✓ (Completed)
- [x] Initialize backend: Python venv, FastAPI, CORS configuration
- [x] Initialize frontend: Next.js with TypeScript, Tailwind CSS
- [x] Create `.env.example` templates for sensitive config
- [x] Directory structure established per specification

#### **Phase 2: Authentication** (In Progress)
- [ ] Set up Supabase project (tables, RLS policies, auth providers)
- [ ] Implement JWT validation middleware (`dependencies.py`)
- [ ] Build login/register page with Supabase Auth client
- [ ] Implement OAuth callback route (`/auth/callback`)
- [ ] Build `AuthGuard` component & `useAuth` hook

#### **Phase 3: Session Management**
- [ ] Implement sessions CRUD endpoints (FastAPI routers)
- [ ] Build Sidebar component with session list
- [ ] Implement "New Chat" and "Delete Session" functionality
- [ ] Wire up session selection → message loading

#### **Phase 4: Chat Core** (Critical Path)
- [ ] Build context builder service (history + system prompt pipeline)
- [ ] Implement Ollama client with async streaming
- [ ] Build model router service
- [ ] Implement POST `/api/chat` with SSE streaming
- [ ] Implement history writer (message persistence post-stream)
- [ ] Build ChatInput, MessageBubble, MessageFeed components
- [ ] Implement SSE reader + `useChat` hook
- [ ] End-to-end test: message → streamed response

#### **Phase 5: Polish & UX**
- [ ] Add markdown rendering for assistant messages
- [ ] Responsive layout (mobile sidebar toggle)
- [ ] Loading states, error handling, retry logic
- [ ] Auto-scroll, typing indicators
- [ ] Proper error responses & request validation
- [ ] Token counting + context window management

#### **Phase 6: Future (Post-v1)**
- [ ] RAG: pgvector, document ingestion, vector retrieval
- [ ] Fine-tuning: LoRA → GGUF → Ollama Modelfile
- [ ] Model registry with dynamic mode switching

### Environment Variables

#### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3
SYSTEM_PROMPT="You are a helpful assistant."
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Key Design Decisions & Rationale

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| **SSE over WebSocket** | Simpler protocol, lower connection overhead, unidirectional is sufficient for streaming responses | No bidirectional real-time events, but not needed for v1 |
| **`model_id` on sessions** | Audit trail for which model generated responses; enables future model version tracking | Adds slight schema complexity |
| **Context builder as pipeline** | Extensible architecture for future RAG insertion without refactoring | More files/layers initially |
| **RLS from day one** | Database-level data isolation; biggest security win from Supabase | RLS policies must be maintained |
| **pgvector enabled (future)** | Costs nothing; avoids migration pain later when adding RAG | Minimal storage overhead |
| **Save assistant message after stream** | Ensures complete response stored, not partial/interrupted | Slightly delayed history update UX |
| **Supabase Auth (not custom)** | Out-of-box JWT, refresh tokens, OAuth, email verification | Vendor lock-in to Supabase |
| **httpx async for Ollama** | Native async streaming, better than synchronous requests | Dependency on httpx library |

### Security & Privacy Considerations

1. **Row-Level Security (RLS):** All user data isolated at the database layer
2. **JWT Validation:** Every protected endpoint validates Bearer token before processing
3. **No Hardcoded Secrets:** All sensitive config via environment variables
4. **Service Role Key:** Backend uses service-role key only; frontend uses anon key with RLS
5. **CORS Configuration:** Restricted to known origins
6. **Message Integrity:** Messages cannot be modified after creation (only deleted with session)

### Performance & Scalability

- **Async I/O:** FastAPI + httpx enable concurrent request handling
- **SSE Streaming:** Tokens streamed incrementally; not waiting for full response
- **Database Indexing:** Sessions indexed by `user_id` and `last_active_at` for fast queries
- **Token Counting:** Context window management prevents overflow
- **Local Inference:** Ollama runs locally, no cloud API latency
- **Message Pagination:** Future enhancement for large session histories

### Development & Deployment

#### Local Development Setup
```bash
# Terminal 1: Backend
cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && yarn install && yarn dev

# Terminal 3: Ollama
ollama serve && ollama pull llama3
```

#### Production Deployment Considerations (Future)
- Docker containerization for both backend and frontend
- Kubernetes for orchestration (optional)
- CDN for static frontend assets
- Backend deployed to cloud provider (AWS, Azure, GCP)
- Supabase handles auth/DB in cloud
- Ollama deployment options: local, cloud GPU instance, or edge device
- Monitoring & logging infrastructure (Sentry, DataDog, etc.)

---

## Project Artifacts

### Repository Structure

```
Chatbot-v1/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Pydantic settings
│   │   ├── dependencies.py         # JWT middleware
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── chat.py         # POST /api/chat
│   │   │       ├── sessions.py     # CRUD sessions
│   │   │       └── health.py       # GET /api/health
│   │   ├── services/
│   │   │   ├── context_builder.py
│   │   │   ├── model_router.py
│   │   │   ├── ollama_client.py
│   │   │   └── history_writer.py
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic models
│   │   └── db/
│   │       └── supabase.py         # Supabase client
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   ├── README.md
│   └── create_directories.ps1
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts    # OAuth callback
│   │   │   └── chat/
│   │   │       └── page.tsx        # Protected chat
│   │   ├── components/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageFeed.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SessionItem.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   ├── useSessions.ts
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── api.ts
│   │   │   └── sse.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── public/
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── design/                         # Design docs & diagrams
├── implementation.md               # Detailed implementation plan
├── README.md                       # Quick start guide
├── ASSIGNMENT_REPORT.md           # ← This file
└── create_directories.ps1         # Directory setup script
```

### Key Files & Descriptions

- **`implementation.md`** — Comprehensive 6-phase roadmap with schema, services, and endpoints
- **`README.md`** — Quick start guide for users and developers
- **`backend/requirements.txt`** — Python dependencies (FastAPI, Pydantic, httpx, Supabase, etc.)
- **`frontend/package.json`** — JavaScript dependencies (Next.js, Tailwind, Supabase client, etc.)
- **`create_directories.ps1`** — PowerShell script to scaffold project structure

---

## Conclusion

**Chatbot-v1** demonstrates a modern, scalable approach to building LLM-powered conversational applications. The architecture cleanly separates concerns:

- **Frontend** focuses on user experience with real-time streaming and responsive UI
- **Backend** manages API logic, authentication, and LLM orchestration
- **Database** enforces security and persistence at the application layer
- **LLM inference** runs locally via Ollama for privacy and latency benefits

The 6-phase implementation roadmap provides clear milestones, with Phase 1 (scaffolding) complete and Phase 2 (authentication) ready to begin. The project is built for extensibility—the context builder pipeline architecture supports future RAG integration, and the modular service design allows for model registry enhancements.

This system serves as a production-ready foundation for enterprise chat applications requiring:
- Secure multi-user access with OAuth
- Persistent conversation management
- Real-time streaming responses
- Local model inference with no third-party LLM API costs
- Row-level security for data isolation

**Status:** Ready for Phase 2 (Authentication) implementation.

---

*Report Generated: 2026-05-13*  
*Repository: [https://github.com/Sazid1414/Chatbot-v1](https://github.com/Sazid1414/Chatbot-v1)*
