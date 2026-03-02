import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.wms.models.supplier import Supplier
from app.modules.wms.schemas.supplier import SupplierCreate, SupplierUpdate


async def create_supplier(
    db: AsyncSession, workspace_id: uuid.UUID, data: SupplierCreate
) -> Supplier:
    supplier = Supplier(workspace_id=workspace_id, **data.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


async def list_suppliers(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Supplier], int]:
    q = select(Supplier).where(Supplier.workspace_id == workspace_id)
    count_q = select(func.count(Supplier.id)).where(Supplier.workspace_id == workspace_id)

    if search:
        pattern = f"%{search}%"
        q = q.where(Supplier.name.ilike(pattern))
        count_q = count_q.where(Supplier.name.ilike(pattern))
    if is_active is not None:
        q = q.where(Supplier.is_active == is_active)
        count_q = count_q.where(Supplier.is_active == is_active)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Supplier.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_supplier(db: AsyncSession, supplier_id: uuid.UUID) -> Supplier:
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


async def update_supplier(
    db: AsyncSession, supplier_id: uuid.UUID, data: SupplierUpdate
) -> Supplier:
    supplier = await get_supplier(db, supplier_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(supplier, field, value)
    await db.commit()
    await db.refresh(supplier)
    return supplier


async def delete_supplier(db: AsyncSession, supplier_id: uuid.UUID) -> None:
    supplier = await get_supplier(db, supplier_id)
    await db.delete(supplier)
    await db.commit()
