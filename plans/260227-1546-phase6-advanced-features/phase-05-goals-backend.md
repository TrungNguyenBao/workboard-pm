# Phase 5: Goals/Portfolio Backend

## Overview

- **Priority:** P2
- **Status:** completed
- **Effort:** 2 days
- **Depends on:** none

Workspace-level goals with progress tracking. Goals link to projects and milestone tasks.
Auto progress calculates from completed linked tasks.

## Architecture

- `goals` table at workspace level (not project level)
- `goal_project_links` and `goal_task_links` as join tables
- Status enum: `on_track`, `at_risk`, `off_track`, `achieved`, `dropped`
- Progress: `calculation_method = "auto"` uses completed/total linked tasks * 100
- Progress: `calculation_method = "manual"` uses `progress_value` set by user
- Owner = workspace member who owns the goal
- Soft-delete for goals

## Files to Create

| File | Purpose |
|------|---------|
| `backend/alembic/versions/0006_add_goals.py` | Migration for 3 tables |
| `backend/app/models/goal.py` | Goal, GoalProjectLink, GoalTaskLink models (~80 lines) |
| `backend/app/schemas/goal.py` | Create/Update/Response + link schemas (~70 lines) |
| `backend/app/services/goal.py` | CRUD + link/unlink + progress calc (~150 lines) |
| `backend/app/api/v1/routers/goals.py` | 7 endpoints (~100 lines) |

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/models/__init__.py` | Import Goal, GoalProjectLink, GoalTaskLink |
| `backend/app/models/enums.py` | Add GoalStatus enum |
| `backend/app/api/v1/router.py` | Register goals router |

## Implementation Steps

### 1. Enum (`backend/app/models/enums.py`)

Add:
```python
class GoalStatus(str, enum.Enum):
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    OFF_TRACK = "off_track"
    ACHIEVED = "achieved"
    DROPPED = "dropped"
```

### 2. Migration (`0006_add_goals.py`)

Create 3 tables:
- **goals**: id, workspace_id (FK CASCADE), title (300), description (Text), status (default "on_track"),
  progress_value (Float default 0), calculation_method (default "manual"), color (default "#5E6AD2"),
  owner_id (FK users), due_date, timestamps, deleted_at. Index: `ix_goals_workspace_id`
- **goal_project_links**: composite PK (goal_id FK CASCADE, project_id FK CASCADE), created_at
- **goal_task_links**: composite PK (goal_id FK CASCADE, task_id FK CASCADE), created_at

### 3. Models (`backend/app/models/goal.py`)

Three models mirroring migration columns. Follow existing patterns (Task model):
- **Goal(Base, TimestampMixin, SoftDeleteMixin)**: all columns from migration. Relationships:
  `owner` (FK users), `project_links` (cascade all, delete-orphan), `task_links` (cascade all, delete-orphan)
- **GoalProjectLink(Base)**: composite PK. Relationships: `goal` (back_populates), `project`
- **GoalTaskLink(Base)**: composite PK. Relationships: `goal` (back_populates), `task`

### 4. Schemas (`backend/app/schemas/goal.py`)

- **GoalCreate**: title (1-300, required), description, status="on_track",
  calculation_method="manual", color="#5E6AD2", owner_id (required), due_date
- **GoalUpdate**: all fields optional, adds progress_value (float)
- **GoalResponse**: all Goal columns + `owner_name`, `linked_project_count`, `linked_task_count`
  (enriched fields). `from_attributes=True`
- **LinkProjectRequest**: project_id (UUID)
- **LinkTaskRequest**: task_id (UUID)

### 5. Service (`backend/app/services/goal.py`)

Functions:
- `create_goal(db, workspace_id, data, creator) -> Goal`
- `list_goals(db, workspace_id) -> list[Goal]` -- eager-load owner + link counts
- `get_goal(db, goal_id) -> Goal` -- 404 if deleted
- `update_goal(db, goal_id, data) -> Goal`
- `delete_goal(db, goal_id)` -- soft delete
- `link_project(db, goal_id, project_id)` -- insert GoalProjectLink
- `unlink_project(db, goal_id, project_id)` -- delete link
- `link_task(db, goal_id, task_id)` -- insert GoalTaskLink
- `unlink_task(db, goal_id, task_id)` -- delete link
- `calculate_auto_progress(db, goal_id) -> float` -- query linked tasks, return % completed

Auto progress calculation:
```python
async def calculate_auto_progress(db: AsyncSession, goal_id: uuid.UUID) -> float:
    total = await db.scalar(
        select(func.count()).where(GoalTaskLink.goal_id == goal_id)
    )
    if not total:
        return 0.0
    completed = await db.scalar(
        select(func.count()).select_from(GoalTaskLink).join(Task).where(
            GoalTaskLink.goal_id == goal_id,
            Task.status == "completed",
            Task.deleted_at.is_(None),
        )
    )
    return round((completed / total) * 100, 1)
```

### 6. Router (`backend/app/api/v1/routers/goals.py`)

Prefix: `/workspaces/{workspace_id}/goals`

| Method | Path | Action | Min Role |
|--------|------|--------|----------|
| POST | `` | create_goal | member |
| GET | `` | list_goals | member |
| GET | `/{goal_id}` | get_goal | member |
| PATCH | `/{goal_id}` | update_goal | member |
| DELETE | `/{goal_id}` | delete_goal | admin |
| POST | `/{goal_id}/projects` | link_project | member |
| DELETE | `/{goal_id}/projects/{project_id}` | unlink_project | member |
| POST | `/{goal_id}/tasks` | link_task | member |
| DELETE | `/{goal_id}/tasks/{task_id}` | unlink_task | member |

### 7. Register router

In `backend/app/api/v1/router.py`:
```python
from app.api.v1.routers import goals
api_router.include_router(goals.router)
```

### 8. Update `__init__.py`

```python
from app.models.goal import Goal, GoalProjectLink, GoalTaskLink  # noqa: F401
```

## Todo

- [x] Add GoalStatus enum
- [x] Create migration 0006
- [x] Create `models/goal.py` with 3 models
- [x] Update `models/__init__.py` imports
- [x] Create `schemas/goal.py`
- [x] Create `services/goal.py` with CRUD + link/unlink + auto progress
- [x] Create `routers/goals.py` with 9 endpoints
- [x] Register router in `api/v1/router.py`
- [ ] Write unit tests for auto progress calculation

## Success Criteria

- Goals CRUD works scoped to workspace with RBAC
- Link/unlink projects and tasks via API
- Auto progress calculation returns correct % for linked tasks
- Manual progress can be set directly via PATCH
- Soft-deleted goals excluded from list
- 404 for non-existent goals
