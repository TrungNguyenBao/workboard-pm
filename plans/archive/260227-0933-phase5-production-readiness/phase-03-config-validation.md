# Phase 3 — Environment Config Validation on Startup

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 0.5h

Fail fast with clear errors when required env vars are missing or insecure in production. Currently `config.py` has defaults for everything including `SECRET_KEY = "dev-secret-key-change-in-production"` -- dangerous in prod.

## Key Insights
- `Settings` already uses Pydantic `BaseSettings` -- leverage `@model_validator` for cross-field checks
- `ENVIRONMENT` field controls dev/prod behavior (docs_url, cookie secure flag)
- `main.py` lifespan is the right place to log validated config summary (without secrets)
- Keep dev experience frictionless -- validation only strict when `ENVIRONMENT != "development"`

## Files to Modify
- `backend/app/core/config.py` — add `@model_validator(mode="after")` for production checks
- `backend/app/main.py` — log config summary on startup in lifespan

## Implementation Steps

### 1. Add production validator to `Settings` class
```python
from pydantic import model_validator

@model_validator(mode="after")
def validate_production_settings(self) -> "Settings":
    if self.ENVIRONMENT == "production":
        errors = []
        if self.SECRET_KEY == "dev-secret-key-change-in-production":
            errors.append("SECRET_KEY must be changed from default in production")
        if "localhost" in self.DATABASE_URL:
            errors.append("DATABASE_URL should not use localhost in production")
        if len(self.SECRET_KEY) < 32:
            errors.append("SECRET_KEY must be at least 32 characters")
        if errors:
            raise ValueError(
                "Production configuration errors:\n" + "\n".join(f"  - {e}" for e in errors)
            )
    return self
```

### 2. Add optional strict env vars
Add fields with `None` default that are required in production:
- No new fields needed now -- existing defaults suffice for dev
- Validator pattern above catches the dangerous defaults

### 3. Log config summary in lifespan
In `main.py` lifespan, after validation passes:
```python
import logging
logger = logging.getLogger(__name__)

# Inside lifespan, before yield:
logger.info(
    "WorkBoard starting",
    extra={
        "environment": settings.ENVIRONMENT,
        "database": settings.DATABASE_URL.split("@")[-1],  # host only, no creds
        "redis": settings.REDIS_URL,
        "cors_origins": settings.CORS_ORIGINS,
    },
)
```
(This will be replaced by structlog in Phase 5, but works standalone.)

## Success Criteria
- [ ] `ENVIRONMENT=production SECRET_KEY=dev-secret-key-change-in-production` causes immediate crash with clear message
- [ ] `ENVIRONMENT=development` with defaults starts normally (no breakage)
- [ ] Config summary logged on startup (no secrets in output)
- [ ] Short `SECRET_KEY` in production rejected

## Risk Assessment
- **Risk:** Breaking dev experience if validation too strict — mitigated by only validating when `ENVIRONMENT=production`
- **Risk:** New required fields breaking existing deploys — mitigated by only checking default sentinel values, not requiring new env vars
