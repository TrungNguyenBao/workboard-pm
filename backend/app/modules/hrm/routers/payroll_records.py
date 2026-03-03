import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.schemas.payroll_record import (
    PayrollRecordCreate,
    PayrollRecordResponse,
    PayrollRecordUpdate,
)
from app.modules.hrm.services.payroll_record import (
    create_payroll_record,
    delete_payroll_record,
    get_payroll_record,
    list_payroll_records,
    update_payroll_record,
)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/payroll-records",
    response_model=PayrollRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: PayrollRecordCreate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await create_payroll_record(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/payroll-records",
    response_model=PaginatedResponse[PayrollRecordResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    period: str | None = Query(default=None),
    payroll_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_payroll_records(
        db, workspace_id, employee_id, period, payroll_status, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/workspaces/{workspace_id}/payroll-records/{payroll_record_id}",
    response_model=PayrollRecordResponse,
)
async def get(
    workspace_id: uuid.UUID,
    payroll_record_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await get_payroll_record(db, payroll_record_id, workspace_id)


@router.patch(
    "/workspaces/{workspace_id}/payroll-records/{payroll_record_id}",
    response_model=PayrollRecordResponse,
)
async def update(
    workspace_id: uuid.UUID,
    payroll_record_id: uuid.UUID,
    data: PayrollRecordUpdate,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await update_payroll_record(db, payroll_record_id, workspace_id, data)


@router.delete(
    "/workspaces/{workspace_id}/payroll-records/{payroll_record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    payroll_record_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_payroll_record(db, payroll_record_id, workspace_id)
