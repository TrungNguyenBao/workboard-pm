import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, ProjectMembership, Section
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, SectionCreate, SectionUpdate


async def create_project(
    db: AsyncSession, workspace_id: uuid.UUID, data: ProjectCreate, owner: User
) -> Project:
    project = Project(
        workspace_id=workspace_id,
        owner_id=owner.id,
        **data.model_dump(),
    )
    db.add(project)
    await db.flush()

    membership = ProjectMembership(
        project_id=project.id, user_id=owner.id, role="owner"
    )
    db.add(membership)

    # Default sections: To Do, In Progress, Done
    for i, name in enumerate(["To Do", "In Progress", "Done"]):
        db.add(Section(project_id=project.id, name=name, position=float((i + 1) * 65536)))

    await db.commit()
    await db.refresh(project)
    return project


async def list_projects(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID
) -> list[Project]:
    result = await db.scalars(
        select(Project)
        .join(ProjectMembership, ProjectMembership.project_id == Project.id)
        .where(
            Project.workspace_id == workspace_id,
            ProjectMembership.user_id == user_id,
            Project.deleted_at.is_(None),
        )
    )
    return list(result.all())


async def get_project(db: AsyncSession, project_id: uuid.UUID) -> Project:
    project = await db.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def update_project(
    db: AsyncSession, project_id: uuid.UUID, data: ProjectUpdate
) -> Project:
    project = await get_project(db, project_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project_id: uuid.UUID) -> None:
    from datetime import datetime, timezone
    project = await get_project(db, project_id)
    project.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def list_sections(db: AsyncSession, project_id: uuid.UUID) -> list[Section]:
    result = await db.scalars(
        select(Section)
        .where(Section.project_id == project_id, Section.deleted_at.is_(None))
        .order_by(Section.position)
    )
    return list(result.all())


async def create_section(
    db: AsyncSession, project_id: uuid.UUID, data: SectionCreate
) -> Section:
    if data.position is None:
        # Get max position + 65536
        sections = await list_sections(db, project_id)
        position = (max((s.position for s in sections), default=0.0) + 65536.0)
    else:
        position = data.position

    section = Section(project_id=project_id, name=data.name, color=data.color, position=position)
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


async def update_section(
    db: AsyncSession, section_id: uuid.UUID, data: SectionUpdate
) -> Section:
    section = await db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(section, field, value)
    await db.commit()
    await db.refresh(section)
    return section


async def delete_section(db: AsyncSession, section_id: uuid.UUID) -> None:
    section = await db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    await db.delete(section)
    await db.commit()


async def get_project_stats(db: AsyncSession, project_id: uuid.UUID) -> dict:
    from datetime import datetime, timezone

    from sqlalchemy import case, func

    from app.models.task import Task
    from app.models.user import User

    now = datetime.now(timezone.utc)

    # Use consistent snapshot — all queries share a single transaction
    async with db.begin_nested():
        # Per-section stats
        sec_rows = await db.execute(
            select(
                Section.name,
                func.count(Task.id).label("total"),
                func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
            )
            .outerjoin(
                Task,
                (Task.section_id == Section.id)
                & Task.deleted_at.is_(None)
                & Task.parent_id.is_(None),
            )
            .where(Section.project_id == project_id)
            .group_by(Section.id, Section.name, Section.position)
            .order_by(Section.position)
        )
        by_section = [
            {"section_name": r.name, "total": r.total or 0, "completed": int(r.completed or 0)}
            for r in sec_rows
        ]

        # Totals + overdue
        totals = await db.execute(
            select(
                func.count(Task.id).label("total"),
                func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
                func.sum(
                    case(((Task.due_date < now) & (Task.status != "completed"), 1), else_=0)
                ).label("overdue"),
            ).where(
                Task.project_id == project_id,
                Task.deleted_at.is_(None),
                Task.parent_id.is_(None),
            )
        )
        t = totals.one()

        # By assignee
        asgn_rows = await db.execute(
            select(
                User.name,
                func.count(Task.id).label("total"),
                func.sum(case((Task.status == "completed", 1), else_=0)).label("completed"),
            )
            .join(User, User.id == Task.assignee_id)
            .where(
                Task.project_id == project_id,
                Task.deleted_at.is_(None),
                Task.parent_id.is_(None),
                Task.assignee_id.is_not(None),
            )
            .group_by(User.id, User.name)
            .order_by(func.count(Task.id).desc())
            .limit(10)
        )
        by_assignee = [
            {"assignee_name": r.name, "total": r.total, "completed": int(r.completed or 0)}
            for r in asgn_rows
        ]

        # By priority — map NULL to "none" for frontend compatibility
        prio_rows = await db.execute(
            select(Task.priority, func.count(Task.id).label("cnt"))
            .where(
                Task.project_id == project_id,
                Task.deleted_at.is_(None),
                Task.parent_id.is_(None),
            )
            .group_by(Task.priority)
        )
        by_priority = {(r.priority or "none"): r.cnt for r in prio_rows}

    total = t.total or 0
    completed = int(t.completed or 0)
    return {
        "total_tasks": total,
        "completed": completed,
        "incomplete": total - completed,
        "overdue": int(t.overdue or 0),
        "by_section": by_section,
        "by_assignee": by_assignee,
        "by_priority": by_priority,
    }
