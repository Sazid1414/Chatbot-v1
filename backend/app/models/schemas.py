from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1, max_length=32000)


class SessionCreate(BaseModel):
    title: str | None = None
    model_id: str | None = None
    knowledge_base_id: str | None = None
    chat_mode: str = "base"

    @field_validator("chat_mode")
    @classmethod
    def validate_chat_mode(cls, v: str) -> str:
        if v not in ("base", "rag", "finetuned"):
            raise ValueError("chat_mode must be base, rag, or finetuned")
        return v


class SessionUpdate(BaseModel):
    title: str | None = None
    model_id: str | None = None
    knowledge_base_id: str | None = None
    chat_mode: str | None = None

    @field_validator("chat_mode")
    @classmethod
    def validate_chat_mode_optional(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in ("base", "rag", "finetuned"):
            raise ValueError("chat_mode must be base, rag, or finetuned")
        return v


class SessionResponse(BaseModel):
    id: str
    user_id: str
    title: str | None
    model_id: str | None
    knowledge_base_id: str | None = None
    chat_mode: str | None = "base"
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


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class KnowledgeBaseResponse(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: str


class IngestRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500_000)
