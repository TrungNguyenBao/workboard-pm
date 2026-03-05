import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.purchase_item import PurchaseItem
from app.modules.hrm.schemas.purchase_item import PurchaseItemCreate, PurchaseItemUpdate


async def create_purchase_item(
    db: AsyncSession, workspace_id: uuid.UUID, data: PurchaseItemCreate
) -> PurchaseItem:
    total = Decimal(str(data.quantity)) * data.unit_price
    item = PurchaseItem(workspace_id=workspace_id, total=total, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_purchase_items(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    request_id: uuid.UUID | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[PurchaseItem], int]:
    q = select(PurchaseItem).where(PurchaseItem.workspace_id == workspace_id)
    count_q = select(func.count(PurchaseItem.id)).where(PurchaseItem.workspace_id == workspace_id)

    if request_id:
        q = q.where(PurchaseItem.request_id == request_id)
        count_q = count_q.where(PurchaseItem.request_id == request_id)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(PurchaseItem.created_at.asc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_purchase_item(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID
) -> PurchaseItem:
    result = await db.scalars(
        select(PurchaseItem).where(
            PurchaseItem.id == item_id, PurchaseItem.workspace_id == workspace_id
        )
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase item not found")
    return item


async def update_purchase_item(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID, data: PurchaseItemUpdate
) -> PurchaseItem:
    item = await get_purchase_item(db, item_id, workspace_id)
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    # Recalculate total
    item.total = Decimal(str(item.quantity)) * Decimal(str(item.unit_price))
    await db.commit()
    await db.refresh(item)
    return item


async def delete_purchase_item(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    item = await get_purchase_item(db, item_id, workspace_id)
    await db.delete(item)
    await db.commit()
