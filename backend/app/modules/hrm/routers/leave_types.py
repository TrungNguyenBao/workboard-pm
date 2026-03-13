import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.leave_type import LeaveTypeCreate, LeaveTypeResponse, LeaveTypeUpdate
from app.modules.hrm.services.leave_type import (
    create_leave_type,
    delete_leave_type,
    list_leave_types,
    update_leave_type,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/leave-types",
    response_model=LeaveTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: LeaveTypeCreate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await create_leave_type(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/leave-types",
    response_model=PaginatedResponse[LeaveTypeResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_leave_types(db, workspace_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.patch(
    "/workspaces/{workspace_id}/leave-types/{leave_type_id}",
    response_model=LeaveTypeResponse,
)
async def update(
    workspace_id: uuid.UUID,
    leave_type_id: uuid.UUID,
    data: LeaveTypeUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_leave_type(db, leave_type_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/leave-types/{leave_type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    leave_type_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_leave_type(db, leave_type_id, workspace_id)
