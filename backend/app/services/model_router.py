from functools import lru_cache
from pathlib import Path

import yaml

from app.config import get_settings


@lru_cache
def _registry_path() -> Path:
    return Path(__file__).resolve().parent.parent / "model_registry.yaml"


@lru_cache
def _load_registry() -> dict:
    path = _registry_path()
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def resolve_model(model_id: str | None, chat_mode: str | None = None) -> str:
    settings = get_settings()
    mode = (chat_mode or "base").lower()
    reg = _load_registry()

    if mode == "finetuned" and model_id:
        ft = reg.get("finetuned_models") or {}
        if isinstance(ft, dict) and model_id in ft:
            return str(ft[model_id])

    chat = reg.get("chat_models") or {}
    if isinstance(chat, dict) and model_id and model_id in chat:
        return str(chat[model_id])

    if not model_id:
        return settings.default_model

    legacy = {
        "llama3": "llama3",
        "llama3.2": "llama3.2",
        "mistral": "mistral",
        "gemma2": "gemma2",
        "phi3": "phi3",
    }
    return legacy.get(model_id, settings.default_model)


def get_embedding_model() -> str:
    reg = _load_registry()
    return str(reg.get("embedding_model") or get_settings().embedding_model)


def get_embedding_dimensions() -> int:
    reg = _load_registry()
    dim = reg.get("embedding_dimensions")
    if isinstance(dim, int) and dim > 0:
        return dim
    return get_settings().embedding_dimensions


def list_registry() -> dict:
    reg = _load_registry()
    settings = get_settings()
    return {
        "chat_models": list((reg.get("chat_models") or {}).keys())
        or ["llama3", "llama3.2", "mistral", "gemma2", "phi3"],
        "finetuned_models": list((reg.get("finetuned_models") or {}).keys()),
        "embedding_model": get_embedding_model(),
        "chat_modes": ["base", "rag", "finetuned"],
        "default_model": settings.default_model,
    }
