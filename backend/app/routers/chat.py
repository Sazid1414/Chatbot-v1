import json

from fastapi import APIRouter, Depends, HTTPException
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

router = APIRouter(tags=["chat"])


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
        raise HTTPException(status_code=404, detail="Session not found")

    await save_message(body.session_id, "user", body.message)
    await auto_title_session(body.session_id, body.message)

    messages = await build_context(body.session_id)
    model = resolve_model(session.data.get("model_id"))

    async def event_generator():
        full_response = ""
        try:
            async for chunk in stream_chat(model, messages):
                data = json.loads(chunk)
                if data.get("done"):
                    full_response = data.get("full_response", full_response)
                    yield {
                        "data": json.dumps(
                            {"done": True, "full_response": full_response}
                        )
                    }
                else:
                    token = data.get("token", "")
                    full_response += token
                    yield {"data": json.dumps({"token": token})}
        except Exception as e:
            yield {"data": json.dumps({"error": str(e)})}
        finally:
            if full_response:
                await save_message(
                    body.session_id, "assistant", full_response
                )
                await update_session_activity(body.session_id)

    return EventSourceResponse(event_generator())
