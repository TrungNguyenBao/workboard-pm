import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.offer import Offer
from app.modules.hrm.schemas.offer import OfferCreate, OfferUpdate


async def create_offer(
    db: AsyncSession, workspace_id: uuid.UUID, data: OfferCreate
) -> Offer:
    o = Offer(workspace_id=workspace_id, **data.model_dump())
    db.add(o)
    await db.commit()
    await db.refresh(o)
    return o


async def list_offers(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    candidate_id: uuid.UUID | None = None,
    offer_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Offer], int]:
    q = select(Offer).where(Offer.workspace_id == workspace_id)
    count_q = select(func.count(Offer.id)).where(Offer.workspace_id == workspace_id)

    if candidate_id:
        q = q.where(Offer.candidate_id == candidate_id)
        count_q = count_q.where(Offer.candidate_id == candidate_id)
    if offer_status:
        q = q.where(Offer.status == offer_status)
        count_q = count_q.where(Offer.status == offer_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Offer.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_offer(
    db: AsyncSession, offer_id: uuid.UUID, workspace_id: uuid.UUID
) -> Offer:
    result = await db.scalars(
        select(Offer).where(Offer.id == offer_id, Offer.workspace_id == workspace_id)
    )
    o = result.first()
    if not o:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return o


async def update_offer(
    db: AsyncSession, offer_id: uuid.UUID, workspace_id: uuid.UUID, data: OfferUpdate
) -> Offer:
    o = await get_offer(db, offer_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(o, field, value)
    await db.commit()
    await db.refresh(o)
    return o


async def send_offer(db: AsyncSession, offer_id: uuid.UUID, workspace_id: uuid.UUID) -> Offer:
    o = await get_offer(db, offer_id, workspace_id)
    if o.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft offers can be sent")
    o.status = "sent"
    await db.commit()
    await db.refresh(o)
    return o


async def accept_offer(db: AsyncSession, offer_id: uuid.UUID, workspace_id: uuid.UUID) -> Offer:
    o = await get_offer(db, offer_id, workspace_id)
    if o.status != "sent":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only sent offers can be accepted")
    o.status = "accepted"
    await db.commit()
    await db.refresh(o)
    return o


async def reject_offer(db: AsyncSession, offer_id: uuid.UUID, workspace_id: uuid.UUID) -> Offer:
    o = await get_offer(db, offer_id, workspace_id)
    if o.status != "sent":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only sent offers can be rejected")
    o.status = "rejected"
    await db.commit()
    await db.refresh(o)
    return o


async def delete_offer(
    db: AsyncSession, offer_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    o = await get_offer(db, offer_id, workspace_id)
    await db.delete(o)
    await db.commit()
