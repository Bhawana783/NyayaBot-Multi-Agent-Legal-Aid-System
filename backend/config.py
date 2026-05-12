"""
Configuration management using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API Configuration
    backend_port: int = 8000
    frontend_port: int = 5173
    environment: str = "development"

    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    embedding_model: str = "text-embedding-3-small"
    # Local mock mode (bypass OpenAI billing) for testing without API
    mock_mode: bool = False

    # Qdrant Configuration
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "legal_docs"

    # n8n Configuration (optional)
    n8n_webhook_url: Optional[str] = None

    # CORS Configuration
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
