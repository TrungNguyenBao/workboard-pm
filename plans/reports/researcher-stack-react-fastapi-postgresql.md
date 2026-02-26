# Stack Research: React + FastAPI + PostgreSQL (PM App)
**Researcher report | 2026-02-25**

## 1. FastAPI Project Structure

```
backend/
  app/
    api/v1/routers/       # thin: parse request, call service, return response
      tasks.py, projects.py, users.py, auth.py, ws.py
    services/             # business logic, no HTTP concerns
    models/               # SQLAlchemy ORM models
    schemas/              # Pydantic v2 request/response models
    dependencies/         # FastAPI Depends() — db session, current_user, permissions
    core/
      config.py           # pydantic-settings BaseSettings
      security.py         # JWT helpers
      database.py         # async engine + session factory
    main.py               # app factory, include_router, lifespan
```

Rule: keep routers ≤50 lines; push logic into services. Use `Depends()` for DB session — never pass manually through layers.

## 2. SQLAlchemy 2.0 Async + PostgreSQL

```python
engine = create_async_engine(DATABASE_URL, pool_size=20, max_overflow=10, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
```

PM model patterns:
- `Project → Section → Task` (self-referential subtasks via `parent_id`)
- `Task.position` (float) for drag-drop reordering without renumbering
- Use `mapped_column()` (2.0 style), avoid legacy `Column()`
- `relationship(..., lazy="selectin")` for async — never `lazy="joined"` on async

**Pitfall:** `expire_on_commit=False` required; else DetachedInstanceError post-commit.

## 3. Alembic Migrations

Async `env.py`:
```python
connectable = create_async_engine(settings.DATABASE_URL)
async def run_async_migrations():
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
```

Workflow: `alembic revision --autogenerate -m "add_task_labels"` → review → `alembic upgrade head`. Note: `--autogenerate` misses CHECK constraints and partial indexes — always review output.

## 4. JWT Auth

- Access token: 15–30 min, stored in JS memory (NOT localStorage)
- Refresh token: 7–30 days, `HttpOnly; Secure; SameSite=Strict` cookie
- `OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")` for Swagger UI compat
- Refresh rotation: new refresh token on each use, invalidate old (store in Redis)
- Lib: `PyJWT` (over `python-jose` — simpler, actively maintained)

## 5. Real-Time: SSE Recommended

| | WebSockets | SSE |
|---|---|---|
| Direction | Bidirectional | Server→Client only |
| Reconnect | Manual | Automatic |
| Proxy support | Needs upgrade headers | Works over HTTP/2 |

**Decision: SSE** for notifications + task updates. WS only if collaborative editing needed. Backend message bus: PostgreSQL `LISTEN/NOTIFY` (zero infra) or Redis Pub/Sub (if Redis already in stack).

## 6. React + TypeScript Structure (Vite, Feature-Based)

```
frontend/src/
  features/
    tasks/
      components/     TaskCard.tsx, TaskModal.tsx, TaskRow.tsx
      hooks/          useTasks.ts, useTaskMutation.ts
      api/            tasks.api.ts
      types/          task.types.ts
    projects/, auth/, notifications/, search/
  shared/
    components/       Button, Modal, Avatar (shadcn wrappers)
    lib/              queryClient.ts, axiosInstance.ts
  stores/             authStore.ts, workspaceStore.ts (Zustand)
  app/                App.tsx, router.tsx
```

## 7. TanStack Query v5

Breaking changes from v4: positional args removed, `cacheTime` → `gcTime`, `onSuccess/onError` removed from `useQuery`.

```typescript
const createTask = useMutation({
  mutationFn: taskApi.create,
  onSuccess: (newTask) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', newTask.project_id] });
  }
});
```

Real-time: update cache from SSE via `queryClient.setQueryData`. Use `placeholderData: keepPreviousData` for pagination. `staleTime: 30_000` for task lists.

## 8. State Management

- **Zustand** for global state (auth, active workspace, UI preferences)
- **Context** only for scoped local UI state (e.g. board drag state)
- Do NOT store access token in Zustand persist — memory store only

## 9. UI Library: shadcn/ui (Recommended)

| | shadcn/ui | Mantine v7 | Chakra UI v3 |
|---|---|---|---|
| Bundle overhead | None (copy-paste) | ~50kb | ~40kb |
| Customization | Full ownership | CSS vars | CSS vars |
| Asana-like fit | ★★★★★ | ★★★★☆ | ★★★☆☆ |

**shadcn/ui + Tailwind CSS.** Radix UI primitives for a11y. Pair with:
- `@dnd-kit/core` — drag-drop boards
- `cmdk` — command palette
- `@tiptap/react` — rich text descriptions
- `@tanstack/react-table` — list view

## 10. Python Package Manager: uv

```bash
uv init backend && cd backend
uv add fastapi[standard] sqlalchemy[asyncio] asyncpg alembic pydantic-settings PyJWT passlib[bcrypt]
uv add --dev pytest pytest-asyncio httpx
```

10-100x faster than pip/poetry. Commit `uv.lock`.

## 11. Security (FastAPI)

```python
app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS,
  allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# slowapi for rate limiting
limiter = Limiter(key_func=get_remote_address)
@limiter.limit("5/minute")
async def login(request: Request, ...): ...
```

Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `HSTS` via nginx or custom Starlette middleware. Use `TrustedHostMiddleware` (built-in Starlette).

## 12. Monorepo Structure

```
workboard-pm/
  backend/          # FastAPI, uv-managed
    pyproject.toml
    app/
  frontend/         # React/Vite
    package.json
    src/
  docker-compose.yml
  .env.example
  Makefile          # make dev, make migrate, make test
```

Run `openapi-typescript` against `/openapi.json` to auto-generate TS types — no manual duplication. No Nx/Turborepo needed at project start.

## Version Compatibility

- FastAPI ≥0.111 requires Pydantic v2
- SQLAlchemy 2.0 + asyncpg ≥0.29
- TanStack Query v5 — don't mix v4 docs
- shadcn/ui requires Tailwind CSS v3 (v4 support in progress)
- React 18 or 19 — both compatible with TanStack Query v5

## Unresolved Questions

1. File attachments: MinIO (local dev, S3-compatible) or direct S3? Multipart upload strategy?
2. Search: PostgreSQL FTS sufficient or add Meilisearch/Typesense?
3. Background jobs (email, reminders): ARQ (async-native) vs Celery + Redis?
4. SSE scalability: multiple FastAPI instances need Redis Pub/Sub — include Redis from day one?
5. Multi-tenancy: app-level filtering vs PostgreSQL RLS?
