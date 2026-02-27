import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.goal import Goal, GoalProjectLink, GoalTaskLink
from app.models.task import Task
from app.schemas.goal import GoalCreate, GoalUpdate


async def _verify_goal_workspace(goal: Goal, workspace_id: uuid.UUID) -> None:
    """Ensure goal belongs to the given workspace."""
    if goal.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")


async def create_goal(
    db: AsyncSession, workspace_id: uuid.UUID, data: GoalCreate
) -> Goal:
    goal = Goal(
        workspace_id=workspace_id,
        **data.model_dump(),
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


async def list_goals(db: AsyncSession, workspace_id: uuid.UUID) -> list[Goal]:
    result = await db.scalars(
        select(Goal)
        .where(Goal.workspace_id == workspace_id, Goal.deleted_at.is_(None))
        .options(
            selectinload(Goal.owner),
            selectinload(Goal.project_links),
            selectinload(Goal.task_links),
        )
        .order_by(Goal.created_at.desc())
    )
    return list(result.all())


async def get_goal(db: AsyncSession, goal_id: uuid.UUID) -> Goal:
    goal = await db.scalar(
        select(Goal)
        .where(Goal.id == goal_id, Goal.deleted_at.is_(None))
        .options(
            selectinload(Goal.owner),
            selectinload(Goal.project_links),
            selectinload(Goal.task_links),
        )
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal


async def update_goal(
    db: AsyncSession, goal_id: uuid.UUID, data: GoalUpdate
) -> Goal:
    goal = await get_goal(db, goal_id)
    updates = data.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(goal, field, value)
    # Auto-recalculate progress if method is "auto"
    if goal.calculation_method == "auto":
        goal.progress_value = await calculate_auto_progress(db, goal_id)
    await db.commit()
    await db.refresh(goal)
    return await get_goal(db, goal_id)


async def delete_goal(db: AsyncSession, goal_id: uuid.UUID) -> None:
    goal = await get_goal(db, goal_id)
    goal.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def link_project(
    db: AsyncSession, goal_id: uuid.UUID, project_id: uuid.UUID
) -> None:
    existing = await db.scalar(
        select(GoalProjectLink).where(
            GoalProjectLink.goal_id == goal_id,
            GoalProjectLink.project_id == project_id,
        )
    )
    if not existing:
        db.add(GoalProjectLink(
            goal_id=goal_id,
            project_id=project_id,
            created_at=datetime.now(timezone.utc),
        ))
        await db.commit()


async def unlink_project(
    db: AsyncSession, goal_id: uuid.UUID, project_id: uuid.UUID
) -> None:
    link = await db.scalar(
        select(GoalProjectLink).where(
            GoalProjectLink.goal_id == goal_id,
            GoalProjectLink.project_id == project_id,
        )
    )
    if link:
        await db.delete(link)
        await db.commit()


async def link_task(
    db: AsyncSession, goal_id: uuid.UUID, task_id: uuid.UUID
) -> None:
    existing = await db.scalar(
        select(GoalTaskLink).where(
            GoalTaskLink.goal_id == goal_id,
            GoalTaskLink.task_id == task_id,
        )
    )
    if not existing:
        db.add(GoalTaskLink(
            goal_id=goal_id,
            task_id=task_id,
            created_at=datetime.now(timezone.utc),
        ))
        await db.commit()


async def unlink_task(
    db: AsyncSession, goal_id: uuid.UUID, task_id: uuid.UUID
) -> None:
    link = await db.scalar(
        select(GoalTaskLink).where(
            GoalTaskLink.goal_id == goal_id,
            GoalTaskLink.task_id == task_id,
        )
    )
    if link:
        await db.delete(link)
        await db.commit()


async def calculate_auto_progress(
    db: AsyncSession, goal_id: uuid.UUID
) -> float:
    total = await db.scalar(
        select(func.count()).where(GoalTaskLink.goal_id == goal_id)
    )
    if not total:
        return 0.0
    completed = await db.scalar(
        select(func.count())
        .select_from(GoalTaskLink)
        .join(Task, Task.id == GoalTaskLink.task_id)
        .where(
            GoalTaskLink.goal_id == goal_id,
            Task.status == "completed",
            Task.deleted_at.is_(None),
        )
    )
    return round((completed / total) * 100, 1)
