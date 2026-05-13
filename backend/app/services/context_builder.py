from app.config import get_settings
from app.db.supabase import get_supabase
from app.services.rag_retrieval import format_rag_system_addon, retrieve_chunks
from app.services.token_utils import count_message_tokens, count_tokens


async def build_context(
    session_id: str,
    *,
    chat_mode: str | None = None,
    knowledge_base_id: str | None = None,
    latest_user_message: str | None = None,
) -> list[dict]:
    settings = get_settings()
    db = get_supabase()
    mode = (chat_mode or "base").lower()

    result = (
        db.table("messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .limit(settings.max_messages_fetch)
        .execute()
    )

    rows = result.data or []
    system_base = settings.system_prompt

    rag_addon = ""
    if (
        mode == "rag"
        and knowledge_base_id
        and latest_user_message
        and latest_user_message.strip()
    ):
        chunks = await retrieve_chunks(knowledge_base_id, latest_user_message)
        rag_addon = format_rag_system_addon(chunks)

    system_content = system_base + rag_addon
    system_tokens = count_tokens(system_content) + 4

    max_budget = max(512, settings.max_context_tokens - system_tokens)
    selected: list[dict] = []
    running = 0

    for msg in reversed(rows):
        role = msg.get("role") or "user"
        content = msg.get("content") or ""
        cost = count_message_tokens(role, content)
        if running + cost > max_budget:
            break
        selected.append({"role": role, "content": content})
        running += cost

    selected.reverse()

    return [
        {"role": "system", "content": system_content},
        *selected,
    ]
