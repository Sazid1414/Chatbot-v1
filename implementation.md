# Implementation Plan — LLM Chatbot v1

> Derived from the design documents in `design/`. This plan covers the full-stack
> implementation using **Next.js + Tailwind** (frontend), **FastAPI + Python** (backend),
> **Supabase** (auth + Postgres), and **Ollama** (local LLM inference).

---

## 1. Repository Structure

```
Chatbot-v1/
├── frontend/                 # Next.js app (yarn)
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Landing → redirect to /chat or /login
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login / register page
│   │   │   ├── chat/
│   │   │   │   └── page.tsx        # Main chat interface (protected)
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts    # OAuth callback handler
│   │   ├── components/
│   │   │   ├── ChatInput.tsx       # Message input box + send button
│   │   │   ├── MessageBubble.tsx   # Single message (user/assistant)
│   │   │   ├── MessageFeed.tsx     # Scrollable message list
│   │   │   ├── Sidebar.tsx         # Session history sidebar
│   │   │   ├── SessionItem.tsx     # Single session in sidebar
│   │   │   ├── ModelSelector.tsx   # Dropdown to pick Ollama model
│   │   │   └── AuthGuard.tsx       # Redirect if not authenticated
│   │   ├── lib/
│   │   │   ├── supabase.ts         # Supabase client (browser + server)
│   │   │   ├── api.ts              # Fetch helpers for FastAPI backend
│   │   │   └── sse.ts              # SSE stream reader utility
│   │   ├── hooks/
│   │   │   ├── useChat.ts          # Chat state + SSE streaming logic
│   │   │   ├── useSessions.ts      # Session CRUD + list
│   │   │   └── useAuth.ts          # Auth state wrapper
│   │   └── types/
│   │       └── index.ts            # Shared TS interfaces
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, API_URL
│
├── backend/                  # FastAPI app (venv)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry, CORS, lifespan
│   │   ├── config.py               # Pydantic Settings (env vars)
│   │   ├── dependencies.py         # get_current_user (JWT validation)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py             # POST /api/chat (SSE streaming)
│   │   │   ├── sessions.py         # CRUD /api/sessions
│   │   │   └── health.py           # GET /api/health
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── context_builder.py  # Pipeline: history + system prompt
│   │   │   ├── model_router.py     # Maps session.model_id → Ollama model
│   │   │   ├── ollama_client.py    # httpx async streaming to Ollama
│   │   │   └── history_writer.py   # Persists user + assistant messages
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py          # Pydantic request/response models
│   │   └── db/
│   │       ├── __init__.py
│   │       └── supabase.py         # Supabase client (service role)
│   ├── requirements.txt
│   ├── .env                        # SUPABASE_URL, SERVICE_KEY, OLLAMA_URL, JWT_SECRET
│   └── README.md
│
├── design/                   # Existing design artifacts (read-only)
├── implementation.md         # ← This file
└── README.md
```

---

## 2. Tech Stack & Versions

| Layer      | Technology              | Purpose                              |
|------------|------------------------|--------------------------------------|
| Frontend   | Next.js 15 (App Router) | React SSR + client components       |
| Styling    | Tailwind CSS 4          | Utility-first CSS                   |
| Pkg mgr    | Yarn                    | Frontend dependency management       |
| Backend    | FastAPI                 | Async Python API server              |
| Python env | venv                    | Isolated Python environment          |
| Auth       | Supabase Auth           | Email/password + Google OAuth        |
| Database   | Supabase Postgres       | Sessions, messages, users (RLS)      |
| LLM        | Ollama                  | Local model inference (Llama 3, etc) |
| HTTP       | httpx                   | Async HTTP client (backend → Ollama) |
| Streaming  | SSE                     | Server-Sent Events (backend → client)|

---

## 3. Database Schema

All tables live in Supabase Postgres. `auth.users` is managed by Supabase Auth.

### 3.1 `auth.users` (managed by Supabase)

| Column      | Type        | Notes    |
|-------------|-------------|----------|
| id          | uuid        | PK       |
| email       | text        | unique   |

### 3.2 `sessions`

| Column         | Type         | Notes                          |
|----------------|--------------|--------------------------------|
| id             | uuid         | PK, default gen_random_uuid()  |
| user_id        | uuid         | FK → auth.users(id)            |
| title          | text         | Auto-generated from first msg  |
| model_id       | text         | Ollama model name (e.g. "llama3") |
| created_at     | timestamptz  | default now()                  |
| last_active_at | timestamptz  | updated on each message        |

