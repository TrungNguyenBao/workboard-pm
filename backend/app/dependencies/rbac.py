import uuid
from typing import Callable

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceMembership

WORKSPACE_ROLE_RANK = {"admin": 3, "member": 2, "guest": 1}


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
