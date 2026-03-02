# WorkBoard — Code Standards

**Last updated:** 2026-02-27

---

## General Principles

- **YAGNI / KISS / DRY** — build what is needed, keep it simple, avoid repetition.
- **File size:** keep individual files under 200 lines; split at logical boundaries.
- **File naming:** kebab-case with descriptive names (`task-detail-drawer.tsx`, `activity-log.py`).
- **No mocks in production paths** — implement real logic, no temporary stubs.
- **Error handling:** always use try/catch or FastAPI exception handlers; never swallow errors silently.

---

## Backend (Python / FastAPI)

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Files | `snake_case` | `activity_log.py` |
| Classes | `PascalCase` | `ActivityLog`, `ActivityLogResponse` |
| Functions / variables | `snake_case` | `create_activity()`, `workspace_id` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_LIMIT = 100` |
| Pydantic models | `PascalCase` + `Response`/`Create`/`Update` suffix | `ActivityLogResponse` |

### Router Pattern

Routers are thin. They:
1. Declare the route and response model.
2. Run auth/RBAC via `Depends()`.
3. Delegate immediately to a service function.
4. Return the service result directly.

```python
@router.get("/projects/{project_id}/activity", response_model=list[ActivityLogResponse])
async def project_activity(
    project_id: uuid.UUID,
    limit: int = Query(default=50, le=100),
    cursor: str | None = Query(default=None),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_activity(db, project_id=project_id, limit=limit, cursor=cursor)
```

No business logic, no direct DB queries inside routers.

### Service Pattern

Services own all business logic and DB interaction:

```python
async def create_activity(
    db: AsyncSession,
    *,
    workspace_id: uuid.UUID,
    project_id: uuid.UUID | None,
    entity_type: str,
    entity_id: uuid.UUID,
    actor_id: uuid.UUID,
    action: str,
    changes: dict | None = None,
) -> ActivityLog:
    ...
```

- Use keyword-only arguments (`*,`) for service functions to prevent argument order errors.
- Commit inside the service, not the router.
- Publish SSE events after successful commit.

### Models

- Inherit from `Base` + mixins (`TimestampMixin`, `SoftDeleteMixin` as needed).
- Declare all columns with `Mapped[T]` typed annotations (SQLAlchemy 2.0 style).
- Define `__table_args__` for composite indexes and unique constraints.
- Use `JSONB` for flexible structured data (e.g., `changes` in `ActivityLog`).

### Schemas (Pydantic v2)

- Always set `model_config = {"from_attributes": True}` on response models.
- Use `model_validator(mode="before")` to flatten ORM relationships into flat response fields (see `ActivityLogResponse.extract_actor`).
- Never expose internal IDs or sensitive fields (e.g., `hashed_password`) in response schemas.

### RBAC Dependencies

| Dependency | Minimum access required |
|---|---|
| `require_workspace_role("guest")` | Any workspace member |
| `require_workspace_role("member")` | Full member (not guest) |
| `require_workspace_role("admin")` | Workspace admin only |
| `require_project_role("viewer")` | Any project member |
| `require_project_role("commenter")` | Can add comments |
| `require_project_role("editor")` | Can edit tasks |
| `require_project_role("owner")` | Project owner only |

### Migrations

- One migration per feature. Name: `{sequence}_{description}` (e.g., `0002_add_activity_log`).
- Always add indexes in the same migration as the table.
- Never modify a completed migration; create a new one.

---

## Frontend (TypeScript / React)

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `activity-timeline.tsx`, `use-sse.ts` |
| React components | `PascalCase` (default export) | `ActivityTimeline` |
| Hooks | `camelCase` prefixed with `use` | `useSse`, `useActivityFeed` |
| Variables / functions | `camelCase` | `projectId`, `fetchActivity` |
| Types / interfaces | `PascalCase` | `ActivityLogResponse` |
| Zustand stores | `camelCase` with `use` prefix | `useAuthStore` |

### Feature Folder Structure

```
features/{name}/
  components/   # UI components (presentational and container)
  hooks/        # TanStack Query hooks
  pages/        # Route-level page components
  tests/        # vitest tests
```

### Component Rules

- One component per file, file name matches component name in kebab-case.
- Keep components under 200 lines; extract sub-components or hooks when approaching limit.
- Props types defined inline with `interface` at the top of the file.
- No business logic in page components — delegate to hooks.

### Data Fetching (TanStack Query v5)

```typescript
// Query key convention: [resource, scope, id]
queryKey: ["activity", "project", projectId]
queryKey: ["activity", "task", taskId]
```

- Always specify `queryKey` arrays with enough specificity to scope cache invalidation.
- Mutations call `queryClient.invalidateQueries` on success.
- SSE-driven invalidation lives in `use-sse.ts`, not in individual components.

### State Management

- **Server state:** TanStack Query — never put fetched data in Zustand.
- **Global client state:** Zustand stores in `shared/stores/` — auth tokens, active workspace.
- **Form state:** React Hook Form + Zod schema validation.
- **Local UI state:** `useState` / `useReducer` within the component.

### SSE Integration

`use-sse.ts` is the single point of truth for SSE event handling:
- Maintains one `EventSource` per authenticated session.
- Dispatches incoming events to `queryClient.invalidateQueries` by type.
- Adding a new event type: add a `case` in the event handler switch and invalidate the relevant query key.

### TypeScript

- `strict: true` — no `any` unless wrapping an external boundary.
- Always type API response shapes; generate from `/openapi.json` via `openapi-typescript` when possible.
- Prefer `type` over `interface` for unions; use `interface` for object shapes that may be extended.

---

## Testing

### Backend (pytest)

- Use SQLite in-memory for unit/integration tests (models use `TSVECTOR` degradation shim).
- Test files mirror source structure: `tests/test_services/test_activity_log.py`.
- Each test function is independent; use fixtures for DB session and test user setup.

### Frontend (vitest)

- Test files co-located in `features/{name}/tests/`.
- Use React Testing Library for component tests.
- Mock TanStack Query with `QueryClient` wrapper in test utils.
- Do not mock network calls with fake data to pass tests — use MSW or real test endpoints.

### E2E (Playwright)

- Located at project root `e2e/`.
- Cover critical user flows: login, create project, create task, drag-and-drop reorder.

---

## API Design Conventions

- Base path: `/api/v1/`
- Resource URLs: plural nouns, kebab-case (`/activity-logs` if standalone, nested as `/projects/{id}/activity`).
- Module routes: `/api/v1/{module}/{resource}` (e.g., `/api/v1/pms/projects`, `/api/v1/wms/products`).
- Nested resources use parent scope in path: `/projects/{project_id}/tasks/{task_id}/activity`.
- **WMS Pagination** (offset-based): `GET /api/v1/wms/products?limit=20&offset=0` → returns `PaginatedResponse[ProductResponse]`.
- **PMS Pagination** (cursor-based): `GET /api/v1/pms/projects/{id}/activity?limit=50&cursor={uuid}` — uses UUID of last seen record.
- HTTP methods: `GET` read, `POST` create, `PATCH` partial update, `DELETE` remove.
- Auth errors: `401 Unauthorized`; permission errors: `403 Forbidden`; not found: `404 Not Found`.

---

## Git & Commit Conventions

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Commits focused on a single logical change.
- Never commit `.env` files or secrets.
- Run `make lint` before committing; run `make test` before pushing.
