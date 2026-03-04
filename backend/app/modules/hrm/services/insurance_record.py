import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.insurance_record import InsuranceRecord
from app.modules.hrm.schemas.insurance_record import InsuranceRecordCreate, InsuranceRecordUpdate


async def create_insurance(
    db: AsyncSession, workspace_id: uuid.UUID, data: InsuranceRecordCreate
) -> InsuranceRecord:
    record = InsuranceRecord(workspace_id=workspace_id, **data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_insurance(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
) -> list[InsuranceRecord]:
    q = select(InsuranceRecord).where(InsuranceRecord.workspace_id == workspace_id)
    if employee_id:
        q = q.where(InsuranceRecord.employee_id == employee_id)
    result = await db.scalars(q.order_by(InsuranceRecord.effective_from.desc()))
    return list(result.all())


async def get_insurance(
    db: AsyncSession, record_id: uuid.UUID, workspace_id: uuid.UUID
) -> InsuranceRecord:
    result = await db.scalars(
        select(InsuranceRecord).where(
            InsuranceRecord.id == record_id,
            InsuranceRecord.workspace_id == workspace_id,
        )
    )
    record = result.first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insurance record not found")
    return record


async def update_insurance(
    db: AsyncSession, record_id: uuid.UUID, workspace_id: uuid.UUID, data: InsuranceRecordUpdate
) -> InsuranceRecord:
    record = await get_insurance(db, record_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return record


async def delete_insurance(
    db: AsyncSession, record_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    record = await get_insurance(db, record_id, workspace_id)
    await db.delete(record)
    await db.commit()
