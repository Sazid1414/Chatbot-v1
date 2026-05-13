from app.config import get_settings


def _ollama_model_ref(name: str) -> str:
    """Ollama's API expects a tag (e.g. llama3:latest); bare names often 404 if not an exact tag."""
    n = name.strip()
    if not n or ":" in n:
        return n
    return f"{n}:latest"


def resolve_model(model_id: str | None) -> str:
    settings = get_settings()
    if not model_id:
        return _ollama_model_ref(settings.default_model)

    available_models = {
        "llama3": "llama3",
        "llama3.2": "llama3.2",
        "mistral": "mistral",
        "gemma2": "gemma2",
        "phi3": "phi3",
    }

    raw = available_models.get(model_id, settings.default_model)
    return _ollama_model_ref(raw)
