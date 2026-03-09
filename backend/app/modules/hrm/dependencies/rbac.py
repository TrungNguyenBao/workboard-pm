import uuid
from typing import Callable

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceMembership

HRM_ROLE_RANK = {"line_manager": 1, "hr_manager": 2, "hr_admin": 3, "ceo": 4}


async def _get_hrm_membership(
    workspace_id: uuid.UUID, user: User, db: AsyncSession
) -> WorkspaceMembership:
    membership = await db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user.id,
        )
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a workspace member",
        )
    return membership


def require_hrm_role(min_role: str) -> Callable:
    """Require HRM-specific role. Workspace admins bypass the HRM role check."""

    async def dep(
        workspace_id: uuid.UUID = Path(...),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        membership = await _get_hrm_membership(workspace_id, current_user, db)
        if membership.role == "admin":
            return current_user
        user_rank = HRM_ROLE_RANK.get(membership.hrm_role or "", 0)
        if user_rank < HRM_ROLE_RANK.get(min_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires HRM role: {min_role} or higher",
            )
        return current_user

    return dep
