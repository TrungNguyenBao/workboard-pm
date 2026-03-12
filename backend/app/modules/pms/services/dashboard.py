import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.pms.models.project import Project, ProjectMembership
from app.modules.pms.models.sprint import Sprint
from app.modules.pms.models.task import Task


async def get_dashboard_stats(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
) -> dict:
    """Cross-project aggregation for the PMS dashboard.

    Only includes projects the requesting user has membership in.
    """
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Base filter: tasks in workspace projects that the user is a member of
    user_project_ids_subq = (
        select(ProjectMembership.project_id)
        .where(ProjectMembership.user_id == user_id)
        .scalar_subquery()
    )

    base_task_filter = (
        Task.project_id.in_(user_project_ids_subq),
        Task.deleted_at.is_(None),
        Task.parent_id.is_(None),
    )

    async with db.begin_nested():
        # --- Global task totals ---
        totals_row = await db.execute(
            select(
                func.count(Task.id).label("total"),
                func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
                func.sum(
                    case(
                        ((Task.due_date < now) & (Task.status != "completed"), 1),
                        else_=0,
                    )
                ).label("overdue"),
                func.sum(
                    case(
                        (
                            (Task.status == "completed") & (Task.completed_at >= week_ago),
                            1,
                        ),
                        else_=0,
                    )
                ).label("completed_this_week"),
            ).where(*base_task_filter)
        )
        t = totals_row.one()

        # --- Active sprints count ---
        active_sprints_row = await db.execute(
            select(func.count(Sprint.id)).where(
                Sprint.project_id.in_(user_project_ids_subq),
                Sprint.status == "active",
                Sprint.deleted_at.is_(None),
            )
        )
        active_sprints = active_sprints_row.scalar() or 0

        # --- Per-project breakdown ---
        project_rows = await db.execute(
            select(
                Project.name.label("project_name"),
                Project.color.label("project_color"),
                func.count(Task.id).label("total"),
                func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
            )
            .join(ProjectMembership, ProjectMembership.project_id == Project.id)
            .outerjoin(
                Task,
                (Task.project_id == Project.id)
                & Task.deleted_at.is_(None)
                & Task.parent_id.is_(None),
            )
            .where(
                Project.workspace_id == workspace_id,
                ProjectMembership.user_id == user_id,
                Project.deleted_at.is_(None),
            )
            .group_by(Project.id, Project.name, Project.color)
            .order_by(func.count(Task.id).desc())
        )
        by_project = [
            {
                "project_name": r.project_name,
                "project_color": r.project_color,
                "total": r.total or 0,
                "completed": int(r.completed or 0),
            }
            for r in project_rows
        ]

        # --- By priority ---
        prio_rows = await db.execute(
            select(Task.priority, func.count(Task.id).label("cnt"))
            .where(*base_task_filter)
            .group_by(Task.priority)
        )
        by_priority_raw = {(r.priority or "none"): r.cnt for r in prio_rows}
        by_priority = {
            "high": by_priority_raw.get("high", 0),
            "medium": by_priority_raw.get("medium", 0),
            "low": by_priority_raw.get("low", 0),
            "none": by_priority_raw.get("none", 0),
        }

    return {
        "total_tasks": t.total or 0,
        "completed_tasks": int(t.completed or 0),
        "overdue_tasks": int(t.overdue or 0),
        "active_sprints": active_sprints,
        "tasks_completed_this_week": int(t.completed_this_week or 0),
        "by_project": by_project,
        "by_priority": by_priority,
    }
