import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.kpi_assignment import KpiAssignment
from app.modules.hrm.schemas.kpi_assignment import KpiAssignmentCreate, KpiAssignmentUpdate


async def create_kpi_assignment(
    db: AsyncSession, workspace_id: uuid.UUID, data: KpiAssignmentCreate
) -> KpiAssignment:
    assignment = KpiAssignment(workspace_id=workspace_id, **data.model_dump())
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


async def list_kpi_assignments(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    period: str | None = None,
    assignment_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[KpiAssignment], int]:
    q = select(KpiAssignment).where(KpiAssignment.workspace_id == workspace_id)
    count_q = select(func.count(KpiAssignment.id)).where(KpiAssignment.workspace_id == workspace_id)

    if employee_id:
        q = q.where(KpiAssignment.employee_id == employee_id)
        count_q = count_q.where(KpiAssignment.employee_id == employee_id)
    if period:
        q = q.where(KpiAssignment.period == period)
        count_q = count_q.where(KpiAssignment.period == period)
    if assignment_status:
        q = q.where(KpiAssignment.status == assignment_status)
        count_q = count_q.where(KpiAssignment.status == assignment_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(KpiAssignment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_kpi_assignment(
    db: AsyncSession, assignment_id: uuid.UUID, workspace_id: uuid.UUID
) -> KpiAssignment:
    result = await db.scalars(
        select(KpiAssignment).where(
            KpiAssignment.id == assignment_id, KpiAssignment.workspace_id == workspace_id
        )
    )
    obj = result.first()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KPI assignment not found")
    return obj


async def update_kpi_assignment(
    db: AsyncSession, assignment_id: uuid.UUID, workspace_id: uuid.UUID, data: KpiAssignmentUpdate
) -> KpiAssignment:
    obj = await get_kpi_assignment(db, assignment_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def complete_kpi_assignment(
    db: AsyncSession, assignment_id: uuid.UUID, workspace_id: uuid.UUID, actual_value: Decimal
) -> KpiAssignment:
    obj = await get_kpi_assignment(db, assignment_id, workspace_id)
    obj.actual_value = actual_value
    obj.status = "completed"
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_kpi_assignment(
    db: AsyncSession, assignment_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    obj = await get_kpi_assignment(db, assignment_id, workspace_id)
    await db.delete(obj)
    await db.commit()
