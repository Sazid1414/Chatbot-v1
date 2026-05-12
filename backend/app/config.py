from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""
    ollama_base_url: str = "http://localhost:11434"
    default_model: str = "llama3"
    system_prompt: str = "You are a helpful assistant."
    cors_origins: str = "http://localhost:3000"
    context_window_messages: int = 20

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
