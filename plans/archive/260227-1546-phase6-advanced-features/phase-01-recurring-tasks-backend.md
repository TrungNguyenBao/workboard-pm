# Phase 1: Recurring Tasks Backend

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 2 days
- **Depends on:** none

Add recurrence columns to tasks, extend schemas/services, create ARQ nightly job to spawn
occurrences. Parent tasks act as templates (never complete); spawned instances complete independently.

## Architecture

- 5 new nullable columns on `tasks` table (no new tables)
- Enum values: `daily`, `weekly`, `biweekly`, `monthly`, `custom_cron`
- ARQ cron job `spawn_recurring_tasks` runs at 2 AM UTC daily
- `croniter` used only when `recurrence_rule == "custom_cron"` and a `recurrence_cron_expr` value exists
- Parent task (`recurrence_rule IS NOT NULL AND parent_recurring_id IS NULL`) = template
- Spawned task (`parent_recurring_id IS NOT NULL`) = occurrence

## Files to Create

| File | Purpose |
|------|---------|
| `backend/alembic/versions/0004_add_recurring_task_fields.py` | Migration |
| `backend/app/services/recurring_tasks.py` | Spawn logic, date calc, validation |

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/models/task.py` | Add 5 columns + relationship |
| `backend/app/schemas/task.py` | Extend Create/Update/Response schemas |
| `backend/app/services/task.py` | Block completing parent recurring tasks |
| `backend/app/worker/tasks.py` | Register `spawn_recurring_tasks` cron job |
| `backend/app/models/__init__.py` | No change needed (Task already imported) |

## Implementation Steps

### 1. Migration (`0004_add_recurring_task_fields.py`)

Add columns to `tasks`:
```python
op.add_column("tasks", sa.Column("recurrence_rule", sa.String(50), nullable=True))
op.add_column("tasks", sa.Column("recurrence_cron_expr", sa.String(100), nullable=True))
op.add_column("tasks", sa.Column("recurrence_end_date", sa.DateTime(timezone=True), nullable=True))
op.add_column("tasks", sa.Column("parent_recurring_id", postgresql.UUID(as_uuid=True),
              sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True))
op.add_column("tasks", sa.Column("last_generated_date", sa.DateTime(timezone=True), nullable=True))
op.create_index("ix_tasks_recurrence_rule", "tasks", ["recurrence_rule"],
                postgresql_where=sa.text("recurrence_rule IS NOT NULL"))
op.create_index("ix_tasks_parent_recurring_id", "tasks", ["parent_recurring_id"])
```

### 2. Model (`backend/app/models/task.py`)

Add to `Task` class after `completed_at`:
```python
recurrence_rule: Mapped[str | None] = mapped_column(String(50), nullable=True)
recurrence_cron_expr: Mapped[str | None] = mapped_column(String(100), nullable=True)
recurrence_end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
parent_recurring_id: Mapped[uuid.UUID | None] = mapped_column(
    ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True
)
last_generated_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

recurring_parent: Mapped["Task | None"] = relationship(
    remote_side="Task.id", foreign_keys=[parent_recurring_id]
)
```

### 3. Schemas (`backend/app/schemas/task.py`)

Extend `TaskCreate`:
```python
recurrence_rule: str | None = None  # daily/weekly/biweekly/monthly/custom_cron
recurrence_cron_expr: str | None = None
recurrence_end_date: datetime | None = None
```

Extend `TaskUpdate` with same 3 fields.

Extend `TaskResponse`:
```python
recurrence_rule: str | None = None
recurrence_cron_expr: str | None = None
recurrence_end_date: datetime | None = None
parent_recurring_id: uuid.UUID | None = None
```

Update `extract_from_orm` to include 4 new response fields.

### 4. Service: recurring task logic (`backend/app/services/recurring_tasks.py`)

New file ~80 lines:
- `validate_recurrence(data: TaskCreate | TaskUpdate)` -- validate rule enum, cron expr
- `calculate_next_due(task: Task) -> datetime | None` -- interval map + croniter for custom
- `spawn_occurrence(db, template: Task) -> Task` -- copy fields, set parent_recurring_id
- `spawn_all_due(db: AsyncSession) -> int` -- query templates, spawn occurrences

### 5. Service: block parent completion (`backend/app/services/task.py`)

In `update_task`, before setting `completed_at`:
```python
if "status" in updates and updates["status"] == "completed":
    if task.recurrence_rule and not task.parent_recurring_id:
        raise HTTPException(400, "Cannot complete a recurring template task")
```

### 6. Worker: register cron job (`backend/app/worker/tasks.py`)

Add function:
```python
async def spawn_recurring_tasks(ctx: dict) -> int:
    from app.core.database import AsyncSessionLocal
    from app.services.recurring_tasks import spawn_all_due
    async with AsyncSessionLocal() as db:
        return await spawn_all_due(db)
```

Register in `WorkerSettings`:
```python
functions = [send_due_reminders, spawn_recurring_tasks]
cron_jobs = [
    cron(send_due_reminders, hour=8, minute=0),
    cron(spawn_recurring_tasks, hour=2, minute=0),
]
```

### 7. Install `croniter`

```bash
cd backend && uv add croniter
```

## Todo

- [ ] Create migration 0004
- [ ] Add model columns + relationship
- [ ] Extend TaskCreate/TaskUpdate/TaskResponse schemas
- [ ] Create `services/recurring_tasks.py` with validate/calculate/spawn
- [ ] Block parent task completion in `services/task.py`
- [ ] Register ARQ cron job in worker
- [ ] Install `croniter` dependency
- [ ] Write unit tests for date calculation + spawn logic

## Success Criteria

- `POST /projects/{id}/tasks` with `recurrence_rule: "weekly"` creates template task
- `PATCH` template task with `status: "completed"` returns 400
- `spawn_recurring_tasks` job creates occurrence with correct `due_date`
- Occurrence has `parent_recurring_id` pointing to template
- Recurrence stops when `recurrence_end_date` is passed

## Risk Assessment

- **Timezone drift:** Store all dates UTC; convert in frontend. Defer user TZ preference to v2.
- **Missed job runs:** `spawn_all_due` is idempotent; checks `last_generated_date` to avoid duplicates.
- **Custom CRON abuse:** Validate via `croniter.is_valid(expr)` before save; limit to 5-part cron.
