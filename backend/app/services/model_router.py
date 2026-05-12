from app.config import get_settings


def resolve_model(model_id: str | None) -> str:
    settings = get_settings()
    if not model_id:
        return settings.default_model

    available_models = {
        "llama3": "llama3",
        "llama3.2": "llama3.2",
        "mistral": "mistral",
        "gemma2": "gemma2",
        "phi3": "phi3",
    }

    return available_models.get(model_id, settings.default_model)
