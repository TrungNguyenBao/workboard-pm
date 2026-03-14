import uuid
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.contract import Contract
from app.modules.crm.schemas.contract import ContractCreate, ContractUpdate
from app.modules.crm.services.status_flows import escape_like


async def create_contract(
    db: AsyncSession, workspace_id: uuid.UUID, data: ContractCreate, created_by: uuid.UUID | None = None
) -> Contract:
    item = Contract(workspace_id=workspace_id, created_by=created_by, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_contracts(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    account_id: uuid.UUID | None = None,
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Contract], int]:
    q = select(Contract).where(Contract.workspace_id == workspace_id)
    count_q = select(func.count(Contract.id)).where(Contract.workspace_id == workspace_id)

    if account_id:
        q = q.where(Contract.account_id == account_id)
        count_q = count_q.where(Contract.account_id == account_id)
    if status:
        q = q.where(Contract.status == status)
        count_q = count_q.where(Contract.status == status)
    if search:
        pattern = f"%{escape_like(search)}%"
        q = q.where(Contract.title.ilike(pattern))
        count_q = count_q.where(Contract.title.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Contract.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID
) -> Contract:
    result = await db.scalars(
        select(Contract).where(Contract.id == contract_id, Contract.workspace_id == workspace_id)
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return item


async def update_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID, data: ContractUpdate
) -> Contract:
    item = await get_contract(db, contract_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    item = await get_contract(db, contract_id, workspace_id)
    await db.delete(item)
    await db.commit()


async def activate_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID, signed_date: date | None = None
) -> Contract:
    item = await get_contract(db, contract_id, workspace_id)
    if item.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft contracts can be activated")
    effective_signed = signed_date or item.signed_date
    if not effective_signed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="signed_date is required to activate a contract")
    item.status = "active"
    item.signed_date = effective_signed
    await db.commit()
    await db.refresh(item)
    return item


async def renew_contract(
    db: AsyncSession,
    contract_id: uuid.UUID,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
) -> Contract:
    """Create a renewal contract extending from the old end_date."""
    item = await get_contract(db, contract_id, workspace_id)

    new_start = item.end_date or date.today()
    if item.end_date and item.start_date:
        duration_days = (item.end_date - item.start_date).days
    else:
        duration_days = 365
    new_end = new_start + timedelta(days=duration_days)

    renewal = Contract(
        deal_id=item.deal_id,
        account_id=item.account_id,
        contract_number=f"CT-{date.today().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}",
        title=f"{item.title} (Renewal)",
        value=item.value,
        start_date=new_start,
        end_date=new_end,
        billing_period=item.billing_period,
        auto_renewal=item.auto_renewal,
        status="draft",
        workspace_id=workspace_id,
        created_by=user_id,
    )
    db.add(renewal)
    await db.commit()
    await db.refresh(renewal)
    return renewal


async def terminate_contract(
    db: AsyncSession, contract_id: uuid.UUID, workspace_id: uuid.UUID
) -> Contract:
    item = await get_contract(db, contract_id, workspace_id)
    if item.status not in ("draft", "active"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contract cannot be terminated in its current status")
    item.status = "terminated"
    await db.commit()
    await db.refresh(item)
    return item
