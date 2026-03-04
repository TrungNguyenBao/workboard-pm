---
title: "Phase 5 — Polish & Production Readiness"
description: "Docker production builds, nginx proxy, config validation, rate limiting, structured logging"
status: pending
priority: P1
effort: 6h
branch: main
tags: [devops, production, docker, nginx, logging, security]
created: 2026-02-27
---

# Phase 5 — Polish & Production Readiness

## Current State

- Dev-only Dockerfiles (backend runs uvicorn with reload, frontend runs vite dev server)
- `slowapi` imported in `main.py` with limiter instance, but zero `@limiter.limit()` decorators applied
- `structlog` in `pyproject.toml` but not configured or used
- `config.py` has default values for everything including `SECRET_KEY` -- no prod validation
- No nginx config, no `frontend/.dockerignore`, no `docker-compose.prod.yml`

## Phases

| # | Phase | Status | Effort | Dependencies |
|---|-------|--------|--------|--------------|
| 1 | [Docker production builds](phase-01-docker-production-builds.md) | pending | 1.5h | none |
| 2 | [Nginx reverse proxy](phase-02-nginx-reverse-proxy.md) | pending | 1h | Phase 1 |
| 3 | [Config validation on startup](phase-03-config-validation.md) | pending | 0.5h | none |
| 4 | [Rate limiting per-route](phase-04-rate-limiting.md) | pending | 1h | none |
| 5 | [Structured JSON logging](phase-05-structured-logging.md) | pending | 1.5h | none |

## Dependency Graph

```
Phase 1 (Docker) ──> Phase 2 (Nginx)
Phase 3 (Config)  \
Phase 4 (Rate)     ├── independent, can run in parallel
Phase 5 (Logging) /
```

## Out of Scope

- E2E tests (Playwright)
- MinIO / S3 file storage
- Email delivery
- CI/CD pipeline (GitHub Actions)
- Kubernetes / orchestration

## Key Decisions

- **Separate compose files**: `docker-compose.yml` (dev) + `docker-compose.prod.yml` (prod)
- **Nginx as separate service** in prod compose, not baked into frontend image
- **Multi-stage Dockerfiles** named `Dockerfile.prod` alongside existing dev `Dockerfile`
- **structlog** configured once in `core/logging.py`, imported via standard `structlog.get_logger()`
