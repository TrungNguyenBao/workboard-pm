import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task import Task, TaskFollower, TaskTag
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


async def _next_position(db: AsyncSession, project_id: uuid.UUID, section_id: uuid.UUID | None) -> float:
    if section_id:
        result = await db.scalar(
            select(func.max(Task.position)).where(
                Task.section_id == section_id, Task.deleted_at.is_(None)
            )
        )
    else:
        result = await db.scalar(
            select(func.max(Task.position)).where(
                Task.project_id == project_id, Task.section_id.is_(None), Task.deleted_at.is_(None)
            )
        )
    return (result or 0.0) + 65536.0


async def create_task(
    db: AsyncSession, project_id: uuid.UUID, data: TaskCreate, creator: User
) -> Task:
    position = data.position
    if position is None:
        position = await _next_position(db, project_id, data.section_id)

    task = Task(
        project_id=project_id,
        created_by_id=creator.id,
        position=position,
        **data.model_dump(exclude={"position"}),
    )
    db.add(task)
    await db.flush()  # ensure task.id is populated before creating follower
    # Auto-follow creator
    db.add(TaskFollower(task_id=task.id, user_id=creator.id))
    await db.commit()
    await db.refresh(task)
    return task


async def list_tasks(
    db: AsyncSession,
    project_id: uuid.UUID,
    section_id: uuid.UUID | None = None,
    include_subtasks: bool = False,
) -> list[Task]:
    q = (
        select(Task)
        .where(Task.project_id == project_id, Task.deleted_at.is_(None))
        .options(
            selectinload(Task.assignee),
            selectinload(Task.subtasks),
        )
    )
    if section_id is not None:
        q = q.where(Task.section_id == section_id)
    if not include_subtasks:
        q = q.where(Task.parent_id.is_(None))
    q = q.order_by(Task.position)
    result = await db.scalars(q)
    return list(result.all())


async def get_task(db: AsyncSession, task_id: uuid.UUID) -> Task:
    task = await db.get(Task, task_id, options=[selectinload(Task.tags).selectinload(TaskTag.tag)])
    if not task or task.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


async def update_task(db: AsyncSession, task_id: uuid.UUID, data: TaskUpdate) -> Task:
    task = await get_task(db, task_id)
    updates = data.model_dump(exclude_none=True)

    old_assignee_id = task.assignee_id

    if "status" in updates and updates["status"] == "completed" and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)
    elif "status" in updates and updates["status"] == "incomplete":
        task.completed_at = None

    for field, value in updates.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    # Notify new assignee if changed
    new_assignee_id = updates.get("assignee_id")
    if new_assignee_id and new_assignee_id != old_assignee_id:
        from app.models.project import Project
        from app.services.notifications import create_notification
        ws_row = await db.execute(
            select(Project.workspace_id).where(Project.id == task.project_id)
        )
        workspace_id = ws_row.scalar_one_or_none()
        await create_notification(
            db,
            user_id=new_assignee_id,
            actor_id=None,
            type="assigned",
            title=f"You were assigned to: {task.title}",
            resource_type="task",
            resource_id=task_id,
            workspace_id=workspace_id,
        )

    return task


async def delete_task(db: AsyncSession, task_id: uuid.UUID) -> None:
    task = await get_task(db, task_id)
    task.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def move_task(
    db: AsyncSession, task_id: uuid.UUID, section_id: uuid.UUID | None, position: float
) -> Task:
    task = await get_task(db, task_id)
    task.section_id = section_id
    task.position = position
    await db.commit()
    await db.refresh(task)
    return task


async def add_tag(db: AsyncSession, task_id: uuid.UUID, tag_id: uuid.UUID) -> None:
    existing = await db.scalar(
        select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id)
    )
    if not existing:
        db.add(TaskTag(task_id=task_id, tag_id=tag_id))
        await db.commit()


async def remove_tag(db: AsyncSession, task_id: uuid.UUID, tag_id: uuid.UUID) -> None:
    tt = await db.scalar(
        select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id)
    )
    if tt:
        await db.delete(tt)
        await db.commit()


async def add_follower(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> None:
    existing = await db.scalar(
        select(TaskFollower).where(TaskFollower.task_id == task_id, TaskFollower.user_id == user_id)
    )
    if not existing:
        db.add(TaskFollower(task_id=task_id, user_id=user_id))
        await db.commit()


async def remove_follower(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> None:
    tf = await db.scalar(
        select(TaskFollower).where(TaskFollower.task_id == task_id, TaskFollower.user_id == user_id)
    )
    if tf:
        await db.delete(tf)
        await db.commit()


async def search_tasks(
    db: AsyncSession, project_id: uuid.UUID, query: str, limit: int = 20
) -> list[Task]:
    result = await db.scalars(
        select(Task).where(
            Task.project_id == project_id,
            Task.deleted_at.is_(None),
            Task.search_vector.op("@@")(func.plainto_tsquery("english", query)),
        )
        .order_by(
            func.ts_rank(Task.search_vector, func.plainto_tsquery("english", query)).desc()
        )
        .limit(limit)
    )
    return list(result.all())
