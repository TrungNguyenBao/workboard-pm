import logging
import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.models.employee import Employee
from app.modules.hrm.schemas.payroll_record import (
    PayrollRecordCreate,
    PayrollRecordResponse,
    PayrollRecordUpdate,
)
from app.modules.hrm.services.email_notifications import payroll_published_email
from app.modules.hrm.services.payroll_record import (
    approve_payroll,
    create_payroll_record,
    delete_payroll_record,
    get_payroll_record,
    list_payroll_records,
    review_payroll,
    update_payroll_record,
)
from app.schemas.pagination import PaginatedResponse

log = logging.getLogger(__name__)

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


@router.post(
    "/workspaces/{workspace_id}/payroll-records/{payroll_record_id}/review",
    response_model=PayrollRecordResponse,
)
async def review(
    workspace_id: uuid.UUID,
    payroll_record_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_manager")),
    db: AsyncSession = Depends(get_db),
):
    return await review_payroll(db, payroll_record_id, workspace_id, current_user.id)


@router.post(
    "/workspaces/{workspace_id}/payroll-records/{payroll_record_id}/approve",
    response_model=PayrollRecordResponse,
)
async def approve(
    request: Request,
    workspace_id: uuid.UUID,
    payroll_record_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("hr_admin")),
    db: AsyncSession = Depends(get_db),
):
    pr = await approve_payroll(db, payroll_record_id, workspace_id, current_user.id)
    try:
        arq_pool = getattr(request.app.state, "arq_pool", None)
        if arq_pool:
            emp = await db.scalar(select(Employee).where(Employee.id == pr.employee_id))
            if emp:
                body = payroll_published_email(emp.name, pr.period)
                await arq_pool.enqueue_job("send_hrm_notification", to_email=emp.email, subject=f"Payslip Published – {pr.period}", body=body)
    except Exception:
        log.exception("Failed to enqueue payroll-approved email for payroll_record_id=%s", payroll_record_id)
    return pr
