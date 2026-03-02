import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.wms.models.inventory_item import InventoryItem
from app.modules.wms.schemas.inventory_item import InventoryItemCreate, InventoryItemUpdate


async def create_inventory_item(
    db: AsyncSession, workspace_id: uuid.UUID, data: InventoryItemCreate
) -> InventoryItem:
    item = InventoryItem(workspace_id=workspace_id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_inventory_items(
    db: AsyncSession, workspace_id: uuid.UUID, warehouse_id: uuid.UUID | None = None
) -> list[InventoryItem]:
    q = select(InventoryItem).where(InventoryItem.workspace_id == workspace_id)
    if warehouse_id:
        q = q.where(InventoryItem.warehouse_id == warehouse_id)
    result = await db.scalars(q.order_by(InventoryItem.name))
    return list(result.all())


async def get_inventory_item(db: AsyncSession, item_id: uuid.UUID) -> InventoryItem:
    item = await db.get(InventoryItem, item_id)
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
    await db.refresh(item)
    return item


async def delete_inventory_item(db: AsyncSession, item_id: uuid.UUID) -> None:
    item = await get_inventory_item(db, item_id)
    await db.delete(item)
    await db.commit()
