# Phase 4 — Rate Limiting Per-Route via slowapi

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 1h

Apply rate limits to auth endpoints (brute-force protection) and general API routes. slowapi is already installed and initialized in `main.py` -- just needs decorators on routes.

## Key Insights
- `main.py` already has: `limiter = Limiter(key_func=get_remote_address)`, `app.state.limiter = limiter`, and `RateLimitExceeded` handler
- Zero `@limiter.limit()` decorators exist on any route
- slowapi uses Redis backend when configured, in-memory by default
- Auth endpoints need strictest limits (login, register, refresh)
- SSE endpoint should NOT be rate-limited (long-lived connection)
- Behind nginx, must use `X-Forwarded-For` for real client IP

## Rate Limit Strategy

| Endpoint Group | Limit | Rationale |
|---------------|-------|-----------|
| `POST /auth/login` | 5/minute | Brute-force protection |
| `POST /auth/register` | 3/minute | Abuse prevention |
| `POST /auth/refresh` | 10/minute | Legitimate tab reloads |
| General API routes | 60/minute | Fair use |
| `GET /health` | No limit | Monitoring probes |
| `GET /sse` | No limit | Long-lived connections |

## Files to Modify
- `backend/app/main.py` — configure limiter with Redis storage backend
- `backend/app/api/v1/routers/auth.py` — add `@limiter.limit()` to each endpoint
- `backend/app/core/config.py` — add `RATE_LIMIT_DEFAULT` setting

## Files to Create
- `backend/app/dependencies/rate_limit.py` — shared limiter instance + helpers

## Implementation Steps

### 1. Extract limiter to `dependencies/rate_limit.py`
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    storage_uri=None,  # set from config at startup
)
```

### 2. Update `main.py`
- Import limiter from `dependencies/rate_limit` instead of creating inline
- Configure `limiter.storage_uri` from `settings.REDIS_URL` in lifespan
- Keep existing exception handler

### 3. Add decorators to auth routes
```python
from app.dependencies.rate_limit import limiter

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):  # must add Request param
    ...

@router.post("/register")
@limiter.limit("3/minute")
async def register(request: Request, ...):
    ...

@router.post("/refresh")
@limiter.limit("10/minute")
async def refresh(request: Request, ...):
    ...
```
**Important:** slowapi requires `request: Request` as first positional parameter.

### 4. Configure trusted proxy for nginx
When behind nginx, `get_remote_address` sees nginx IP. Options:
- Use `X-Forwarded-For` header: set `key_func` to extract from header
- Create custom key function:
```python
def get_real_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host or "unknown"
```

### 5. Add config field
```python
RATE_LIMIT_ENABLED: bool = True
```
Allows disabling in tests.

## Success Criteria
- [ ] `POST /auth/login` returns 429 after 5 rapid requests
- [ ] 429 response includes `Retry-After` header
- [ ] General API routes limited to 60/min
- [ ] Health and SSE endpoints not rate-limited
- [ ] Rate limiting uses Redis in production (persistence across restarts)
- [ ] Works correctly behind nginx (uses `X-Forwarded-For`)
