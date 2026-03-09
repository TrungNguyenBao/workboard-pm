import uuid
from datetime import datetime, time, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.attendance_correction import AttendanceCorrection
from app.modules.hrm.models.attendance_record import AttendanceRecord
from app.modules.hrm.schemas.attendance_correction import AttendanceCorrectionCreate
from app.modules.hrm.services.status_transitions import validate_transition

CORRECTION_TRANSITIONS: dict[str, list[str]] = {
    "pending": ["approved", "rejected"],
    "approved": [],
    "rejected": [],
}


def _calc_total_hours(check_in: time | None, check_out: time | None) -> float:
    """Calculate hours worked, handling midnight rollover for night shifts."""
    if check_in is None or check_out is None:
        return 0.0
    dt_in = datetime.combine(datetime.min, check_in)
    dt_out = datetime.combine(datetime.min, check_out)
    if dt_out < dt_in:  # night shift crosses midnight
        dt_out += timedelta(days=1)
    return round((dt_out - dt_in).total_seconds() / 3600, 2)


def _calc_hours(check_in: time | None, check_out: time | None) -> Decimal | None:
    if check_in is None or check_out is None:
        return None
    return Decimal(str(_calc_total_hours(check_in, check_out)))


async def create_correction(
    db: AsyncSession, workspace_id: uuid.UUID, data: AttendanceCorrectionCreate
) -> AttendanceCorrection:
    corr = AttendanceCorrection(workspace_id=workspace_id, **data.model_dump())
    db.add(corr)
    await db.commit()
    await db.refresh(corr)
    return corr


async def list_corrections(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    corr_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[AttendanceCorrection], int]:
    q = select(AttendanceCorrection).where(AttendanceCorrection.workspace_id == workspace_id)
    count_q = select(func.count(AttendanceCorrection.id)).where(
        AttendanceCorrection.workspace_id == workspace_id
    )
    if employee_id:
        q = q.where(AttendanceCorrection.employee_id == employee_id)
        count_q = count_q.where(AttendanceCorrection.employee_id == employee_id)
    if corr_status:
        q = q.where(AttendanceCorrection.status == corr_status)
        count_q = count_q.where(AttendanceCorrection.status == corr_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(AttendanceCorrection.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.all()), total


async def get_correction(
    db: AsyncSession, corr_id: uuid.UUID, workspace_id: uuid.UUID
) -> AttendanceCorrection:
    result = await db.scalars(
        select(AttendanceCorrection).where(
            AttendanceCorrection.id == corr_id,
            AttendanceCorrection.workspace_id == workspace_id,
        )
    )
    corr = result.first()
    if not corr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Attendance correction not found"
        )
    return corr


async def approve_correction(
    db: AsyncSession, corr_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID
) -> AttendanceCorrection:
    corr = await get_correction(db, corr_id, workspace_id)
    validate_transition(corr.status, "approved", CORRECTION_TRANSITIONS, "AttendanceCorrection")

    # Apply corrected times to the original attendance record
    rec_result = await db.scalars(
        select(AttendanceRecord).where(AttendanceRecord.id == corr.attendance_record_id)
    )
    rec = rec_result.first()
    if rec:
        if corr.corrected_check_in is not None:
            rec.check_in = corr.corrected_check_in
        if corr.corrected_check_out is not None:
            rec.check_out = corr.corrected_check_out
        auto = _calc_hours(rec.check_in, rec.check_out)
        if auto is not None:
            rec.total_hours = auto

    corr.status = "approved"
    corr.approved_by_id = approver_id
    corr.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(corr)
    return corr


async def reject_correction(
    db: AsyncSession, corr_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID
) -> AttendanceCorrection:
    corr = await get_correction(db, corr_id, workspace_id)
    validate_transition(corr.status, "rejected", CORRECTION_TRANSITIONS, "AttendanceCorrection")
    corr.status = "rejected"
    corr.approved_by_id = approver_id
    corr.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(corr)
    return corr


async def delete_correction(
    db: AsyncSession, corr_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    corr = await get_correction(db, corr_id, workspace_id)
    await db.delete(corr)
    await db.commit()
