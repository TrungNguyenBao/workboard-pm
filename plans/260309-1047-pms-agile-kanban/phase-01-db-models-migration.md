# Phase 1: DB Models + Alembic Migration

## Context Links
- [Task model](../../backend/app/modules/pms/models/task.py)
- [Project/Section model](../../backend/app/modules/pms/models/project.py)
- [Models __init__](../../backend/app/modules/pms/models/__init__.py)
- [Base mixins](../../backend/app/models/base.py)
- [Migration example](../../backend/alembic/versions/0006_add_goals.py)

## Overview
- **Priority:** P1 (blocker for all other phases)
- **Status:** completed
- **Effort:** 2h
- **Description:** Add `project_type` to Project model; create Sprint model; add agile fields to Task (story_points, task_type, sprint_id, epic_id); add wip_limit to Section; update ProjectCreate/Update/Response schemas; single Alembic migration 0018 covers all changes.

## Requirements

### Functional
- **Project enhancement:** `project_type` VARCHAR(20) default `'kanban'` (`basic` | `kanban` | `agile`)
- Sprint table: project_id, name, goal, start_date, end_date, status, created_by_id
- Task enhancements: story_points (int nullable), task_type (varchar, default 'task'), sprint_id (FK nullable), epic_id (FK nullable)
- Section enhancement: wip_limit (int nullable)

### Non-Functional
- All new fields nullable to maintain backward compatibility
- Migration must be reversible (downgrade)
- Keep each file under 200 lines

## Architecture

### Sprint Model (new table `sprints`)

```
sprints
  id          UUID PK (default uuid4)
  project_id  UUID FK -> projects.id (indexed)
  name        VARCHAR(255) NOT NULL
  goal        TEXT nullable
  start_date  DATETIME(tz) nullable
  end_date    DATETIME(tz) nullable
  status      VARCHAR(20) default 'planning' (planning/active/completed)
  created_by_id UUID FK -> users.id
  created_at  DATETIME(tz) server_default now()
  updated_at  DATETIME(tz) server_default now()
  deleted_at  DATETIME(tz) nullable (SoftDeleteMixin)
```

### Task table additions
```
sprint_id    UUID FK -> sprints.id nullable, indexed
epic_id      UUID FK -> tasks.id nullable, indexed (self-ref for epic grouping)
story_points INTEGER nullable
task_type    VARCHAR(20) default 'task' ('task'/'story'/'bug'/'epic')
```

### Section table additions
```
wip_limit    INTEGER nullable
```

## Related Code Files

### Files to CREATE
1. `backend/app/modules/pms/models/sprint.py` -- Sprint model
2. `backend/alembic/versions/0018_add_sprints_and_agile_fields.py` -- migration

### Files to MODIFY
1. `backend/app/modules/pms/models/project.py` -- add `project_type` to Project, sprints relationship, wip_limit to Section
2. `backend/app/modules/pms/models/task.py` -- add sprint_id, epic_id, story_points, task_type + relationships
3. `backend/app/modules/pms/models/__init__.py` -- import Sprint model
4. `backend/app/modules/pms/schemas/project.py` -- add `project_type` to ProjectCreate, ProjectUpdate, ProjectResponse

## Implementation Steps

### Step 1: Create Sprint model

Create `backend/app/modules/pms/models/sprint.py`:

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin


