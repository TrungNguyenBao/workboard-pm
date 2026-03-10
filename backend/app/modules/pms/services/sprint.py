import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.modules.pms.models.project import Section
from app.modules.pms.models.sprint import Sprint
from app.modules.pms.models.task import Task
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


async def _get_sprint_stats(db: AsyncSession, sprint_id: uuid.UUID) -> dict:
    result = await db.execute(
        select(
            func.count(Task.id).label("task_count"),
            func.sum(
                case((Task.status == "completed", Task.story_points), else_=0)
            ).label("completed_points"),
            func.sum(Task.story_points).label("total_points"),
        ).where(Task.sprint_id == sprint_id, Task.deleted_at.is_(None))
    )
    row = result.one()
    return {
        "task_count": row.task_count or 0,
        "completed_points": int(row.completed_points or 0),
        "total_points": int(row.total_points or 0),
    }


async def list_sprints(
    db: AsyncSession, project_id: uuid.UUID, status_filter: str | None = None
) -> list[dict]:
    q = select(Sprint).where(
        Sprint.project_id == project_id, Sprint.deleted_at.is_(None)
    )
    if status_filter:
        q = q.where(Sprint.status == status_filter)
    q = q.order_by(Sprint.created_at.desc())
    result = await db.scalars(q)
    sprints = list(result.all())

    enriched = []
    for sprint in sprints:
        stats = await _get_sprint_stats(db, sprint.id)
        sprint_dict = {
            "id": sprint.id,
            "project_id": sprint.project_id,
            "name": sprint.name,
            "goal": sprint.goal,
            "start_date": sprint.start_date,
            "end_date": sprint.end_date,
            "status": sprint.status,
            "created_by_id": sprint.created_by_id,
            "created_at": sprint.created_at,
            "updated_at": sprint.updated_at,
            **stats,
        }
        enriched.append(sprint_dict)
    return enriched


async def get_sprint(
    db: AsyncSession,
    sprint_id: uuid.UUID,
    project_id: uuid.UUID | None = None,
) -> Sprint:
    result = await db.execute(
        select(Sprint).where(Sprint.id == sprint_id, Sprint.deleted_at.is_(None))
    )
    sprint = result.scalar_one_or_none()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found"
        )
    if project_id and sprint.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found"
        )
    return sprint


async def update_sprint(
    db: AsyncSession,
    sprint_id: uuid.UUID,
    data: SprintUpdate,
    project_id: uuid.UUID | None = None,
) -> Sprint:
    sprint = await get_sprint(db, sprint_id, project_id=project_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(sprint, field, value)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def delete_sprint(
    db: AsyncSession,
    sprint_id: uuid.UUID,
    project_id: uuid.UUID | None = None,
) -> None:
    sprint = await get_sprint(db, sprint_id, project_id=project_id)
    sprint.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def start_sprint(
    db: AsyncSession, project_id: uuid.UUID, sprint_id: uuid.UUID
) -> Sprint:
    sprint = await get_sprint(db, sprint_id, project_id=project_id)
    if sprint.status != "planning":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only planning sprints can be started",
        )
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
    db: AsyncSession,
    sprint_id: uuid.UUID,
    project_id: uuid.UUID | None = None,
    move_to_sprint_id: uuid.UUID | None = None,
) -> Sprint:
    sprint = await get_sprint(db, sprint_id, project_id=project_id)
    if sprint.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active sprints can be completed",
        )
    if move_to_sprint_id:
        target = await get_sprint(db, move_to_sprint_id, project_id=project_id)
        if target.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot move tasks to a completed sprint",
            )

    incomplete_tasks = await db.scalars(
        select(Task).where(
            Task.sprint_id == sprint_id,
            Task.status != "completed",
            Task.deleted_at.is_(None),
        )
    )
    for task in incomplete_tasks:
        task.sprint_id = move_to_sprint_id  # None = backlog

    sprint.status = "completed"
    if not sprint.end_date:
        sprint.end_date = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def get_backlog_tasks(
    db: AsyncSession, project_id: uuid.UUID
) -> list[Task]:
    """Tasks in this project with no sprint assigned (top-level only)."""
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
    """Return sprint + sections + tasks filtered to sprint."""
    sprint = await get_sprint(db, sprint_id, project_id=project_id)
    sections_result = await db.scalars(
        select(Section)
        .where(Section.project_id == project_id, Section.deleted_at.is_(None))
        .order_by(Section.position)
    )
    section_list = list(sections_result.all())

    tasks_result = await db.scalars(
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
    task_list = list(tasks_result.all())

    return {"sprint": sprint, "sections": section_list, "tasks": task_list}
