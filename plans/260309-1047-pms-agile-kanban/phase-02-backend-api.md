# Phase 2: Backend API — Sprints, Backlog, Sprint Board

## Context Links
- [Phase 1 — DB Models](./phase-01-db-models-migration.md)
- [Existing tasks router](../../backend/app/modules/pms/routers/tasks.py)
- [Existing task service](../../backend/app/modules/pms/services/task.py)
- [Existing task schema](../../backend/app/modules/pms/schemas/task.py)
- [PMS router registry](../../backend/app/modules/pms/router.py)
- [RBAC dependency](../../backend/app/modules/pms/dependencies/rbac.py)

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 4h
- **Depends on:** Phase 1
- **Description:** Sprint CRUD router + service, backlog endpoint, sprint board endpoint. Extend task schemas to include agile fields. Extend section schema with wip_limit.

## Requirements

### Functional
- Sprint CRUD: create, list (with status filter), get, update, delete
- Sprint lifecycle: start (planning->active), complete (active->completed)
- Sprint board: return sections + tasks filtered by sprint_id
- Backlog: return tasks where sprint_id IS NULL
- Burndown data endpoint (sprint_id -> daily completed/total points)
- Velocity data endpoint (project_id -> points per sprint)

### Non-Functional
- All endpoints require project-level RBAC (viewer for reads, editor for writes)
- Response schemas use `model_config = {"from_attributes": True}`
- Only one sprint can be active per project at a time
- Keep each file under 200 lines

## Architecture

### Endpoint Map

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/pms/projects/{project_id}/sprints` | editor | Create sprint |
| GET | `/pms/projects/{project_id}/sprints` | viewer | List sprints (optional `?status=active`) |
| GET | `/pms/projects/{project_id}/sprints/{sprint_id}` | viewer | Get sprint |
| PATCH | `/pms/projects/{project_id}/sprints/{sprint_id}` | editor | Update sprint |
| DELETE | `/pms/projects/{project_id}/sprints/{sprint_id}` | editor | Delete sprint (soft) |
| POST | `/pms/projects/{project_id}/sprints/{sprint_id}/start` | editor | Start sprint |
| POST | `/pms/projects/{project_id}/sprints/{sprint_id}/complete` | editor | Complete sprint |
| GET | `/pms/projects/{project_id}/sprints/{sprint_id}/board` | viewer | Sprint board data |
| GET | `/pms/projects/{project_id}/backlog` | viewer | Tasks with no sprint |
| GET | `/pms/projects/{project_id}/sprints/{sprint_id}/burndown` | viewer | Burndown chart data |
| GET | `/pms/projects/{project_id}/velocity` | viewer | Velocity chart data |

## Related Code Files

### Files to CREATE
1. `backend/app/modules/pms/schemas/sprint.py` -- Sprint Pydantic schemas
2. `backend/app/modules/pms/services/sprint.py` -- Sprint service functions
3. `backend/app/modules/pms/routers/sprints.py` -- Sprint router
4. `backend/app/modules/pms/services/sprint_analytics.py` -- Burndown + velocity queries

### Files to MODIFY
1. `backend/app/modules/pms/schemas/task.py` -- Add agile fields to TaskCreate, TaskUpdate, TaskResponse
2. `backend/app/modules/pms/schemas/project.py` -- Add wip_limit to SectionCreate, SectionUpdate, SectionResponse
3. `backend/app/modules/pms/router.py` -- Register sprints router

## Implementation Steps

### Step 1: Create Sprint schemas

Create `backend/app/modules/pms/schemas/sprint.py`:

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SprintCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class SprintUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class SprintResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    goal: str | None
    start_date: datetime | None
    end_date: datetime | None
    status: str
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    completed_points: int = 0
    total_points: int = 0

    model_config = {"from_attributes": True}


class SprintBoardResponse(BaseModel):
    sprint: SprintResponse
    sections: list  # list of SectionResponse with tasks
    # Each section includes its tasks filtered to the sprint


class BurndownPoint(BaseModel):
    date: str  # ISO date string YYYY-MM-DD
    completed_points: int
    total_points: int


class VelocityPoint(BaseModel):
    sprint_id: uuid.UUID
    sprint_name: str
    completed_points: int
```

