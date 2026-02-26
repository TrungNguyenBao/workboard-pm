import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workspace import Workspace, WorkspaceMembership
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


async def create_workspace(db: AsyncSession, data: WorkspaceCreate, owner: User) -> Workspace:
    existing = await db.scalar(select(Workspace).where(Workspace.slug == data.slug))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already taken")

    workspace = Workspace(name=data.name, slug=data.slug, owner_id=owner.id)
    db.add(workspace)
    await db.flush()

    membership = WorkspaceMembership(
        workspace_id=workspace.id, user_id=owner.id, role="admin"
    )
    db.add(membership)
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def get_user_workspaces(db: AsyncSession, user: User) -> list[Workspace]:
    result = await db.scalars(
        select(Workspace)
        .join(WorkspaceMembership, WorkspaceMembership.workspace_id == Workspace.id)
        .where(WorkspaceMembership.user_id == user.id)
    )
    return list(result.all())


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID) -> Workspace:
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws


async def update_workspace(
    db: AsyncSession, workspace_id: uuid.UUID, data: WorkspaceUpdate
) -> Workspace:
    ws = await get_workspace(db, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ws, field, value)
    await db.commit()
    await db.refresh(ws)
    return ws
