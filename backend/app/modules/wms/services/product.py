import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.wms.models.product import Product
from app.modules.wms.schemas.product import ProductCreate, ProductUpdate


async def create_product(
    db: AsyncSession, workspace_id: uuid.UUID, data: ProductCreate
) -> Product:
    product = Product(workspace_id=workspace_id, **data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def list_products(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    category: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Product], int]:
    q = select(Product).where(Product.workspace_id == workspace_id)
    count_q = select(func.count(Product.id)).where(Product.workspace_id == workspace_id)

    if search:
        pattern = f"%{search}%"
        q = q.where(Product.name.ilike(pattern) | Product.sku.ilike(pattern))
        count_q = count_q.where(Product.name.ilike(pattern) | Product.sku.ilike(pattern))
    if category:
        q = q.where(Product.category == category)
        count_q = count_q.where(Product.category == category)
    if is_active is not None:
        q = q.where(Product.is_active == is_active)
        count_q = count_q.where(Product.is_active == is_active)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Product.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


async def update_product(
    db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate
) -> Product:
    product = await get_product(db, product_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    product = await get_product(db, product_id)
    await db.delete(product)
    await db.commit()
