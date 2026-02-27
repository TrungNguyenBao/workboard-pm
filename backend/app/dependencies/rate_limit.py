from fastapi import Request
from slowapi import Limiter

from app.core.config import settings


def get_real_ip(request: Request) -> str:
    """Extract real client IP from X-Forwarded-For when behind nginx proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# Global limiter instance — imported by main.py and route modules
limiter = Limiter(
    key_func=get_real_ip,
    default_limits=["60/minute"],
    enabled=settings.RATE_LIMIT_ENABLED,
    storage_uri=settings.REDIS_URL,
)
