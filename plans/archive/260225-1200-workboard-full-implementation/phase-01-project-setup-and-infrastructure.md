# Phase 01 — Project Setup & Infrastructure

## Overview
- **Priority:** Critical (blocks everything)
- **Status:** Pending
- **Description:** Init monorepo, Docker, backend skeleton, frontend skeleton, Makefile, env config

## Requirements
- Monorepo: `workboard-pm/frontend/` + `workboard-pm/backend/`
- Docker Compose: PostgreSQL 15 + Redis 7
- Backend: FastAPI app factory with health endpoint, pydantic-settings config
- Frontend: Vite + React + TypeScript + shadcn/ui + Tailwind + DM Sans
- Makefile for dev commands
- `.env.example`, `.gitignore`, `CLAUDE.md`

## Related Code Files

### Create
```
workboard-pm/
  docker-compose.yml
  Makefile
  .env.example
  .gitignore
  CLAUDE.md
  backend/
    pyproject.toml
    .python-version
    app/
      __init__.py
      main.py
      core/
        config.py
        database.py
      api/
        __init__.py
        v1/
          __init__.py
          router.py
          routers/
            health.py
  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    tailwind.config.ts
    postcss.config.js
    index.html
    src/
      main.tsx
      App.tsx
      index.css
      vite-env.d.ts
```

## Implementation Steps

### 1. Create root files

**docker-compose.yml:**
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: workboard
      POSTGRES_USER: workboard
      POSTGRES_PASSWORD: workboard
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U workboard"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Makefile:**
```makefile
.PHONY: dev dev-backend dev-frontend migrate seed test lint

dev:
	docker-compose up -d && make dev-backend & make dev-frontend

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m app.scripts.seed

test:
	cd backend && uv run pytest && cd ../frontend && npm run test:run

lint:
	cd backend && uv run ruff check app/ && cd ../frontend && npm run lint
```

**.env.example:**
```
DATABASE_URL=postgresql+asyncpg://workboard:workboard@localhost:5432/workboard
REDIS_URL=redis://localhost:6379
SECRET_KEY=change-me-in-production-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
ALGORITHM=HS256
CORS_ORIGINS=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
FRONTEND_URL=http://localhost:5173
```

### 2. Backend setup

```bash
cd workboard-pm
uv init backend
cd backend
uv add "fastapi[standard]" "sqlalchemy[asyncio]" asyncpg alembic \
  "pydantic-settings" PyJWT "passlib[bcrypt]" slowapi \
  redis structlog python-multipart
uv add --dev pytest pytest-asyncio httpx ruff
echo "3.12" > .python-version
```

**app/core/config.py:**
```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    FRONTEND_URL: str = "http://localhost:5173"

settings = Settings()
```

**app/core/database.py:**
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, pool_size=20, max_overflow=10, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

**app/main.py:**
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.router import api_router
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(title="WorkBoard API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
```

**app/api/v1/routers/health.py:**
```python
from fastapi import APIRouter
router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "service": "workboard-api"}
```

**app/api/v1/router.py:**
```python
from fastapi import APIRouter
from app.api.v1.routers import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
```

### 3. Frontend setup

```bash
cd workboard-pm
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand react-router-dom axios
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention
npm install cmdk date-fns react-hook-form zod @hookform/resolvers
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
npx shadcn-ui@latest init
# Add components: button, input, badge, card, avatar, dropdown-menu, dialog, sheet, toast, tooltip, popover, select, checkbox, separator, tabs, calendar, command
```

**tailwind.config.ts:** Include DM Sans + design tokens from design-guidelines.md.

**index.html:** Add DM Sans Google Fonts link:
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet">
```

### 4. Alembic init
```bash
cd backend
uv run alembic init -t async alembic
# Edit alembic.ini: sqlalchemy.url = (use env var in env.py)
# Edit alembic/env.py: import Base from app.core.database, set target_metadata
```

## Todo
- [ ] Create docker-compose.yml
- [ ] Create Makefile
- [ ] Create .env.example + .gitignore
- [ ] `uv init backend` + install all deps
- [ ] Create config.py, database.py, main.py, health router
- [ ] `npm create vite` frontend + install all deps
- [ ] `npx shadcn-ui init` + add components
- [ ] Configure Tailwind with DM Sans + design tokens
- [ ] `alembic init` + configure env.py
- [ ] Run `make dev` to verify both servers start
- [ ] Run `GET /api/v1/health` → 200

## Success Criteria
- `make dev` starts backend (port 8000) + frontend (port 5173) without errors
- `GET http://localhost:8000/api/v1/health` returns `{"status": "ok"}`
- `GET http://localhost:5173` renders Vite React app
- `docker-compose up -d` starts PG + Redis without errors
- Alembic `upgrade head` runs without errors (no models yet, just init)

## Risk Assessment
- **shadcn/ui init** may need manual config for Vite — follow official docs exactly
- **asyncpg** on Windows may need `pip install asyncpg --no-binary asyncpg` if wheels fail

## Security Considerations
- SECRET_KEY must be ≥32 random chars in production
- UPLOAD_DIR must not be publicly writable by web process
- CORS_ORIGINS strictly set per env

## Next Steps
→ Phase 02: database schema and models
