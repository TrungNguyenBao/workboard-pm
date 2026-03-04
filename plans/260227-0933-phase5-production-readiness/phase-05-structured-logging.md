# Phase 5 — Structured JSON Logging with structlog

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 1.5h

Replace default uvicorn/print logging with structlog for structured JSON output. structlog is already a dependency but not configured.

## Key Insights
- `structlog>=24.0.0` in `pyproject.toml` -- no install needed
- Currently using default uvicorn logging (unstructured text)
- structlog should render JSON in production, colored console in development
- Must integrate with Python stdlib logging (uvicorn, SQLAlchemy use stdlib)
- Keep it simple: one config module, use `structlog.get_logger()` everywhere

## Files to Create
- `backend/app/core/logging_config.py` — structlog + stdlib configuration

## Files to Modify
- `backend/app/main.py` — call `setup_logging()` in lifespan, add request logging middleware
- `backend/app/core/config.py` — add `LOG_LEVEL` setting (default: `"INFO"`)

## Implementation Steps

### 1. Create `backend/app/core/logging_config.py`
```python
import logging
import structlog
from app.core.config import settings

def setup_logging() -> None:
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.ENVIRONMENT == "production":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(settings.LOG_LEVEL)

    # Quiet noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

### 2. Add `LOG_LEVEL` to config
```python
LOG_LEVEL: str = "INFO"
```

### 3. Wire up in `main.py` lifespan
```python
from app.core.logging_config import setup_logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # ... existing startup code
    yield
```

### 4. Add request logging middleware
Create simple middleware in `main.py` or separate file:
```python
import time
import structlog

logger = structlog.get_logger()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=elapsed,
    )
    return response
```

### 5. Replace any `print()` statements in codebase
Search for `print(` in `backend/app/` and replace with `structlog.get_logger()` calls.

## Success Criteria
- [ ] `ENVIRONMENT=production` outputs JSON lines to stdout
- [ ] `ENVIRONMENT=development` outputs colored human-readable logs
- [ ] Request method, path, status, duration logged for every HTTP request
- [ ] No `print()` statements remain in `backend/app/`
- [ ] Uvicorn access logs suppressed (replaced by middleware)
- [ ] `LOG_LEVEL` env var controls verbosity
- [ ] SQLAlchemy engine logs quiet unless `LOG_LEVEL=DEBUG`
