import uuid
from datetime import date, datetime, time
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.attendance_record import AttendanceRecord
from app.modules.hrm.models.employee import Employee
from app.modules.hrm.schemas.attendance_record import (
    AttendanceMonthlySummary,
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
)


def _parse_time(t_str: str | None) -> time | None:
    if t_str is None:
        return None
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(t_str, fmt).time()
        except ValueError:
            continue
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"Invalid time format: {t_str}. Use HH:MM or HH:MM:SS",
    )


def _auto_total_hours(check_in: time | None, check_out: time | None) -> Decimal | None:
    if check_in is None or check_out is None:
        return None
    dt_in = datetime.combine(date.today(), check_in)
    dt_out = datetime.combine(date.today(), check_out)
    diff = (dt_out - dt_in).total_seconds() / 3600
    return Decimal(str(round(max(diff, 0), 2)))


async def create_attendance(
    db: AsyncSession, workspace_id: uuid.UUID, data: AttendanceRecordCreate
) -> AttendanceRecord:
    check_in = _parse_time(data.check_in)
    check_out = _parse_time(data.check_out)
    total_hours = data.total_hours if data.total_hours is not None else _auto_total_hours(check_in, check_out)

    record = AttendanceRecord(
        workspace_id=workspace_id,
        employee_id=data.employee_id,
        date=data.date,
        check_in=check_in,
        check_out=check_out,
        status=data.status,
        total_hours=total_hours,
        overtime_hours=data.overtime_hours,
        notes=data.notes,
    )
    db.add(record)
    try:
        await db.commit()
        await db.refresh(record)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance record already exists for this employee on this date",
        )
    return record


async def list_attendance(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    month_period: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[AttendanceRecord], int]:
    q = select(AttendanceRecord).where(AttendanceRecord.workspace_id == workspace_id)
    count_q = select(func.count(AttendanceRecord.id)).where(AttendanceRecord.workspace_id == workspace_id)

    if employee_id:
        q = q.where(AttendanceRecord.employee_id == employee_id)
        count_q = count_q.where(AttendanceRecord.employee_id == employee_id)

    if month_period:
        try:
            year, month = int(month_period[:4]), int(month_period[5:7])
            from calendar import monthrange
            last_day = monthrange(year, month)[1]
            date_from = date(year, month, 1)
            date_to = date(year, month, last_day)
            q = q.where(AttendanceRecord.date.between(date_from, date_to))
            count_q = count_q.where(AttendanceRecord.date.between(date_from, date_to))
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="period must be in YYYY-MM format",
            )

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(AttendanceRecord.date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_attendance(
    db: AsyncSession, record_id: uuid.UUID, workspace_id: uuid.UUID
) -> AttendanceRecord:
    result = await db.scalars(
        select(AttendanceRecord).where(
            AttendanceRecord.id == record_id,
            AttendanceRecord.workspace_id == workspace_id,
        )
    )
    record = result.first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    return record


async def update_attendance(
    db: AsyncSession, record_id: uuid.UUID, workspace_id: uuid.UUID, data: AttendanceRecordUpdate
) -> AttendanceRecord:
    record = await get_attendance(db, record_id, workspace_id)
    patch = data.model_dump(exclude_none=True)

    if "check_in" in patch:
        patch["check_in"] = _parse_time(patch["check_in"])
    if "check_out" in patch:
        patch["check_out"] = _parse_time(patch["check_out"])

    for field, value in patch.items():
        setattr(record, field, value)

    # Recalculate total_hours if times changed and total_hours not explicitly provided
    if "total_hours" not in patch:
        auto = _auto_total_hours(record.check_in, record.check_out)
        if auto is not None:
            record.total_hours = auto

    await db.commit()
    await db.refresh(record)
    return record


async def delete_attendance(
    db: AsyncSession, record_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    record = await get_attendance(db, record_id, workspace_id)
    await db.delete(record)
    await db.commit()


async def get_monthly_summary(
    db: AsyncSession, workspace_id: uuid.UUID, period: str
) -> list[AttendanceMonthlySummary]:
    try:
        year, month = int(period[:4]), int(period[5:7])
        from calendar import monthrange
        last_day = monthrange(year, month)[1]
        date_from = date(year, month, 1)
        date_to = date(year, month, last_day)
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="period must be in YYYY-MM format",
        )

    q = (
        select(AttendanceRecord)
        .where(
            AttendanceRecord.workspace_id == workspace_id,
            AttendanceRecord.date.between(date_from, date_to),
        )
    )
    rows = list((await db.scalars(q)).all())

    # Group by employee
    from collections import defaultdict
    employee_ids: list[uuid.UUID] = list({r.employee_id for r in rows})
    emp_q = select(Employee).where(Employee.id.in_(employee_ids))
    employees = {e.id: e.name for e in (await db.scalars(emp_q)).all()}

    grouped: dict[uuid.UUID, list[AttendanceRecord]] = defaultdict(list)
    for r in rows:
        grouped[r.employee_id].append(r)

    summaries = []
    for emp_id, records in grouped.items():
        summaries.append(
            AttendanceMonthlySummary(
                employee_id=emp_id,
                employee_name=employees.get(emp_id, "Unknown"),
                period=period,
                present_days=sum(1 for r in records if r.status == "present"),
                absent_days=sum(1 for r in records if r.status == "absent"),
                late_days=sum(1 for r in records if r.status == "late"),
                half_day_count=sum(1 for r in records if r.status == "half_day"),
                holiday_count=sum(1 for r in records if r.status == "holiday"),
                leave_count=sum(1 for r in records if r.status == "leave"),
                total_hours=sum((r.total_hours or Decimal("0")) for r in records),
                overtime_hours=sum((r.overtime_hours or Decimal("0")) for r in records),
            )
        )
    return summaries
