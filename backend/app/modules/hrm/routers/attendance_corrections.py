import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.schemas.attendance_correction import (
    AttendanceCorrectionCreate,
    AttendanceCorrectionResponse,
)
from app.modules.hrm.services.attendance_correction import (
    approve_correction,
    create_correction,
    delete_correction,
    get_correction,
    list_corrections,
    reject_correction,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/attendance-corrections",
    response_model=AttendanceCorrectionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: AttendanceCorrectionCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_correction(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/attendance-corrections",
    response_model=PaginatedResponse[AttendanceCorrectionResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    corr_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_corrections(db, workspace_id, employee_id, corr_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/attendance-corrections/{corr_id}",
    response_model=AttendanceCorrectionResponse,
)
async def get_one(
    workspace_id: uuid.UUID,
    corr_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await get_correction(db, corr_id, workspace_id)


@router.post(
    "/workspaces/{workspace_id}/attendance-corrections/{corr_id}/approve",
    response_model=AttendanceCorrectionResponse,
)
async def approve(
    workspace_id: uuid.UUID,
    corr_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approve_correction(db, corr_id, workspace_id, current_user.id)


@router.post(
    "/workspaces/{workspace_id}/attendance-corrections/{corr_id}/reject",
    response_model=AttendanceCorrectionResponse,
)
async def reject(
    workspace_id: uuid.UUID,
    corr_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_admin")),
    db: AsyncSession = Depends(get_db),
):
    return await reject_correction(db, corr_id, workspace_id, current_user.id)


@router.delete(
    "/workspaces/{workspace_id}/attendance-corrections/{corr_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    corr_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_correction(db, corr_id, workspace_id)
