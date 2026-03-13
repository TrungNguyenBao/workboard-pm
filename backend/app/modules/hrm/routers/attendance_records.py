import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.schemas.attendance_record import (
    AttendanceMonthlySummary,
    AttendanceRecordCreate,
    AttendanceRecordResponse,
    AttendanceRecordUpdate,
)
from app.modules.hrm.services.attendance_record import (
    create_attendance,
    delete_attendance,
    get_attendance,
    get_monthly_summary,
    list_attendance,
    update_attendance,
)
from app.schemas.pagination import PaginatedResponse

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/attendance-records",
    response_model=AttendanceRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: AttendanceRecordCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_attendance(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/attendance-records/summary",
    response_model=list[AttendanceMonthlySummary],
)
async def monthly_summary(
    workspace_id: uuid.UUID,
    period: str = Query(..., description="YYYY-MM"),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_monthly_summary(db, workspace_id, period)


@router.get(
    "/workspaces/{workspace_id}/attendance-records",
    response_model=PaginatedResponse[AttendanceRecordResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    period: str | None = Query(default=None, description="YYYY-MM"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_attendance(db, workspace_id, employee_id, period, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/attendance-records/{record_id}",
    response_model=AttendanceRecordResponse,
)
async def get(
    workspace_id: uuid.UUID,
    record_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_attendance(db, record_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/attendance-records/{record_id}",
    response_model=AttendanceRecordResponse,
)
async def update(
    workspace_id: uuid.UUID,
    record_id: uuid.UUID,
    data: AttendanceRecordUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_attendance(db, record_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/attendance-records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    record_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_attendance(db, record_id, workspace_id)