### Step 2: Create Sprint service

Create `backend/app/modules/pms/services/sprint.py`:

```python
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.modules.pms.models.sprint import Sprint
from app.modules.pms.models.task import Task
from app.modules.pms.models.project import Section
from app.modules.pms.schemas.sprint import SprintCreate, SprintUpdate


async def create_sprint(
    db: AsyncSession, project_id: uuid.UUID, data: SprintCreate, creator: User
) -> Sprint:
    sprint = Sprint(
        project_id=project_id,
        created_by_id=creator.id,
        **data.model_dump(),
    )
    db.add(sprint)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def list_sprints(
    db: AsyncSession, project_id: uuid.UUID, status_filter: str | None = None
) -> list[Sprint]:
    q = select(Sprint).where(
        Sprint.project_id == project_id, Sprint.deleted_at.is_(None)
    )
    if status_filter:
        q = q.where(Sprint.status == status_filter)
    q = q.order_by(Sprint.created_at.desc())
    result = await db.scalars(q)
    return list(result.all())


async def get_sprint(db: AsyncSession, sprint_id: uuid.UUID) -> Sprint:
    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found"
        )
    return sprint


async def update_sprint(
    db: AsyncSession, sprint_id: uuid.UUID, data: SprintUpdate
) -> Sprint:
    sprint = await get_sprint(db, sprint_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(sprint, field, value)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def delete_sprint(db: AsyncSession, sprint_id: uuid.UUID) -> None:
    sprint = await get_sprint(db, sprint_id)
    sprint.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def start_sprint(
    db: AsyncSession, project_id: uuid.UUID, sprint_id: uuid.UUID
) -> Sprint:
    sprint = await get_sprint(db, sprint_id)
    if sprint.status != "planning":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only planning sprints can be started",
        )
    # Check no other active sprint in this project
    active = await db.scalar(
        select(Sprint).where(
            Sprint.project_id == project_id,
            Sprint.status == "active",
            Sprint.deleted_at.is_(None),
        )
    )
    if active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another sprint is already active",
        )
    sprint.status = "active"
    if not sprint.start_date:
        sprint.start_date = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def complete_sprint(
    db: AsyncSession, sprint_id: uuid.UUID
) -> Sprint:
    sprint = await get_sprint(db, sprint_id)
    if sprint.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active sprints can be completed",
        )
    sprint.status = "completed"
    if not sprint.end_date:
        sprint.end_date = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def get_backlog_tasks(
    db: AsyncSession, project_id: uuid.UUID
) -> list[Task]:
    """Tasks in this project with no sprint assigned."""
    result = await db.scalars(
        select(Task)
        .where(
            Task.project_id == project_id,
            Task.sprint_id.is_(None),
            Task.deleted_at.is_(None),
            Task.parent_id.is_(None),
        )
        .options(selectinload(Task.assignee), selectinload(Task.subtasks))
        .order_by(Task.position)
    )
    return list(result.all())


async def get_sprint_board(
    db: AsyncSession, project_id: uuid.UUID, sprint_id: uuid.UUID
) -> dict:
    """Return sections with tasks filtered to sprint."""
    sprint = await get_sprint(db, sprint_id)
    sections = await db.scalars(
        select(Section)
        .where(Section.project_id == project_id, Section.deleted_at.is_(None))
        .order_by(Section.position)
    )
    section_list = list(sections.all())

    tasks = await db.scalars(
        select(Task)
        .where(
            Task.project_id == project_id,
            Task.sprint_id == sprint_id,
            Task.deleted_at.is_(None),
            Task.parent_id.is_(None),
        )
        .options(selectinload(Task.assignee), selectinload(Task.subtasks))
        .order_by(Task.position)
    )
    task_list = list(tasks.all())

    return {"sprint": sprint, "sections": section_list, "tasks": task_list}
```

**Note:** This file is ~130 lines. Analytics go in a separate service file.

### Step 3: Create Sprint analytics service

Create `backend/app/modules/pms/services/sprint_analytics.py`:

