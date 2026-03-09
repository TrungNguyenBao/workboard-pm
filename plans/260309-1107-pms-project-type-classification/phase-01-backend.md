# Phase 1: Backend — Model + Schema + Migration

**Priority:** High | **Status:** pending | **Effort:** ~1h

## Context Links
- Model: `backend/app/modules/pms/models/project.py`
- Schema: `backend/app/modules/pms/schemas/project.py`
- Last migration: `backend/alembic/versions/0017_crm_sop_workflow_fields.py`

## Requirements

- Add `project_type` varchar(20) column to `projects` table, default `'kanban'`
- Enum values: `basic`, `kanban`, `agile`
- Include in ProjectCreate (default=`'kanban'`), ProjectUpdate (optional), ProjectResponse
- Zero breaking changes — all existing projects default to `kanban`

## Related Code Files

**Modify:**
- `backend/app/modules/pms/models/project.py` — add `project_type` field
- `backend/app/modules/pms/schemas/project.py` — add to all three schemas

**Create:**
- `backend/alembic/versions/0018_add_project_type.py`

## Implementation Steps

### 1. Update `models/project.py`

Add after `is_archived` line (line 26):

```python
project_type: Mapped[str] = mapped_column(String(20), default="kanban")
```

### 2. Update `schemas/project.py`

In `ProjectCreate`:
```python
project_type: str = "kanban"  # basic | kanban | agile
```

In `ProjectUpdate`:
```python
project_type: str | None = None
```

In `ProjectResponse`:
```python
project_type: str
```

### 3. Create migration `0018_add_project_type.py`

```python
"""add project_type to projects

Revision ID: 0018
Revises: 0017
Create Date: 2026-03-09
"""
from alembic import op
import sqlalchemy as sa

revision = '0018'
down_revision = '0017'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column(
        'projects',
        sa.Column('project_type', sa.String(20), nullable=False, server_default='kanban')
    )

def downgrade() -> None:
    op.drop_column('projects', 'project_type')
```

### 4. Run and verify migration

```bash
cd backend && alembic upgrade head
```

## Todo

- [ ] Add `project_type` field to `Project` SQLAlchemy model
- [ ] Add `project_type` to `ProjectCreate`, `ProjectUpdate`, `ProjectResponse`
- [ ] Create alembic migration `0018_add_project_type.py`
- [ ] Run `alembic upgrade head` and verify

## Success Criteria

- `GET /pms/projects/:id` returns `project_type` field
- `POST /pms/workspaces/:id/projects` with `project_type: "basic"` persists correctly
- `PATCH /pms/projects/:id` with `project_type: "agile"` updates correctly
- Existing projects without explicit type return `"kanban"`
