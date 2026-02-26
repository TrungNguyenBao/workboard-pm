import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.task import TaskResponse
from app.schemas.workspace import (
    InviteMemberRequest,
    MemberRoleUpdate,
    MemberWithUserResponse,
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.services.workspace import (
    create_workspace,
    get_my_tasks,
    get_user_workspaces,
    get_workspace,
    get_workspace_members,
    invite_member,
    remove_member,
    setup_demo_workspace,
    update_member_role,
    update_workspace,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("/setup-demo", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def setup_demo(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Seed a demo workspace for a new user"""
    return await setup_demo_workspace(db, current_user)


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_workspace(db, data, current_user)


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_user_workspaces(db, current_user)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_workspace(db, workspace_id)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update(
    workspace_id: uuid.UUID,
    data: WorkspaceUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_workspace(db, workspace_id, data)


@router.get("/{workspace_id}/tasks/my", response_model=list[TaskResponse])
async def my_tasks(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_my_tasks(db, workspace_id, current_user.id)


@router.get("/{workspace_id}/members", response_model=list[MemberWithUserResponse])
async def list_members(
    workspace_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_workspace_members(db, workspace_id)


@router.post(
    "/{workspace_id}/members",
    response_model=MemberWithUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_member(
    workspace_id: uuid.UUID,
    data: InviteMemberRequest,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await invite_member(db, workspace_id, data.email, data.role)


@router.patch("/{workspace_id}/members/{membership_id}", response_model=MemberWithUserResponse)
async def update_member(
    workspace_id: uuid.UUID,
    membership_id: uuid.UUID,
    data: MemberRoleUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_member_role(db, workspace_id, membership_id, data.role)


@router.delete("/{workspace_id}/members/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    workspace_id: uuid.UUID,
    membership_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await remove_member(db, workspace_id, membership_id, current_user.id)