```python
import uuid
from datetime import timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.pms.models.sprint import Sprint
from app.modules.pms.models.task import Task


async def get_burndown_data(
    db: AsyncSession, project_id: uuid.UUID, sprint_id: uuid.UUID
) -> list[dict]:
    """Compute burndown: for each day of sprint, show completed vs total points."""
    sprint = await db.get(Sprint, sprint_id)
    if not sprint or not sprint.start_date:
        return []

    end = sprint.end_date or sprint.start_date + timedelta(days=14)

    # Total story points in sprint
    total_points = await db.scalar(
        select(func.coalesce(func.sum(Task.story_points), 0)).where(
            Task.project_id == project_id,
            Task.sprint_id == sprint_id,
            Task.deleted_at.is_(None),
        )
    ) or 0

    # Get completed tasks with their completed_at dates
    rows = await db.execute(
        select(
            func.date(Task.completed_at).label("completed_date"),
            func.coalesce(func.sum(Task.story_points), 0).label("points"),
        )
        .where(
            Task.sprint_id == sprint_id,
            Task.status == "completed",
            Task.completed_at.is_not(None),
            Task.deleted_at.is_(None),
        )
        .group_by(func.date(Task.completed_at))
        .order_by(func.date(Task.completed_at))
    )
    completed_by_date = {str(r.completed_date): int(r.points) for r in rows}

    # Build daily series
    result = []
    current = sprint.start_date.date()
    end_date = end.date()
    cumulative = 0
    while current <= end_date:
        cumulative += completed_by_date.get(str(current), 0)
        result.append({
            "date": str(current),
            "completed_points": cumulative,
            "total_points": total_points,
        })
        current += timedelta(days=1)

    return result


async def get_velocity_data(
    db: AsyncSession, project_id: uuid.UUID
) -> list[dict]:
    """Points completed per sprint (last 10 sprints)."""
    rows = await db.execute(
        select(
            Sprint.id,
            Sprint.name,
            func.coalesce(
                func.sum(
                    case(
                        (Task.status == "completed", Task.story_points),
                        else_=0,
                    )
                ),
                0,
            ).label("completed_points"),
        )
        .outerjoin(Task, (Task.sprint_id == Sprint.id) & Task.deleted_at.is_(None))
        .where(
            Sprint.project_id == project_id,
            Sprint.status == "completed",
            Sprint.deleted_at.is_(None),
        )
        .group_by(Sprint.id, Sprint.name, Sprint.end_date)
        .order_by(Sprint.end_date.desc())
        .limit(10)
    )
    return [
        {
            "sprint_id": str(r.id),
            "sprint_name": r.name,
            "completed_points": int(r.completed_points),
        }
        for r in rows
    ]
```

### Step 4: Create Sprint router

Create `backend/app/modules/pms/routers/sprints.py`:

```python
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.schemas.sprint import (
    BurndownPoint,
    SprintCreate,
    SprintResponse,
    SprintUpdate,
    VelocityPoint,
)
from app.modules.pms.schemas.task import TaskResponse
from app.modules.pms.services.sprint import (
    complete_sprint,
    create_sprint,
    delete_sprint,
    get_backlog_tasks,
    get_sprint,
    get_sprint_board,
    list_sprints,
    start_sprint,
    update_sprint,
)
from app.modules.pms.services.sprint_analytics import (
    get_burndown_data,
    get_velocity_data,
)

router = APIRouter(prefix="/projects/{project_id}", tags=["sprints"])


@router.post("/sprints", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
async def create(
    project_id: uuid.UUID,
    data: SprintCreate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await create_sprint(db, project_id, data, current_user)


@router.get("/sprints", response_model=list[SprintResponse])
async def list_(
    project_id: uuid.UUID,
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_sprints(db, project_id, status_filter)


@router.get("/sprints/{sprint_id}", response_model=SprintResponse)
async def get(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_sprint(db, sprint_id)


@router.patch("/sprints/{sprint_id}", response_model=SprintResponse)
async def update(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    data: SprintUpdate,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await update_sprint(db, sprint_id, data)


@router.delete("/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    await delete_sprint(db, sprint_id)


@router.post("/sprints/{sprint_id}/start", response_model=SprintResponse)
async def start(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await start_sprint(db, project_id, sprint_id)


@router.post("/sprints/{sprint_id}/complete", response_model=SprintResponse)
async def complete(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("editor")),
    db: AsyncSession = Depends(get_db),
):
    return await complete_sprint(db, sprint_id)


@router.get("/sprints/{sprint_id}/board")
async def board(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_sprint_board(db, project_id, sprint_id)


@router.get("/backlog", response_model=list[TaskResponse])
async def backlog(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_backlog_tasks(db, project_id)


@router.get("/sprints/{sprint_id}/burndown", response_model=list[BurndownPoint])
async def burndown(
    project_id: uuid.UUID,
    sprint_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_burndown_data(db, project_id, sprint_id)


@router.get("/velocity", response_model=list[VelocityPoint])
async def velocity(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await get_velocity_data(db, project_id)
```

