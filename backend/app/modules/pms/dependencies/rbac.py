import uuid
from typing import Callable

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceMembership
from app.modules.pms.models.project import Project, ProjectMembership

PROJECT_ROLE_RANK = {"owner": 4, "editor": 3, "commenter": 2, "viewer": 1}


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
