# WorkBoard — Tech Stack

## Frontend

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Type safety, ecosystem |
| Build tool | Vite 5 | Fast HMR, ESM-native |
| UI components | shadcn/ui + Tailwind CSS v3 | Full ownership, Radix a11y primitives |
| Server state | TanStack Query v5 | Best-in-class caching + mutations |
| Client state | Zustand | No provider hell, devtools |
| Routing | React Router v6 | Protected routes, nested layouts |
| Drag & drop | @dnd-kit/core | Modern, accessible, no jQuery |
| Rich text | Tiptap (ProseMirror) | WYSIWYG task descriptions |
| Command palette | cmdk | Keyboard-first quick actions |
| Icons | Lucide React | Stroke-based, matches DM Sans |
| Real-time | EventSource (SSE) | Auto-reconnect, proxy-friendly |
| Forms | React Hook Form + Zod | Type-safe validation |
| Date handling | date-fns | Lightweight vs moment |

## Backend

| Concern | Choice | Reason |
|---|---|---|
| Framework | FastAPI 0.111+ | Async-native, auto-docs, Pydantic v2 |
| Runtime | Python 3.12 | Latest stable |
| Package manager | uv | 10-100x faster than pip/poetry |
| ORM | SQLAlchemy 2.0 async | Type-safe, asyncpg driver |
| Migrations | Alembic | Versioned, integrates with SQLAlchemy |
| Validation | Pydantic v2 | FastAPI-native, fast |
| Auth | PyJWT + passlib[bcrypt] | JWT access/refresh, bcrypt passwords |
| Rate limiting | slowapi | FastAPI-native, per-route limits |
| Real-time bus | PostgreSQL LISTEN/NOTIFY | Zero extra infra for v1; Redis upgrade path |
| Background jobs | ARQ (v2+) | Async-native, Redis-backed |
| Logging | structlog | Structured JSON logs |

## Database & Infrastructure

| Concern | Choice |
|---|---|
| Primary DB | PostgreSQL 15 |
| Cache / sessions | Redis 7 |
| File storage | Local disk (dev) → MinIO/S3 (prod) |
| Search | PostgreSQL FTS (v1) → Meilisearch (v2) |
| Containerization | Docker Compose |
| Reverse proxy | Nginx (production) |

## Shared

- `openapi-typescript` — auto-generate TS types from FastAPI `/openapi.json`
- No Nx/Turborepo — simple Makefile for dev commands

## Architecture Decision: SSE over WebSockets

SSE chosen for real-time because:
- Server-to-client only (task updates, notifications) — no bidirectional needed in v1
- Auto-reconnect built into browser EventSource API
- Works through HTTP/2 multiplexing without special proxy config
- PostgreSQL LISTEN/NOTIFY as message bus — zero extra infra
- Upgrade path to Redis Pub/Sub when multiple backend instances needed
