import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.salary_history import SalaryHistory
from app.modules.hrm.schemas.salary_history import SalaryHistoryCreate


async def create_salary_history(
    db: AsyncSession, workspace_id: uuid.UUID, data: SalaryHistoryCreate
) -> SalaryHistory:
    record = SalaryHistory(workspace_id=workspace_id, **data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_salary_history(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[SalaryHistory], int]:
    q = select(SalaryHistory).where(
        SalaryHistory.workspace_id == workspace_id,
        SalaryHistory.employee_id == employee_id,
    )
    count_q = select(func.count(SalaryHistory.id)).where(
        SalaryHistory.workspace_id == workspace_id,
        SalaryHistory.employee_id == employee_id,
    )

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(SalaryHistory.effective_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.all()), total
