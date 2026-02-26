# Phase 06 — Backend: Real-Time SSE & Notifications

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** SSE endpoint, PostgreSQL LISTEN/NOTIFY, notification CRUD, background jobs (due reminders)

## Context Links
- [Stack Research](../reports/researcher-stack-react-fastapi-postgresql.md) §5 Real-Time

## Related Code Files

### Create
```
backend/app/
  core/events.py           # SSE connection manager + PG LISTEN/NOTIFY
  services/notification_service.py
  api/v1/routers/events.py      # GET /events (SSE)
  api/v1/routers/notifications.py
  worker/
    __init__.py
    arq_worker.py           # ARQ job definitions
    tasks/due_reminders.py
```

## Implementation Steps

### 1. PostgreSQL LISTEN/NOTIFY setup (core/events.py)

```python
import asyncio, asyncpg, json
from collections import defaultdict
from fastapi import Request
from fastapi.responses import StreamingResponse
from app.core.config import settings

# In-memory SSE client registry
# {workspace_id: set[asyncio.Queue]}
_clients: dict[str, set[asyncio.Queue]] = defaultdict(set)

async def notify_workspace(workspace_id: str, event: dict):
    """Push event to all SSE clients in this workspace."""
    for queue in list(_clients.get(workspace_id, set())):
        await queue.put(event)

async def pg_listener(workspace_id: str):
    """Background task: LISTEN to pg channel, broadcast to SSE clients."""
    conn = await asyncpg.connect(settings.DATABASE_URL_SYNC)  # sync DSN for asyncpg
    await conn.add_listener(f"workspace_{workspace_id}", lambda *args: asyncio.create_task(
        notify_workspace(workspace_id, json.loads(args[3]))
    ))
    # Keep alive until no clients remain
    while _clients.get(workspace_id):
        await asyncio.sleep(1)
    await conn.close()

async def sse_stream(request: Request, workspace_id: str, user_id: str):
    """Generator for SSE response."""
    queue = asyncio.Queue()
    _clients[workspace_id].add(queue)
    try:
        # Send initial connected event
        yield f"data: {json.dumps({'type': 'connected'})}\n\n"
        while True:
            if await request.is_disconnected():
                break
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30)
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"   # SSE comment = keepalive ping
    finally:
        _clients[workspace_id].discard(queue)
```

### 2. SSE endpoint (api/v1/routers/events.py)
```python
@router.get("/events")
async def sse_endpoint(
    token: str,   # JWT via query param (EventSource can't set headers)
    request: Request,
    db=Depends(get_db)
):
    try:
        user = await get_user_from_token(token, db)
    except:
        raise HTTPException(401)

    workspace_id = await get_user_workspace_id(user, db)

    # Start PG listener if first client for this workspace
    if workspace_id not in _clients or not _clients[workspace_id]:
        asyncio.create_task(pg_listener(workspace_id))

    return StreamingResponse(
        sse_stream(request, workspace_id, str(user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
```

### 3. NOTIFY helper (used in task_service, comment_service, notification_service)
```python
async def pg_notify(db: AsyncSession, channel: str, payload: dict):
    await db.execute(text(f"NOTIFY {channel}, :payload"), {"payload": json.dumps(payload)})

# Usage in task_service.update_task:
await pg_notify(db, f"workspace_{workspace_id}", {
    "type": "task_updated",
    "task_id": str(task.id),
    "project_id": str(task.project_id),
    "changes": changed_fields,
    "actor_id": str(user_id)
})
```

Event types: `task_updated`, `task_created`, `task_deleted`, `comment_added`, `notification_created`, `section_updated`

### 4. Notification service (services/notification_service.py)
```python
async def create(db, recipient_id, type, entity_type, entity_id, message, actor_id=None):
    notif = Notification(user_id=recipient_id, type=type, entity_type=entity_type,
                         entity_id=entity_id, message=message, actor_id=actor_id)
    db.add(notif)
    await db.flush()
    # NOTIFY so recipient's SSE stream gets it immediately
    await pg_notify(db, f"workspace_{workspace_id}", {
        "type": "notification_created",
        "notification_id": str(notif.id),
        "recipient_id": str(recipient_id)
    })
```

Notification creation triggers:
- Task assigned → notify assignee
- @mention in comment → notify mentioned users
- Followed task updated (title, status, assignee) → notify followers
- Due-date reminder (background job) → notify assignee

### 5. Notifications router
```
GET    /notifications?unread_only=&limit=&offset= → paginated list
GET    /notifications/unread-count                → {count: N}
PATCH  /notifications/{id}/read                  → mark read
POST   /notifications/read-all                   → mark all read
DELETE /notifications/{id}                        → delete
```

### 6. ARQ background worker (worker/arq_worker.py)
```python
from arq import create_pool
from arq.connections import RedisSettings

# Job: due_date_reminders — runs every hour via cron
async def send_due_reminders(ctx):
    db = ctx['db']
    # Query tasks due tomorrow, not yet reminded, with assignee
    # Create DUE_SOON notifications for each
    # Update task.reminder_sent_at

class WorkerSettings:
    functions = [send_due_reminders]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    cron_jobs = [cron(send_due_reminders, hour={8})]  # 8am daily
    on_startup = startup  # init db pool
    on_shutdown = shutdown
```

## Todo
- [ ] Implement core/events.py (SSE connection manager + PG listener)
- [ ] Implement GET /events SSE endpoint with JWT query param auth
- [ ] Add pg_notify() helper to task_service, comment_service
- [ ] Implement notification_service (create + all triggers)
- [ ] Implement notifications router (CRUD)
- [ ] Setup ARQ worker (pyproject.toml + worker/arq_worker.py)
- [ ] Implement due_reminders cron job
- [ ] Test: task update → SSE event received in browser EventSource
- [ ] Test: @mention → notification appears in bell dropdown in real-time

## Success Criteria
- EventSource connection stays alive with keepalive pings every 30s
- Task update by User A appears in User B's UI within 1s (same workspace)
- @mention in comment creates notification immediately
- Due-soon reminders appear in notifications for tasks due tomorrow
- Client disconnect cleans up queue; no memory leak

## Risk Assessment
- PG LISTEN/NOTIFY: one asyncpg connection per workspace (not per user) — scales well
- SSE proxy buffering: MUST set `X-Accel-Buffering: no` for nginx
- Multiple FastAPI instances: requires Redis Pub/Sub instead of in-memory — document as v2 upgrade

## Security Considerations
- SSE JWT in query param: token expiry enforced (15min access token); client must reconnect to refresh
- Filter SSE events: only send events relevant to authenticated user's workspace

## Next Steps
→ Phase 07: frontend foundation
