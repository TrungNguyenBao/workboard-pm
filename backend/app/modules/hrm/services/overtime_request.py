import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.overtime_request import OvertimeRequest
from app.modules.hrm.schemas.overtime_request import OvertimeRequestCreate
from app.modules.hrm.services.status_transitions import validate_transition

OT_TRANSITIONS: dict[str, list[str]] = {
    "pending": ["approved", "rejected"],
    "approved": [],
    "rejected": [],
}


async def create_overtime_request(
    db: AsyncSession, workspace_id: uuid.UUID, data: OvertimeRequestCreate
) -> OvertimeRequest:
    ot = OvertimeRequest(workspace_id=workspace_id, **data.model_dump())
    db.add(ot)
    await db.commit()
    await db.refresh(ot)
    return ot


async def list_overtime_requests(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    ot_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[OvertimeRequest], int]:
    q = select(OvertimeRequest).where(OvertimeRequest.workspace_id == workspace_id)
    count_q = select(func.count(OvertimeRequest.id)).where(OvertimeRequest.workspace_id == workspace_id)

    if employee_id:
        q = q.where(OvertimeRequest.employee_id == employee_id)
        count_q = count_q.where(OvertimeRequest.employee_id == employee_id)
    if ot_status:
        q = q.where(OvertimeRequest.status == ot_status)
        count_q = count_q.where(OvertimeRequest.status == ot_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(OvertimeRequest.date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_overtime_request(
    db: AsyncSession, ot_id: uuid.UUID, workspace_id: uuid.UUID
) -> OvertimeRequest:
    result = await db.scalars(
        select(OvertimeRequest).where(
            OvertimeRequest.id == ot_id, OvertimeRequest.workspace_id == workspace_id
        )
    )
    ot = result.first()
    if not ot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Overtime request not found")
    return ot


async def approve_overtime_request(
    db: AsyncSession, ot_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID
) -> OvertimeRequest:
    ot = await get_overtime_request(db, ot_id, workspace_id)
    validate_transition(ot.status, "approved", OT_TRANSITIONS, "OvertimeRequest")
    ot.status = "approved"
    ot.approved_by_id = approver_id
    ot.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ot)
    return ot


async def reject_overtime_request(
    db: AsyncSession, ot_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID
) -> OvertimeRequest:
    ot = await get_overtime_request(db, ot_id, workspace_id)
    validate_transition(ot.status, "rejected", OT_TRANSITIONS, "OvertimeRequest")
    ot.status = "rejected"
    ot.approved_by_id = approver_id
    ot.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ot)
    return ot


async def delete_overtime_request(
    db: AsyncSession, ot_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    ot = await get_overtime_request(db, ot_id, workspace_id)
    await db.delete(ot)
    await db.commit()
