import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.payroll_record import PayrollRecord
from app.modules.hrm.schemas.payroll_record import PayrollRecordCreate, PayrollRecordUpdate


async def create_payroll_record(
    db: AsyncSession, workspace_id: uuid.UUID, data: PayrollRecordCreate
) -> PayrollRecord:
    pr = PayrollRecord(workspace_id=workspace_id, **data.model_dump())
    db.add(pr)
    await db.commit()
    await db.refresh(pr)
    return pr


async def list_payroll_records(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    period: str | None = None,
    payroll_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[PayrollRecord], int]:
    q = select(PayrollRecord).where(PayrollRecord.workspace_id == workspace_id)
    count_q = select(func.count(PayrollRecord.id)).where(PayrollRecord.workspace_id == workspace_id)

    if employee_id:
        q = q.where(PayrollRecord.employee_id == employee_id)
        count_q = count_q.where(PayrollRecord.employee_id == employee_id)

    if period:
        q = q.where(PayrollRecord.period == period)
        count_q = count_q.where(PayrollRecord.period == period)

    if payroll_status:
        q = q.where(PayrollRecord.status == payroll_status)
        count_q = count_q.where(PayrollRecord.status == payroll_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(PayrollRecord.period.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_payroll_record(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID
) -> PayrollRecord:
    result = await db.scalars(
        select(PayrollRecord).where(
            PayrollRecord.id == payroll_record_id, PayrollRecord.workspace_id == workspace_id
        )
    )
    pr = result.first()
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll record not found")
    return pr


async def update_payroll_record(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID, data: PayrollRecordUpdate
) -> PayrollRecord:
    pr = await get_payroll_record(db, payroll_record_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(pr, field, value)
    await db.commit()
    await db.refresh(pr)
    return pr


async def delete_payroll_record(
    db: AsyncSession, payroll_record_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    pr = await get_payroll_record(db, payroll_record_id, workspace_id)
    await db.delete(pr)
    await db.commit()
