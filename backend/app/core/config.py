from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    database_url: str
    mealdb_base_url: str
    mealdb_api_key: str
    cache_ttl_seconds: int = 3600
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
