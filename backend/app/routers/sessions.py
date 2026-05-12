from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.db.supabase import get_supabase
from app.models.schemas import SessionCreate, SessionResponse, MessageResponse

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


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
    return result.data


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    from app.config import get_settings
    settings = get_settings()

    result = (
        db.table("sessions")
        .insert({
            "user_id": user_id,
            "title": body.title,
            "model_id": body.model_id or settings.default_model,
            "last_active_at": "now()",
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create session")
    return result.data[0]


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
    return result.data


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
