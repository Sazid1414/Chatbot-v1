import json
from collections.abc import AsyncGenerator

import httpx

from app.config import get_settings


async def stream_chat(
    model: str, messages: list[dict]
) -> AsyncGenerator[str, None]:
    settings = get_settings()
    url = f"{settings.ollama_base_url}/api/chat"

    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
    }

    full_response = ""

    async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
        async with client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    if "message" in data and "content" in data["message"]:
                        token = data["message"]["content"]
                        full_response += token
                        yield json.dumps({"token": token})

                    if data.get("done", False):
                        yield json.dumps({
                            "done": True,
                            "full_response": full_response,
                        })
                except json.JSONDecodeError:
                    continue
