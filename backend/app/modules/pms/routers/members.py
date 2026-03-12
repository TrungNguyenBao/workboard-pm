import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.modules.pms.dependencies.rbac import require_project_role
from app.modules.pms.schemas.member import MemberAdd, MemberResponse, MemberUpdate
from app.modules.pms.services.member import (
    add_member,
    list_members,
    remove_member,
    update_member_role,
)

router = APIRouter(tags=["members"])


@router.get("/projects/{project_id}/members", response_model=list[MemberResponse])
async def list_(
    project_id: uuid.UUID,
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    members = await list_members(db, project_id)
    return [
        MemberResponse(
            id=m.id,
            project_id=m.project_id,
            user_id=m.user_id,
            user_name=m.user.name,
            user_email=m.user.email,
            role=m.role,
        )
        for m in members
    ]


@router.post(
    "/projects/{project_id}/members",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add(
    project_id: uuid.UUID,
    data: MemberAdd,
    current_user: User = Depends(require_project_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    m = await add_member(db, project_id, data, current_user)
    return MemberResponse(
        id=m.id,
        project_id=m.project_id,
        user_id=m.user_id,
        user_name=m.user.name,
        user_email=m.user.email,
        role=m.role,
    )


@router.patch("/projects/{project_id}/members/{user_id}", response_model=MemberResponse)
async def update_role(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    data: MemberUpdate,
    current_user: User = Depends(require_project_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    m = await update_member_role(db, project_id, user_id, data, current_user)
    return MemberResponse(
        id=m.id,
        project_id=m.project_id,
        user_id=m.user_id,
        user_name=m.user.name,
        user_email=m.user.email,
        role=m.role,
    )


@router.delete(
    "/projects/{project_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(require_project_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    await remove_member(db, project_id, user_id, current_user)
