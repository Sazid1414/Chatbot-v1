from datetime import datetime, timezone

from app.db.supabase import get_supabase


async def save_message(
    session_id: str,
    role: str,
    content: str,
    token_count: int | None = None,
) -> dict:
    db = get_supabase()
    result = (
        db.table("messages")
        .insert({
            "session_id": session_id,
            "role": role,
            "content": content,
            "token_count": token_count,
        })
        .execute()
    )
    return result.data[0] if result.data else {}


async def update_session_activity(session_id: str) -> None:
    db = get_supabase()
    db.table("sessions").update(
        {"last_active_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", session_id).execute()


async def auto_title_session(session_id: str, first_message: str) -> None:
    db = get_supabase()
    title = first_message[:50].strip()
    if len(first_message) > 50:
        title += "..."
    db.table("sessions").update(
        {"title": title}
    ).eq("id", session_id).is_("title", "null").execute()
