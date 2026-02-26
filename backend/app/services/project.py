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
