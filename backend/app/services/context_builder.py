from app.config import get_settings
from app.db.supabase import get_supabase


async def build_context(session_id: str) -> list[dict]:
    settings = get_settings()
    db = get_supabase()

    result = (
        db.table("messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .limit(settings.context_window_messages)
        .execute()
    )

    messages = [
        {"role": "system", "content": settings.system_prompt},
    ]

    for msg in result.data:
        messages.append({"role": msg["role"], "content": msg["content"]})

    return messages
