# Phase 1 — Docker Multi-Stage Production Builds

## Overview
- **Priority:** P1 (blocking Phase 2)
- **Status:** pending
- **Effort:** 1.5h

Create production-optimized Dockerfiles for backend and frontend. Backend runs uvicorn without reload. Frontend builds static assets via `vite build` (no dev server).

## Key Insights
- Existing `Dockerfile` files are dev-only -- keep them, create `Dockerfile.prod` alongside
- Backend already uses `uv sync --no-dev` in dev Dockerfile -- good pattern to keep
- Frontend build command: `tsc -b && vite build` (from `package.json`)
- Frontend output dir defaults to `dist/` -- will be served by nginx (Phase 2)
- No `frontend/.dockerignore` exists -- must create one

## Files to Create
- `backend/Dockerfile.prod` — multi-stage: build deps, then slim runtime
- `frontend/Dockerfile.prod` — multi-stage: install+build, then nginx serves `dist/`
- `frontend/.dockerignore` — exclude node_modules, dist, .git
- `docker-compose.prod.yml` — production compose with all services

## Files to Modify
- `Makefile` — add `docker-prod-up`, `docker-prod-down`, `docker-prod-build` targets

## Implementation Steps

### 1. Create `backend/Dockerfile.prod`
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --no-install-project

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
- Stage 1 (builder): install deps with uv into `.venv`
- Stage 2 (runtime): copy only `.venv` + app code, no uv/pip in final image
- 4 uvicorn workers for production (configurable via `WEB_CONCURRENCY` env)

### 2. Create `frontend/Dockerfile.prod`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# nginx config injected via docker-compose volume or Phase 2
EXPOSE 80
```
- Stage 1: install deps + build static assets
- Stage 2: copy `dist/` into nginx default html dir (~25MB final image)

### 3. Create `frontend/.dockerignore`
```
node_modules
dist
.git
*.md
```

### 4. Create `docker-compose.prod.yml`
- Backend: build from `Dockerfile.prod`, no volumes, no `--reload`
- Frontend: not a service (static files served by nginx in Phase 2)
- Postgres + Redis: same as dev but without exposed ports (only internal network)
- Add `restart: unless-stopped` to all services

### 5. Add Makefile targets
```makefile
docker-prod-build:
	docker-compose -f docker-compose.prod.yml build

docker-prod-up:
	docker-compose -f docker-compose.prod.yml up -d

docker-prod-down:
	docker-compose -f docker-compose.prod.yml down
```

## Success Criteria
- [ ] `docker-compose -f docker-compose.prod.yml build` succeeds
- [ ] Backend image < 200MB, frontend/nginx image < 30MB
- [ ] Backend starts with 4 workers, no reload flag
- [ ] Frontend `dist/` contains built assets
- [ ] Existing dev Dockerfiles and `docker-compose.yml` unchanged
