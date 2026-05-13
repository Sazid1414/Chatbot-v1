from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.db.supabase import get_supabase
from app.models.schemas import (
    SessionCreate,
    SessionResponse,
    SessionUpdate,
    MessageResponse,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _row_to_session(row: dict) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row.get("title"),
        "model_id": row.get("model_id"),
        "knowledge_base_id": row.get("knowledge_base_id"),
        "chat_mode": row.get("chat_mode") or "base",
        "created_at": row["created_at"],
        "last_active_at": row.get("last_active_at"),
    }


@router.get("", response_model=list[SessionResponse])
async def list_sessions(user_id: str = Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("sessions")
        .select("*")
        .eq("user_id", user_id)
        .order("last_active_at", desc=True)
        .execute()
    )
    return [_row_to_session(r) for r in (result.data or [])]


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    from app.config import get_settings

    settings = get_settings()

    insert_payload: dict = {
        "user_id": user_id,
        "title": body.title,
        "model_id": body.model_id or settings.default_model,
        "last_active_at": "now()",
        "chat_mode": body.chat_mode,
    }
    if body.knowledge_base_id:
        insert_payload["knowledge_base_id"] = body.knowledge_base_id

    result = db.table("sessions").insert(insert_payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create session")
    return _row_to_session(result.data[0])


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    result = (
        db.table("sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return _row_to_session(result.data)


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    body: SessionUpdate,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    existing = (
        db.table("sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Session not found")

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        get_one = (
            db.table("sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        return _row_to_session(get_one.data)

    result = (
        db.table("sessions")
        .update(updates)
        .eq("id", session_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update session")
    return _row_to_session(result.data[0])


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    db.table("sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()


@router.get("/{session_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()

    session = (
        db.table("sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    result = (
        db.table("messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data
