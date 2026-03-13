import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

import arq
import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.dependencies.rate_limit import limiter
from app.worker.tasks import WorkerSettings

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(
        "WorkBoard starting",
        environment=settings.ENVIRONMENT,
        database_host=settings.DATABASE_URL.split("@")[-1],  # host only, no credentials
        redis=settings.REDIS_URL,
        cors_origins=settings.CORS_ORIGINS,
        log_level=settings.LOG_LEVEL,
        rate_limiting=settings.RATE_LIMIT_ENABLED,
    )
    # Create ARQ pool for background job enqueueing from API handlers
    arq_pool = await arq.create_pool(WorkerSettings.from_config().redis_settings)
    app.state.arq_pool = arq_pool
    yield
    await arq_pool.close()


app = FastAPI(
    title="WorkBoard API",
    description="Project management API — Asana clone",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.is_development else None,
    redoc_url="/api/redoc" if settings.is_development else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log method, path, status code, and duration for every HTTP request."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
    )
    return response


app.include_router(api_router, prefix="/api/v1")

# Serve uploaded files
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Serve user guide HTML files

_docs_dir = Path(__file__).resolve().parents[2] / "docs"
if _docs_dir.exists():
    app.mount("/guides-static", StaticFiles(directory=str(_docs_dir), html=True), name="guides")
