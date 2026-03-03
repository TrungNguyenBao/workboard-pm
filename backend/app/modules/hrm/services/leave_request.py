import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.leave_request import LeaveRequest
from app.modules.hrm.schemas.leave_request import LeaveRequestCreate, LeaveRequestUpdate


async def create_leave_request(
    db: AsyncSession, workspace_id: uuid.UUID, data: LeaveRequestCreate
) -> LeaveRequest:
    lr = LeaveRequest(workspace_id=workspace_id, **data.model_dump())
    db.add(lr)
    await db.commit()
    await db.refresh(lr)
    return lr


async def list_leave_requests(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    leave_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[LeaveRequest], int]:
    q = select(LeaveRequest).where(LeaveRequest.workspace_id == workspace_id)
    count_q = select(func.count(LeaveRequest.id)).where(LeaveRequest.workspace_id == workspace_id)

    if employee_id:
        q = q.where(LeaveRequest.employee_id == employee_id)
        count_q = count_q.where(LeaveRequest.employee_id == employee_id)

    if leave_status:
        q = q.where(LeaveRequest.status == leave_status)
        count_q = count_q.where(LeaveRequest.status == leave_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(LeaveRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_leave_request(
    db: AsyncSession, leave_request_id: uuid.UUID, workspace_id: uuid.UUID
) -> LeaveRequest:
    result = await db.scalars(
        select(LeaveRequest).where(
            LeaveRequest.id == leave_request_id, LeaveRequest.workspace_id == workspace_id
        )
    )
    lr = result.first()
    if not lr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
    return lr


async def update_leave_request(
    db: AsyncSession, leave_request_id: uuid.UUID, workspace_id: uuid.UUID, data: LeaveRequestUpdate
) -> LeaveRequest:
    lr = await get_leave_request(db, leave_request_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lr, field, value)
    await db.commit()
    await db.refresh(lr)
    return lr


async def approve_leave_request(
    db: AsyncSession, leave_request_id: uuid.UUID, workspace_id: uuid.UUID, reviewer_id: uuid.UUID
) -> LeaveRequest:
    lr = await get_leave_request(db, leave_request_id, workspace_id)
    if lr.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be approved")
    lr.status = "approved"
    lr.reviewed_by_id = reviewer_id
    await db.commit()
    await db.refresh(lr)
    return lr


async def reject_leave_request(
    db: AsyncSession, leave_request_id: uuid.UUID, workspace_id: uuid.UUID, reviewer_id: uuid.UUID
) -> LeaveRequest:
    lr = await get_leave_request(db, leave_request_id, workspace_id)
    if lr.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be rejected")
    lr.status = "rejected"
    lr.reviewed_by_id = reviewer_id
    await db.commit()
    await db.refresh(lr)
    return lr


async def delete_leave_request(
    db: AsyncSession, leave_request_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    lr = await get_leave_request(db, leave_request_id, workspace_id)
    await db.delete(lr)
    await db.commit()
