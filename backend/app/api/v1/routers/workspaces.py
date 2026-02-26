import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse, WorkspaceUpdate
from app.services.workspace import (
    create_workspace,
    get_user_workspaces,
    get_workspace,
    update_workspace,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


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
