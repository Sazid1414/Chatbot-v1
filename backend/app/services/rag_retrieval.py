from app.config import get_settings
from app.db.supabase import get_supabase
from app.services.embeddings import embed_text


async def retrieve_chunks(
    knowledge_base_id: str,
    query: str,
) -> list[str]:
    settings = get_settings()
    db = get_supabase()
    try:
        vector = await embed_text(query)
    except Exception:
        return []

    try:
        result = db.rpc(
            "match_chunks",
            {
                "query_embedding": vector,
                "match_count": settings.rag_top_k,
                "filter_kb_id": knowledge_base_id,
            },
        ).execute()
    except Exception:
        return []

    rows = result.data or []
    texts: list[str] = []
    for row in rows:
        if isinstance(row, dict):
            sim = row.get("similarity")
            content = row.get("content")
            if not isinstance(content, str):
                continue
            if isinstance(sim, (int, float)) and sim < settings.rag_min_similarity:
                continue
            texts.append(content)
        elif isinstance(row, (list, tuple)) and len(row) >= 2:
            content = row[1]
            if isinstance(content, str):
                texts.append(content)
    return texts


def format_rag_system_addon(chunks: list[str]) -> str:
    if not chunks:
        return ""
    body = "\n---\n".join(chunks)
    return f"\n\nRelevant knowledge base excerpts:\n{body}"
