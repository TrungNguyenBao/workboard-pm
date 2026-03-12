import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.modules.pms.models.project import Project, ProjectMembership
from app.modules.pms.schemas.member import MemberAdd, MemberUpdate
from app.modules.pms.services.activity_log import create_activity


async def list_members(
    db: AsyncSession, project_id: uuid.UUID
) -> list[ProjectMembership]:
    result = await db.scalars(
        select(ProjectMembership)
        .options(selectinload(ProjectMembership.user))
        .where(ProjectMembership.project_id == project_id)
        .order_by(ProjectMembership.created_at)
    )
    return list(result.all())


async def add_member(
    db: AsyncSession, project_id: uuid.UUID, data: MemberAdd, actor: User
) -> ProjectMembership:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    ws_member = await db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == project.workspace_id,
            WorkspaceMembership.user_id == data.user_id,
        )
    )
    if not ws_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this workspace",
        )

    existing = await db.scalar(
        select(ProjectMembership).where(
            ProjectMembership.project_id == project_id,
            ProjectMembership.user_id == data.user_id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a project member",
        )

    membership = ProjectMembership(
        project_id=project_id,
        user_id=data.user_id,
        role=data.role,
    )
    db.add(membership)
    await db.flush()
    await db.refresh(membership)

    await create_activity(
        db,
        workspace_id=project.workspace_id,
        project_id=project_id,
        entity_type="project_membership",
        entity_id=membership.id,
        actor_id=actor.id,
        action="member_added",
        changes={"user_id": str(data.user_id), "role": data.role},
    )

    await db.refresh(membership, ["user"])
    return membership


async def update_member_role(
    db: AsyncSession,
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    data: MemberUpdate,
    actor: User,
) -> ProjectMembership:
    membership = await db.scalar(
        select(ProjectMembership)
        .options(selectinload(ProjectMembership.user))
        .where(
            ProjectMembership.project_id == project_id,
            ProjectMembership.user_id == user_id,
        )
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    old_role = membership.role

    # Prevent demoting the last owner
    if old_role == "owner" and data.role != "owner":
        owners = await db.scalars(
            select(ProjectMembership).where(
                ProjectMembership.project_id == project_id,
                ProjectMembership.role == "owner",
            )
        )
        if len(list(owners.all())) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last owner of the project",
            )

    membership.role = data.role
    await db.flush()

    project = await db.get(Project, project_id)
    await create_activity(
        db,
        workspace_id=project.workspace_id,
        project_id=project_id,
        entity_type="project_membership",
        entity_id=membership.id,
        actor_id=actor.id,
        action="member_role_updated",
        changes={"old_role": old_role, "new_role": data.role},
    )

    return membership


async def remove_member(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, actor: User
) -> None:
    membership = await db.scalar(
        select(ProjectMembership).where(
            ProjectMembership.project_id == project_id,
            ProjectMembership.user_id == user_id,
        )
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if membership.role == "owner":
        owners = await db.scalars(
            select(ProjectMembership).where(
                ProjectMembership.project_id == project_id,
                ProjectMembership.role == "owner",
            )
        )
        if len(list(owners.all())) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last owner of the project",
            )

    project = await db.get(Project, project_id)
    membership_id = membership.id
    await db.delete(membership)

    await create_activity(
        db,
        workspace_id=project.workspace_id,
        project_id=project_id,
        entity_type="project_membership",
        entity_id=membership_id,
        actor_id=actor.id,
        action="member_removed",
        changes={"user_id": str(user_id)},
    )
