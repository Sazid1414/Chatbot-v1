from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class ChatRequest(BaseModel):
    session_id: str
    message: str


class SessionCreate(BaseModel):
    title: str | None = None
    model_id: str | None = None


class SessionResponse(BaseModel):
    id: str
    user_id: str
    title: str | None
    model_id: str | None
    created_at: str
    last_active_at: str | None


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    token_count: int | None
    created_at: str


class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
