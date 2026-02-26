import uuid
from typing import Callable

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.project import Project, ProjectMembership
from app.models.user import User
from app.models.workspace import WorkspaceMembership

WORKSPACE_ROLE_RANK = {"admin": 3, "member": 2, "guest": 1}
PROJECT_ROLE_RANK = {"owner": 4, "editor": 3, "commenter": 2, "viewer": 1}


async def _get_workspace_membership(
    workspace_id: uuid.UUID, user: User, db: AsyncSession
) -> WorkspaceMembership:
    membership = await db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user.id,
        )
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a workspace member")
    return membership


def require_workspace_role(min_role: str = "member") -> Callable:
    async def dep(
        workspace_id: uuid.UUID = Path(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        membership = await _get_workspace_membership(workspace_id, current_user, db)
        if WORKSPACE_ROLE_RANK.get(membership.role, 0) < WORKSPACE_ROLE_RANK.get(min_role, 0):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return current_user

    return dep


def require_project_role(min_role: str = "viewer") -> Callable:
    async def dep(
        project_id: uuid.UUID = Path(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        project = await db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        # Check workspace membership first
        ws_membership = await db.scalar(
            select(WorkspaceMembership).where(
                WorkspaceMembership.workspace_id == project.workspace_id,
                WorkspaceMembership.user_id == current_user.id,
            )
        )
        if not ws_membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a workspace member")

        # Workspace admins bypass project role checks
        if ws_membership.role == "admin":
            return current_user

        # Check project-level membership
        proj_membership = await db.scalar(
            select(ProjectMembership).where(
                ProjectMembership.project_id == project_id,
                ProjectMembership.user_id == current_user.id,
            )
        )
        if not proj_membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

        if PROJECT_ROLE_RANK.get(proj_membership.role, 0) < PROJECT_ROLE_RANK.get(min_role, 0):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")

        return current_user

    return dep
