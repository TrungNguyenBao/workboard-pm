---
phase: 1
title: "Backend: Add start_date to Task"
status: pending
effort: 30m
---

# Phase 1: Backend -- Add `start_date` to Task

## Context

- [Task model](../../backend/app/models/task.py) -- has `due_date`, needs `start_date`
- [Task schemas](../../backend/app/schemas/task.py) -- Pydantic Create/Update/Response
- [Task service](../../backend/app/services/task.py) -- update_task tracks field changes
- [Migration pattern](../../backend/alembic/versions/0002_add_activity_log.py) -- revision numbering

## Overview

Add nullable `start_date` (DateTime with timezone) to the Task model. Mirrors `due_date` pattern exactly. Add validation: `start_date <= due_date` when both present.

## Implementation Steps

### 1. Alembic Migration

Create `backend/alembic/versions/0003_add_task_start_date.py`:

```python
"""add task start_date

Revision ID: 0003
Revises: 0002
"""
import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"

def upgrade() -> None:
    op.add_column("tasks", sa.Column("start_date", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_tasks_start_date", "tasks", ["start_date"])

def downgrade() -> None:
    op.drop_index("ix_tasks_start_date", table_name="tasks")
    op.drop_column("tasks", "start_date")
```

### 2. Task Model (`backend/app/models/task.py`)

Add after `due_date` field (line ~54):

```python
start_date: Mapped[datetime | None] = mapped_column(
    DateTime(timezone=True), nullable=True, index=True
)
```

### 3. Pydantic Schemas (`backend/app/schemas/task.py`)

**TaskCreate** -- add field:
```python
start_date: datetime | None = None
```

**TaskUpdate** -- add field:
```python
start_date: datetime | None = None
```

**TaskResponse** -- add field after `due_date`:
```python
start_date: datetime | None
```

**TaskResponse.extract_from_orm** -- add to dict:
```python
"start_date": data.start_date,
```

**Add validator** on TaskCreate and TaskUpdate:
```python
@model_validator(mode="after")
def validate_dates(self) -> "Self":
    if self.start_date and self.due_date and self.start_date > self.due_date:
        raise ValueError("start_date must be before or equal to due_date")
    return self
```

### 4. Task Service (`backend/app/services/task.py`)

Add `"start_date"` to `tracked_fields` set (line ~111) so activity log captures changes.

## Todo

- [ ] Create migration file `0003_add_task_start_date.py`
- [ ] Add `start_date` column to Task model
- [ ] Add `start_date` to TaskCreate, TaskUpdate, TaskResponse schemas
- [ ] Add date validation (start <= due)
- [ ] Add `start_date` to `extract_from_orm` in TaskResponse
- [ ] Add `start_date` to tracked_fields in task service
- [ ] Run `make migrate` to apply
- [ ] Run `make test` to verify no regressions

## Success Criteria

- `start_date` column exists in DB, nullable, indexed
- PATCH `/projects/:id/tasks/:id` accepts `start_date`
- Response includes `start_date` field
- Validation rejects `start_date > due_date`
- Existing tasks unaffected (null start_date)
