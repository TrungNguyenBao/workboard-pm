import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.contract import Contract
from app.modules.hrm.models.salary_history import SalaryHistory
from app.modules.hrm.schemas.contract import ContractCreate, ContractUpdate


async def create_contract(
    db: AsyncSession, workspace_id: uuid.UUID, data: ContractCreate
) -> Contract:
    contract = Contract(workspace_id=workspace_id, **data.model_dump())
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract


async def list_contracts(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    employee_id: uuid.UUID | None = None,
    contract_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Contract], int]:
    q = select(Contract).where(Contract.workspace_id == workspace_id)
    count_q = select(func.count(Contract.id)).where(Contract.workspace_id == workspace_id)

    if employee_id:
        q = q.where(Contract.employee_id == employee_id)
        count_q = count_q.where(Contract.employee_id == employee_id)
    if contract_status:
        q = q.where(Contract.status == contract_status)
        count_q = count_q.where(Contract.status == contract_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Contract.start_date.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID
) -> Contract:
    result = await db.scalars(
        select(Contract).where(Contract.id == contract_id, Contract.workspace_id == workspace_id)
    )
    contract = result.first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract


async def update_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID, data: ContractUpdate
) -> Contract:
    contract = await get_contract(db, contract_id, workspace_id)
    update_data = data.model_dump(exclude_none=True)

    old_salary = float(contract.base_salary)
    new_salary = update_data.get("base_salary")

    for field, value in update_data.items():
        setattr(contract, field, value)

    # Auto-create salary history if base_salary changed — same transaction
    if new_salary is not None and new_salary != old_salary:
        salary_record = SalaryHistory(
            employee_id=contract.employee_id,
            workspace_id=workspace_id,
            effective_date=date.today(),
            previous_amount=old_salary,
            new_amount=new_salary,
            reason="Contract salary update",
        )
        db.add(salary_record)

    await db.commit()
    await db.refresh(contract)
    return contract


async def delete_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    contract = await get_contract(db, contract_id, workspace_id)
    await db.delete(contract)
    await db.commit()
