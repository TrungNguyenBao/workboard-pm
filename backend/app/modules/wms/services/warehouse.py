import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.wms.models.warehouse import Warehouse
from app.modules.wms.schemas.warehouse import WarehouseCreate, WarehouseUpdate


async def create_warehouse(
    db: AsyncSession, workspace_id: uuid.UUID, data: WarehouseCreate
) -> Warehouse:
    warehouse = Warehouse(workspace_id=workspace_id, **data.model_dump())
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return warehouse


async def list_warehouses(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Warehouse], int]:
    q = select(Warehouse).where(Warehouse.workspace_id == workspace_id)
    count_q = select(func.count(Warehouse.id)).where(Warehouse.workspace_id == workspace_id)

    if search:
        pattern = f"%{search}%"
        q = q.where(Warehouse.name.ilike(pattern))
        count_q = count_q.where(Warehouse.name.ilike(pattern))
    if is_active is not None:
        q = q.where(Warehouse.is_active == is_active)
        count_q = count_q.where(Warehouse.is_active == is_active)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Warehouse.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_warehouse(db: AsyncSession, warehouse_id: uuid.UUID) -> Warehouse:
    warehouse = await db.get(Warehouse, warehouse_id)
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


async def update_warehouse(
    db: AsyncSession, warehouse_id: uuid.UUID, data: WarehouseUpdate
) -> Warehouse:
    warehouse = await get_warehouse(db, warehouse_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(warehouse, field, value)
    await db.commit()
    await db.refresh(warehouse)
    return warehouse


async def delete_warehouse(db: AsyncSession, warehouse_id: uuid.UUID) -> None:
    warehouse = await get_warehouse(db, warehouse_id)
    await db.delete(warehouse)
    await db.commit()