class Sprint(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "sprints"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="planning", index=True
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    project: Mapped["Project"] = relationship(back_populates="sprints")  # noqa: F821
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(back_populates="sprint")  # noqa: F821
```

### Step 2: Add agile fields to Task model

In `backend/app/modules/pms/models/task.py`, add after the `custom_fields` field:

```python
# Agile fields
sprint_id: Mapped[uuid.UUID | None] = mapped_column(
    ForeignKey("sprints.id"), nullable=True, index=True
)
epic_id: Mapped[uuid.UUID | None] = mapped_column(
    ForeignKey("tasks.id"), nullable=True, index=True
)
story_points: Mapped[int | None] = mapped_column(nullable=True)
task_type: Mapped[str] = mapped_column(String(20), default="task")
```

Add relationships after existing relationships:

```python
sprint: Mapped["Sprint | None"] = relationship(back_populates="tasks")  # noqa: F821
epic: Mapped["Task | None"] = relationship(
    remote_side="Task.id", foreign_keys="Task.epic_id"
)
```

Also add to `__table_args__`:
```python
Index("ix_tasks_sprint_id", "sprint_id"),
```

**IMPORTANT:** The `Integer` type import is NOT needed -- `mapped_column(nullable=True)` with `Mapped[int | None]` infers Integer automatically in SQLAlchemy 2.0.

### Step 3: Add wip_limit to Section model

In `backend/app/modules/pms/models/project.py`, add to the `Section` class after `position`:

```python
wip_limit: Mapped[int | None] = mapped_column(nullable=True)
```

### Step 4: Add sprints relationship to Project

In `backend/app/modules/pms/models/project.py`, add to `Project` class relationships:

```python
sprints: Mapped[list["Sprint"]] = relationship(back_populates="project")  # noqa: F821
```

### Step 5: Update models __init__.py

In `backend/app/modules/pms/models/__init__.py`, add:

```python
from app.modules.pms.models.sprint import Sprint  # noqa: F401
```

### Step 6: Create Alembic migration

Create `backend/alembic/versions/0018_add_sprints_and_agile_fields.py`:

```python
"""add sprints and agile fields

Revision ID: 0018
Revises: 0017
Create Date: 2026-03-09

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create sprints table
    op.create_table(
        "sprints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("goal", sa.Text(), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="planning"),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_sprints_project_id", "sprints", ["project_id"])
    op.create_index("ix_sprints_status", "sprints", ["status"])

    # Add agile fields to tasks
    op.add_column("tasks", sa.Column(
        "sprint_id", postgresql.UUID(as_uuid=True),
        sa.ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True))
    op.add_column("tasks", sa.Column(
        "epic_id", postgresql.UUID(as_uuid=True),
        sa.ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True))
    op.add_column("tasks", sa.Column("story_points", sa.Integer(), nullable=True))
    op.add_column("tasks", sa.Column(
        "task_type", sa.String(20), nullable=False, server_default="task"))
    op.create_index("ix_tasks_sprint_id", "tasks", ["sprint_id"])
    op.create_index("ix_tasks_epic_id", "tasks", ["epic_id"])

    # Add wip_limit to sections
    op.add_column("sections", sa.Column("wip_limit", sa.Integer(), nullable=True))

    # Add project_type to projects
    op.add_column("projects", sa.Column(
        "project_type", sa.String(20), nullable=False, server_default="kanban"))


def downgrade() -> None:
    op.drop_column("projects", "project_type")
    op.drop_column("sections", "wip_limit")
    op.drop_index("ix_tasks_epic_id", table_name="tasks")
    op.drop_index("ix_tasks_sprint_id", table_name="tasks")
    op.drop_column("tasks", "task_type")
    op.drop_column("tasks", "story_points")
    op.drop_column("tasks", "epic_id")
    op.drop_column("tasks", "sprint_id")
    op.drop_index("ix_sprints_status", table_name="sprints")
    op.drop_index("ix_sprints_project_id", table_name="sprints")
    op.drop_table("sprints")
```

### Step 7: Verify migration

```bash
cd backend && alembic upgrade head
```

Check that no errors occur. Verify tables exist:
```bash
psql -d aerp -c "\d sprints"
psql -d aerp -c "\d tasks" | grep -E "sprint_id|epic_id|story_points|task_type"
psql -d aerp -c "\d sections" | grep wip_limit
```

## Todo List

- [x] Create `backend/app/modules/pms/models/sprint.py`
- [x] Add agile fields to `Task` model in `task.py`
- [x] Add `wip_limit` to `Section` in `project.py`
- [x] Add `sprints` relationship to `Project` in `project.py`
- [x] Update `models/__init__.py` with Sprint import
- [x] Create migration `0018_add_sprints_and_agile_fields.py`
- [ ] Run `alembic upgrade head` -- verify no errors (requires DB)
- [x] Run compile check (ruff or python import test)

## Success Criteria

- Migration runs cleanly (upgrade + downgrade)
- All new columns exist in DB with correct types/defaults
- Sprint model importable from `app.modules.pms.models`
- No circular import issues
- Existing task CRUD still works (all new fields nullable)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Migration conflicts with concurrent branches | Use descriptive revision ID, run `alembic heads` to check for multiple heads |
| Circular imports between Sprint and Task | Use string references in relationships (`"Sprint"`, `"Task"`) |
| task_type server_default vs model default mismatch | Set both `server_default="task"` in migration AND `default="task"` in model |