**Note:** ~120 lines, well under limit.

### Step 5: Update task schemas with agile fields

In `backend/app/modules/pms/schemas/task.py`:

**TaskCreate** -- add after `custom_fields`:
```python
# Agile fields
story_points: int | None = None
task_type: str = "task"  # task/story/bug/epic
sprint_id: uuid.UUID | None = None
epic_id: uuid.UUID | None = None
```

**TaskUpdate** -- add after `custom_fields`:
```python
# Agile fields
story_points: int | None = None
task_type: str | None = None
sprint_id: uuid.UUID | None = None
epic_id: uuid.UUID | None = None
```

**TaskResponse** -- add after `custom_fields` (before assignee_name):
```python
# Agile fields
story_points: int | None = None
task_type: str = "task"
sprint_id: uuid.UUID | None = None
epic_id: uuid.UUID | None = None
```

**TaskResponse.extract_from_orm** -- add to the returned dict:
```python
"story_points": data.story_points,
"task_type": data.task_type,
"sprint_id": data.sprint_id,
"epic_id": data.epic_id,
```

### Step 6: Update section schemas with wip_limit

In `backend/app/modules/pms/schemas/project.py`:

**SectionCreate** -- add:
```python
wip_limit: int | None = None
```

**SectionUpdate** -- add:
```python
wip_limit: int | None = None
```

**SectionResponse** -- add:
```python
wip_limit: int | None = None
```

### Step 7: Register sprints router

In `backend/app/modules/pms/router.py`, add import and include:

```python
from app.modules.pms.routers import (
    ...
    sprints,
)

pms_router.include_router(sprints.router)
```

### Step 8: Verify

```bash
cd backend && python -c "from app.modules.pms.router import pms_router; print('OK')"
make dev-backend  # start and hit /docs to verify endpoints appear
```

## Todo List

- [x] Create `schemas/sprint.py`
- [x] Create `services/sprint.py`
- [x] Create `services/sprint_analytics.py`
- [x] Create `routers/sprints.py`
- [x] Update `schemas/task.py` with agile fields
- [x] Update `schemas/project.py` with wip_limit
- [x] Register sprints router in `router.py`
- [ ] Test endpoints via Swagger UI
- [ ] Verify backlog endpoint returns tasks without sprint
- [ ] Verify only one active sprint constraint works

## Success Criteria

- All 12 endpoints accessible via `/api/v1/pms/projects/{id}/...`
- Sprint lifecycle: planning -> start -> active -> complete -> completed
- Only one active sprint per project (409 conflict otherwise)
- Backlog returns tasks with sprint_id=NULL
- Burndown returns daily data series between sprint start/end
- Velocity returns points per completed sprint
- Existing task CRUD still works unchanged

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| SprintResponse needs computed fields (task_count, points) | Use model_validator or compute in service before returning |
| Sprint board endpoint may be slow with many tasks | Index on sprint_id already added in Phase 1 |
| Burndown accuracy with backdated completions | Accept: burndown uses completed_at date, which is set at completion time |

## Security Considerations

- All endpoints use `require_project_role()` dependency
- Sprint delete is soft delete (deleted_at)
- Sprint start checks for existing active sprint to prevent data corruption
