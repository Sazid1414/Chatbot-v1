import json

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sse_starlette.sse import EventSourceResponse

from app.dependencies import get_current_user
from app.db.supabase import get_supabase
from app.models.schemas import ChatRequest
from app.services.context_builder import build_context
from app.services.model_router import resolve_model
from app.services.ollama_client import stream_chat
from app.services.history_writer import (
    save_message,
    update_session_activity,
    auto_title_session,
)
from app.services.token_utils import count_tokens

router = APIRouter(tags=["chat"])


def _http_error(code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
    raise HTTPException(
        status_code=status_code,
        detail={"error": code, "message": message},
    )


@router.post("/api/chat")
async def chat(
    body: ChatRequest,
    user_id: str = Depends(get_current_user),
):
    db = get_supabase()

    session = (
        db.table("sessions")
        .select("*")
        .eq("id", body.session_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not session.data:
        _http_error("session_not_found", "Session not found or access denied", 404)

    row = session.data
    chat_mode = row.get("chat_mode") or "base"
    knowledge_base_id = row.get("knowledge_base_id")

    user_tokens = count_tokens(body.message)
    await save_message(
        body.session_id,
        "user",
        body.message,
        token_count=user_tokens,
    )
    await auto_title_session(body.session_id, body.message)

    messages = await build_context(
        body.session_id,
        chat_mode=chat_mode,
        knowledge_base_id=knowledge_base_id,
        latest_user_message=body.message,
    )
    model = resolve_model(row.get("model_id"), chat_mode)

    async def event_generator():
        full_response = ""
        completion_tokens: int | None = None
        try:
            async for chunk in stream_chat(model, messages):
                data = json.loads(chunk)
                if data.get("done"):
                    full_response = data.get("full_response") or ""
                    ct = data.get("completion_token_count")
                    if isinstance(ct, int):
                        completion_tokens = ct
                    yield {"data": json.dumps({"done": True})}
                elif data.get("token") is not None:
                    yield {"data": json.dumps({"token": data.get("token", "")})}
        except httpx.HTTPStatusError as e:
            yield {
                "data": json.dumps(
                    {
                        "error": f"Ollama HTTP {e.response.status_code}",
                    }
                )
            }
        except httpx.RequestError as e:
            yield {
                "data": json.dumps(
                    {
                        "error": f"Cannot reach Ollama: {e!s}",
                    }
                )
            }
        except Exception as e:
            yield {
                "data": json.dumps(
                    {"error": str(e) or "Stream failed"}
                )
            }
        finally:
            if full_response:
                assistant_tokens = completion_tokens
                if assistant_tokens is None:
                    assistant_tokens = count_tokens(full_response)
                await save_message(
                    body.session_id,
                    "assistant",
                    full_response,
                    token_count=assistant_tokens,
                )
                await update_session_activity(body.session_id)

    return EventSourceResponse(event_generator())
