import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.task import Task, TaskFollower, TaskTag
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.activity_log import create_activity
from app.services.recurring_tasks import validate_recurrence


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


async def _get_workspace_id(db: AsyncSession, project_id: uuid.UUID) -> uuid.UUID | None:
    row = await db.execute(select(Project.workspace_id).where(Project.id == project_id))
    return row.scalar_one_or_none()


async def create_task(
    db: AsyncSession, project_id: uuid.UUID, data: TaskCreate, creator: User
) -> Task:
    validate_recurrence(data)
    position = data.position
    if position is None:
        position = await _next_position(db, project_id, data.section_id)

    if data.custom_fields is not None:
        from app.services.custom_field import validate_custom_fields
        await validate_custom_fields(db, project_id, data.custom_fields)

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

    workspace_id = await _get_workspace_id(db, project_id)
    if workspace_id:
        await create_activity(
            db,
            workspace_id=workspace_id,
            project_id=project_id,
            entity_type="task",
            entity_id=task.id,
            actor_id=creator.id,
            action="created",
        )

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


async def update_task(
    db: AsyncSession, task_id: uuid.UUID, data: TaskUpdate, actor_id: uuid.UUID | None = None
) -> Task:
    validate_recurrence(data)
    task = await get_task(db, task_id)

    if data.custom_fields is not None:
        from app.services.custom_field import validate_custom_fields
        await validate_custom_fields(db, task.project_id, data.custom_fields)
        # Merge with existing rather than replace entirely
        merged = dict(task.custom_fields or {})
        merged.update(data.custom_fields)
        data = data.model_copy(update={"custom_fields": merged})

    updates = data.model_dump(exclude_none=True)

    old_assignee_id = task.assignee_id

    # Track field changes for activity log
    tracked_fields = {"status", "assignee_id", "priority", "start_date", "due_date", "title"}
    changes_list = []
    for field in tracked_fields:
        if field in updates:
            old_val = getattr(task, field)
            new_val = updates[field]
            if str(old_val) != str(new_val):
                changes_list.append({"field": field, "old": str(old_val) if old_val else None, "new": str(new_val)})

    if "status" in updates and updates["status"] == "completed":
        if task.recurrence_rule and not task.parent_recurring_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot complete a recurring template task",
            )
        if not task.completed_at:
            task.completed_at = datetime.now(timezone.utc)
    elif "status" in updates and updates["status"] == "incomplete":
        task.completed_at = None

    for field, value in updates.items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    # Notify new assignee if changed
    new_assignee_id = updates.get("assignee_id")
    workspace_id = await _get_workspace_id(db, task.project_id)
    if new_assignee_id and new_assignee_id != old_assignee_id:
        from app.services.notifications import create_notification
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

    # Emit activity
    if workspace_id and actor_id and changes_list:
        action = "completed" if updates.get("status") == "completed" else "updated"
        await create_activity(
            db,
            workspace_id=workspace_id,
            project_id=task.project_id,
            entity_type="task",
            entity_id=task_id,
            actor_id=actor_id,
            action=action,
            changes=changes_list[0] if len(changes_list) == 1 else {"fields": changes_list},
        )

    return task


async def delete_task(
    db: AsyncSession, task_id: uuid.UUID, actor_id: uuid.UUID | None = None
) -> None:
    task = await get_task(db, task_id)
    task.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    if actor_id:
        workspace_id = await _get_workspace_id(db, task.project_id)
        if workspace_id:
            await create_activity(
                db,
                workspace_id=workspace_id,
                project_id=task.project_id,
                entity_type="task",
                entity_id=task_id,
                actor_id=actor_id,
                action="deleted",
            )


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
