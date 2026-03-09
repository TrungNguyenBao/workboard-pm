import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.schemas.overtime_request import (
    OvertimeRequestCreate,
    OvertimeRequestResponse,
)
from app.modules.hrm.services.overtime_request import (
    approve_overtime_request,
    create_overtime_request,
    delete_overtime_request,
    get_overtime_request,
    list_overtime_requests,
    reject_overtime_request,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/overtime-requests",
    response_model=OvertimeRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: OvertimeRequestCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_overtime_request(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/overtime-requests",
    response_model=PaginatedResponse[OvertimeRequestResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    ot_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_overtime_requests(db, workspace_id, employee_id, ot_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/overtime-requests/{ot_id}",
    response_model=OvertimeRequestResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    ot_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await get_overtime_request(db, ot_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/overtime-requests/{ot_id}/approve",
    response_model=OvertimeRequestResponse,
)
async def approve(
    workspace_id: uuid.UUID,
    ot_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("line_manager")),
    db: AsyncSession = Depends(get_db),
):
    return await approve_overtime_request(db, ot_id, workspace_id, current_user.id)


@router.post(
    "/workspaces/{workspace_id}/overtime-requests/{ot_id}/reject",
    response_model=OvertimeRequestResponse,
)
async def reject(
    workspace_id: uuid.UUID,
    ot_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("line_manager")),
    db: AsyncSession = Depends(get_db),
):
    return await reject_overtime_request(db, ot_id, workspace_id, current_user.id)


@router.delete(
    "/workspaces/{workspace_id}/overtime-requests/{ot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    ot_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_overtime_request(db, ot_id, workspace_id)
