from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.db.supabase import get_supabase
from app.models.schemas import (
    IngestRequest,
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
)
from app.services.embeddings import embed_text
from app.services.text_chunker import chunk_text

router = APIRouter(prefix="/api/knowledge-bases", tags=["knowledge"])


@router.get("", response_model=list[KnowledgeBaseResponse])
async def list_knowledge_bases(user_id: str = Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("knowledge_bases")
        .select("id, user_id, name, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("", response_model=KnowledgeBaseResponse, status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(
    body: KnowledgeBaseCreate,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    try:
        result = (
            db.table("knowledge_bases")
            .insert({"user_id": user_id, "name": body.name})
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "database_error",
                "message": str(e),
                "hint": "Run backend/sql/phase6_rag.sql on your Supabase project.",
            },
        ) from e
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create knowledge base")
    return result.data[0]


@router.post("/{kb_id}/ingest", status_code=status.HTTP_204_NO_CONTENT)
async def ingest_text(
    kb_id: str,
    body: IngestRequest,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    kb = (
        db.table("knowledge_bases")
        .select("id")
        .eq("id", kb_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not kb.data:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    pieces = chunk_text(body.text)
    if not pieces:
        raise HTTPException(status_code=400, detail="No ingestable text after chunking")

    for piece in pieces:
        try:
            vector = await embed_text(piece)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "embedding_failed",
                    "message": str(e),
                    "hint": "Ensure Ollama is running and `ollama pull nomic-embed-text` (or your embedding model).",
                },
            ) from e
        try:
            db.table("chunks").insert(
                {
                    "knowledge_base_id": kb_id,
                    "content": piece,
                    "embedding": vector,
                }
            ).execute()
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "chunk_insert_failed",
                    "message": str(e),
                    "hint": "Run backend/sql/phase6_rag.sql and match embedding dimensions to your model.",
                },
            ) from e
    return None


@router.delete("/{kb_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_knowledge_base(
    kb_id: str,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()
    db.table("knowledge_bases").delete().eq("id", kb_id).eq("user_id", user_id).execute()
    return None
