import uuid
from datetime import timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.pms.models.sprint import Sprint
from app.modules.pms.models.task import Task


async def get_burndown_data(
    db: AsyncSession, project_id: uuid.UUID, sprint_id: uuid.UUID
) -> list[dict]:
    """Compute burndown: for each day of sprint, show cumulative completed vs total points."""
    sprint = await db.get(Sprint, sprint_id)
    if not sprint or not sprint.start_date:
        return []

    end = sprint.end_date or (sprint.start_date + timedelta(days=14))

    total_points = await db.scalar(
        select(func.coalesce(func.sum(Task.story_points), 0)).where(
            Task.project_id == project_id,
            Task.sprint_id == sprint_id,
            Task.deleted_at.is_(None),
        )
    ) or 0

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

    result = []
    current = sprint.start_date.date()
    end_date = end.date()
    cumulative = 0
    while current <= end_date:
        cumulative += completed_by_date.get(str(current), 0)
        result.append(
            {
                "date": str(current),
                "completed_points": cumulative,
                "total_points": int(total_points),
            }
        )
        current += timedelta(days=1)

    return result


async def get_velocity_data(
    db: AsyncSession, project_id: uuid.UUID
) -> list[dict]:
    """Points completed per sprint (last 10 completed sprints)."""
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