### 3.3 `messages`

| Column      | Type         | Notes                           |
|-------------|--------------|----------------------------------|
| id          | uuid         | PK, default gen_random_uuid()    |
| session_id  | uuid         | FK → sessions(id) ON DELETE CASCADE |
| role        | text         | "user" or "assistant"            |
| content     | text         | Message body                     |
| token_count | integer      | Token count for context budgeting |
| created_at  | timestamptz  | default now()                    |

### 3.4 Row Level Security (RLS)

Enable RLS on `sessions` and `messages` from day one:

```sql
-- sessions: users can only access their own sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions"
  ON sessions FOR ALL
  USING (user_id = auth.uid());

-- messages: users can only access messages in their sessions
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages"
  ON messages FOR ALL
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = auth.uid()
  ));
```

### 3.5 Future RAG Tables (not implemented in v1)

- `knowledge_bases` (id, user_id FK, name)
- `chunks` (id, kb_id FK, chunk_text, embedding vector(768))
- Enable `pgvector` extension now: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## 4. Backend Implementation

### 4.1 Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install fastapi uvicorn httpx python-jose[cryptography] pydantic-settings supabase python-dotenv
pip freeze > requirements.txt
```

### 4.2 API Endpoints

| Method | Route                          | Auth | Description                          |
|--------|--------------------------------|------|--------------------------------------|
| GET    | `/api/health`                  | No   | Health check                         |
| POST   | `/api/chat`                    | Yes  | Send message, get SSE stream back    |
| GET    | `/api/sessions`                | Yes  | List user's sessions (sorted by last_active_at) |
| POST   | `/api/sessions`                | Yes  | Create a new session                 |
| GET    | `/api/sessions/{id}`           | Yes  | Get session details                  |
| DELETE | `/api/sessions/{id}`           | Yes  | Delete a session + cascade messages  |
| GET    | `/api/sessions/{id}/messages`  | Yes  | Get messages for a session           |

### 4.3 Core Services

**JWT Validation (`dependencies.py`)**
- Extract Bearer token from `Authorization` header
- Decode using Supabase JWT secret (HS256)
- Extract `sub` claim as `user_id`
- Return as `Depends(get_current_user)` in route handlers

**Context Builder (`services/context_builder.py`)**
- Pipeline design (not monolithic function) for future RAG extensibility
- Steps: load last N messages → count tokens → trim to context window → prepend system prompt
- System prompt is configurable via env var
- Future: insert RAG retrieval step between history load and prompt assembly

**Model Router (`services/model_router.py`)**
- Read `model_id` from session record
- Map to Ollama model name (dict config)
- Default to `llama3` if not set
- Future: add `domain-ft-model` as valid value

**Ollama Client (`services/ollama_client.py`)**
- Use `httpx.AsyncClient` with streaming
- POST to `{OLLAMA_URL}/api/chat` with `stream: true`
- Yield tokens as they arrive
- Return full response text + token count on completion

**History Writer (`services/history_writer.py`)**
- Save user message immediately before calling LLM
- Save assistant message after stream completes (with full concatenated text)
- Update `sessions.last_active_at`
- Auto-generate session title from first user message (first 50 chars)

### 4.4 SSE Streaming Flow

```
Client POST /api/chat { session_id, message }
  → JWT middleware validates token → user_id
  → Save user message to DB
  → Context builder: load history + build prompt
  → Model router: resolve Ollama model name
  → Ollama client: stream tokens via httpx
  → StreamingResponse(media_type="text/event-stream")
      → Each token: yield f"data: {json.dumps({'token': token})}\n\n"
      → On complete: yield f"data: {json.dumps({'done': true})}\n\n"
  → History writer: save assistant message + update session
