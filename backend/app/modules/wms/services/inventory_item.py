import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.wms.models.inventory_item import InventoryItem
from app.modules.wms.schemas.inventory_item import InventoryItemCreate, InventoryItemUpdate


async def create_inventory_item(
    db: AsyncSession, workspace_id: uuid.UUID, data: InventoryItemCreate
) -> InventoryItem:
    item = InventoryItem(workspace_id=workspace_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item, attribute_names=["product"])
    return item


async def list_inventory_items(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    warehouse_id: uuid.UUID | None = None,
    product_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[InventoryItem], int]:
    base = InventoryItem.workspace_id == workspace_id
    q = select(InventoryItem).where(base).options(selectinload(InventoryItem.product))
    count_q = select(func.count(InventoryItem.id)).where(base)

    if warehouse_id:
        q = q.where(InventoryItem.warehouse_id == warehouse_id)
        count_q = count_q.where(InventoryItem.warehouse_id == warehouse_id)
    if product_id:
        q = q.where(InventoryItem.product_id == product_id)
        count_q = count_q.where(InventoryItem.product_id == product_id)
    if search:
        pattern = f"%{search}%"
        q = q.where(InventoryItem.name.ilike(pattern) | InventoryItem.sku.ilike(pattern))
        count_q = count_q.where(InventoryItem.name.ilike(pattern) | InventoryItem.sku.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(InventoryItem.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_inventory_item(db: AsyncSession, item_id: uuid.UUID) -> InventoryItem:
    result = await db.scalars(
        select(InventoryItem)
        .where(InventoryItem.id == item_id)
        .options(selectinload(InventoryItem.product))
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    return item


async def update_inventory_item(
    db: AsyncSession, item_id: uuid.UUID, data: InventoryItemUpdate
) -> InventoryItem:
    item = await get_inventory_item(db, item_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item, attribute_names=["product"])
    return item


async def delete_inventory_item(db: AsyncSession, item_id: uuid.UUID) -> None:
    item = await get_inventory_item(db, item_id)
    await db.delete(item)
    await db.commit()
