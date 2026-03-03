import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.deal import Deal
from app.modules.crm.schemas.deal import DealCreate, DealUpdate


async def create_deal(
    db: AsyncSession, workspace_id: uuid.UUID, data: DealCreate
) -> Deal:
    deal = Deal(workspace_id=workspace_id, **data.model_dump())
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return deal


async def list_deals(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID | None = None,
    stage: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Deal], int]:
    q = select(Deal).where(Deal.workspace_id == workspace_id)
    count_q = select(func.count(Deal.id)).where(Deal.workspace_id == workspace_id)

    if contact_id:
        q = q.where(Deal.contact_id == contact_id)
        count_q = count_q.where(Deal.contact_id == contact_id)
    if stage:
        q = q.where(Deal.stage == stage)
        count_q = count_q.where(Deal.stage == stage)
    if search:
        pattern = f"%{search}%"
        q = q.where(Deal.title.ilike(pattern))
        count_q = count_q.where(Deal.title.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Deal.title).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_deal(
    db: AsyncSession, deal_id: uuid.UUID, workspace_id: uuid.UUID
) -> Deal:
    """Fetch deal by id, enforcing workspace ownership (returns 404 on mismatch)."""
    result = await db.scalars(
        select(Deal).where(Deal.id == deal_id, Deal.workspace_id == workspace_id)
    )
    deal = result.first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    return deal


async def update_deal(
    db: AsyncSession, deal_id: uuid.UUID, workspace_id: uuid.UUID, data: DealUpdate
) -> Deal:
    deal = await get_deal(db, deal_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(deal, field, value)
    await db.commit()
    await db.refresh(deal)
    return deal


async def delete_deal(
    db: AsyncSession, deal_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    deal = await get_deal(db, deal_id, workspace_id)
    await db.delete(deal)
    await db.commit()