```

---

## 5. Frontend Implementation

### 5.1 Setup

```bash
cd frontend
yarn create next-app . --typescript --tailwind --eslint --app --src-dir
yarn add @supabase/supabase-js @supabase/ssr
```

### 5.2 Pages

**Login Page (`/login`)**
- Email + password form (sign up / sign in)
- Google OAuth button
- Uses Supabase Auth client
- Redirects to `/chat` on success

**Chat Page (`/chat`) — Protected**
- Layout: sidebar (left) + chat area (right)
- Sidebar: list of sessions, "New Chat" button, sorted by recency
- Chat area: message feed + input box
- Model selector dropdown (optional, per-session)
- AuthGuard component: redirects to `/login` if no session

**OAuth Callback (`/auth/callback`)**
- Exchanges auth code for session via Supabase
- Redirects to `/chat`

### 5.3 Key Components

**`ChatInput`**
- Textarea with auto-resize
- Send on Enter (Shift+Enter for newline)
- Disabled while streaming
- Loading spinner during generation

**`MessageFeed`**
- Maps messages array to `MessageBubble` components
- Auto-scrolls to bottom on new messages
- Shows typing indicator during streaming

**`MessageBubble`**
- Distinct styles for user (right-aligned) vs assistant (left-aligned)
- Markdown rendering for assistant responses
- Copy button on hover

**`Sidebar`**
- Fetches sessions via `/api/sessions`
- Clicking a session loads its messages
- "New Chat" creates a new session
- Delete session with confirmation
- Responsive: collapsible on mobile

### 5.4 SSE Client Logic (`lib/sse.ts` + `hooks/useChat.ts`)

```typescript
// Simplified SSE flow
const response = await fetch(`${API_URL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ session_id, message }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE "data: {...}" lines
  // Append token to current assistant message
  // Update state incrementally
}
```

### 5.5 Auth Integration

- Supabase client created in `lib/supabase.ts` (browser + server variants)
- On login: Supabase returns JWT access token + refresh token
- Access token attached to every FastAPI request as `Authorization: Bearer <token>`
- Token refresh handled by Supabase client SDK automatically
- `useAuth` hook wraps `onAuthStateChange` listener

---

## 6. Environment Variables

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3
SYSTEM_PROMPT="You are a helpful assistant."
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 7. Implementation Phases

### Phase 1: Project Scaffolding
1. Initialize backend: create venv, install deps, configure FastAPI app with CORS
2. Initialize frontend: create Next.js app with yarn, install Supabase packages
3. Set up environment variable templates (`.env.example` files)

### Phase 2: Authentication
1. Configure Supabase project (create tables, enable RLS, set up auth providers)
2. Backend: implement JWT validation middleware (`dependencies.py`)
3. Frontend: implement login/register page with Supabase Auth
4. Frontend: implement OAuth callback route
5. Frontend: implement `AuthGuard` and `useAuth` hook

### Phase 3: Session Management
1. Backend: implement sessions CRUD endpoints
2. Frontend: implement Sidebar with session list
3. Frontend: implement "New Chat" and "Delete Session" functionality
4. Wire up session selection → message loading

### Phase 4: Chat Core
1. Backend: implement context builder pipeline
2. Backend: implement Ollama client with httpx streaming
3. Backend: implement model router
4. Backend: implement POST `/api/chat` SSE endpoint
5. Backend: implement history writer (save messages post-stream)
6. Frontend: implement ChatInput, MessageBubble, MessageFeed
7. Frontend: implement SSE reader + `useChat` hook
8. End-to-end test: send message → see streamed response

### Phase 5: Polish & UX
1. Frontend: markdown rendering for assistant messages
2. Frontend: responsive layout (mobile sidebar toggle)
3. Frontend: loading states, error handling, retry logic
4. Frontend: auto-scroll, typing indicators
5. Backend: proper error responses, request validation
6. Backend: token counting + context window management

### Phase 6: Future (out of v1 scope)
- RAG: pgvector, document ingestion, vector retrieval, prompt augmentation
- Fine-tuning: LoRA → GGUF → Ollama Modelfile
- Model registry with mode switching (base / rag / finetuned)

---

## 8. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| SSE over WebSocket | Simpler for unidirectional streaming; no persistent connection overhead |
| `model_id` on sessions | Audit trail for which model generated responses; enables future model switching |
| Context builder as pipeline | Inserting RAG retrieval step later requires only adding a pipeline stage |
| RLS from day one | Per-user data isolation at the DB level; biggest security win from Supabase |
| `pgvector` extension enabled now | Costs nothing; avoids migration pain later when adding RAG |
| Save assistant message after stream | Ensures we store the complete response, not partial |
| Supabase Auth (not custom) | Handles JWTs, refresh tokens, OAuth, email verification out of the box |
| httpx async for Ollama | Native async streaming support; better than synchronous requests |

---

## 9. Development Workflow

```bash
# Terminal 1 — Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
yarn dev

# Terminal 3 — Ollama (must be running)
ollama serve
ollama pull llama3
```

---

## 10. Startup Commands (Quick Reference)

```bash
# First-time setup
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
yarn install

# Run everything
# 1. Start Ollama: ollama serve
# 2. Start backend: cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
# 3. Start frontend: cd frontend && yarn dev
# 4. Open http://localhost:3000
```
