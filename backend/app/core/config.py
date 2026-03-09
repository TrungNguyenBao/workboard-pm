from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET_KEY = "dev-secret-key-change-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://workboard:workboard@localhost:5432/workboard"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str = DEV_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Environment
    ENVIRONMENT: str = "development"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Rate limiting (set False in tests to disable)
    RATE_LIMIT_ENABLED: bool = True

    # SMTP (optional — email sending silently skipped if SMTP_HOST is empty)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@a-erp.local"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @model_validator(mode="after")
    def validate_production_settings(self) -> Self:
        """Fail fast with clear errors when production config is insecure or incomplete."""
        if self.ENVIRONMENT == "production":
            errors: list[str] = []
            if self.SECRET_KEY == DEV_SECRET_KEY:
                errors.append("SECRET_KEY must be changed from the default in production")
            if len(self.SECRET_KEY) < 32:
                errors.append("SECRET_KEY must be at least 32 characters")
            if "localhost" in self.DATABASE_URL:
                errors.append("DATABASE_URL should not use localhost in production")
            if errors:
                raise ValueError(
                    "Production configuration errors:\n" + "\n".join(f"  - {e}" for e in errors)
                )
        return self


settings = Settings()
