from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
  if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

  if url.startswith("postgresql://") and "+psycopg2" not in url and "+psycopg" not in url:
    url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

  return url


class Settings(BaseSettings):
  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

  APP_NAME: str
  APP_VERSION: str
  DEBUG: bool
  DATABASE_URL: str
  SECRET_KEY: str
  ACCESS_TOKEN_EXPIRE_DAYS: int = 3
  CORS_ORIGINS: str
  PORT: int

  @computed_field
  @property
  def cors_origins(self) -> list[str]:
    origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    if self.DEBUG:
      for origin in (
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ):
        if origin not in origins:
          origins.append(origin)
    return origins

  @computed_field
  @property
  def database_url(self) -> str:
    if self.DATABASE_URL.startswith("sqlite"):
      return self.DATABASE_URL
    return normalize_database_url(self.DATABASE_URL)


settings = Settings()
