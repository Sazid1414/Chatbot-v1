import json

import httpx

from app.config import get_settings
from app.services.model_router import get_embedding_model


async def embed_text(text: str) -> list[float]:
    settings = get_settings()
    model = get_embedding_model()
    url = f"{settings.ollama_base_url}/api/embeddings"
    payload = {"model": model, "prompt": text}

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        emb = data.get("embedding")
        if not isinstance(emb, list):
            raise ValueError("Ollama embeddings response missing embedding array")
        return [float(x) for x in emb]
