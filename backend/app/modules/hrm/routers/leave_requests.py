import logging
import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.modules.hrm.dependencies.rbac import require_hrm_role
from app.modules.hrm.models.employee import Employee
from app.modules.hrm.models.leave_type import LeaveType
from app.modules.hrm.schemas.leave_request import (
    LeaveRequestCreate,
    LeaveRequestResponse,
    LeaveRequestUpdate,
)
from app.modules.hrm.services.email_notifications import leave_approved_email, leave_rejected_email
from app.modules.hrm.services.leave_request import (
    approve_leave_request,
    create_leave_request,
    delete_leave_request,
    list_leave_requests,
    reject_leave_request,
    update_leave_request,
)

log = logging.getLogger(__name__)

router = APIRouter(tags=["hrm"])


@router.post(
    "/workspaces/{workspace_id}/leave-requests",
    response_model=LeaveRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: LeaveRequestCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_leave_request(db, workspace_id, data)


@router.get(
    "/workspaces/{workspace_id}/leave-requests",
    response_model=PaginatedResponse[LeaveRequestResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = Query(default=None),
    leave_status: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_leave_requests(db, workspace_id, employee_id, leave_status, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.patch(
    "/workspaces/{workspace_id}/leave-requests/{leave_request_id}",
    response_model=LeaveRequestResponse,
)
async def update(
    workspace_id: uuid.UUID,
    leave_request_id: uuid.UUID,
    data: LeaveRequestUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_leave_request(db, leave_request_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/leave-requests/{leave_request_id}/approve",
    response_model=LeaveRequestResponse,
)
async def approve(
    request: Request,
    workspace_id: uuid.UUID,
    leave_request_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("line_manager")),
    db: AsyncSession = Depends(get_db),
):
    lr = await approve_leave_request(db, leave_request_id, workspace_id, current_user.id)
    try:
        arq_pool = getattr(request.app.state, "arq_pool", None)
        if arq_pool:
            emp = await db.scalar(select(Employee).where(Employee.id == lr.employee_id))
            lt = await db.scalar(select(LeaveType).where(LeaveType.id == lr.leave_type_id))
            if emp:
                leave_type_name = lt.name if lt else "Leave"
                body = leave_approved_email(emp.name, leave_type_name, str(lr.start_date), str(lr.end_date))
                await arq_pool.enqueue_job("send_hrm_notification", to_email=emp.email, subject="Leave Request Approved", body=body)
    except Exception:
        log.exception("Failed to enqueue leave-approved email for leave_request_id=%s", leave_request_id)
    return lr


@router.post(
    "/workspaces/{workspace_id}/leave-requests/{leave_request_id}/reject",
    response_model=LeaveRequestResponse,
)
async def reject(
    request: Request,
    workspace_id: uuid.UUID,
    leave_request_id: uuid.UUID,
    current_user: User = Depends(require_hrm_role("line_manager")),
    db: AsyncSession = Depends(get_db),
):
    lr = await reject_leave_request(db, leave_request_id, workspace_id, current_user.id)
    try:
        arq_pool = getattr(request.app.state, "arq_pool", None)
        if arq_pool:
            emp = await db.scalar(select(Employee).where(Employee.id == lr.employee_id))
            lt = await db.scalar(select(LeaveType).where(LeaveType.id == lr.leave_type_id))
            if emp:
                leave_type_name = lt.name if lt else "Leave"
                body = leave_rejected_email(emp.name, leave_type_name)
                await arq_pool.enqueue_job("send_hrm_notification", to_email=emp.email, subject="Leave Request Rejected", body=body)
    except Exception:
        log.exception("Failed to enqueue leave-rejected email for leave_request_id=%s", leave_request_id)
    return lr


@router.delete(
    "/workspaces/{workspace_id}/leave-requests/{leave_request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete(
    workspace_id: uuid.UUID,
    leave_request_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await delete_leave_request(db, leave_request_id, workspace_id)
