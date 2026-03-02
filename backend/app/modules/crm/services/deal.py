import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
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
    db: AsyncSession, workspace_id: uuid.UUID, contact_id: uuid.UUID | None = None
) -> list[Deal]:
    q = select(Deal).where(Deal.workspace_id == workspace_id)
    if contact_id:
        q = q.where(Deal.contact_id == contact_id)
    result = await db.scalars(q.order_by(Deal.title))
    return list(result.all())


async def get_deal(db: AsyncSession, deal_id: uuid.UUID) -> Deal:
    deal = await db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    return deal


async def update_deal(
    db: AsyncSession, deal_id: uuid.UUID, data: DealUpdate
) -> Deal:
    deal = await get_deal(db, deal_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(deal, field, value)
    await db.commit()
    await db.refresh(deal)
    return deal


async def delete_deal(db: AsyncSession, deal_id: uuid.UUID) -> None:
    deal = await get_deal(db, deal_id)
    await db.delete(deal)
    await db.commit()
