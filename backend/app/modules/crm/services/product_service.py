import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.product_service import ProductService
from app.modules.crm.schemas.product_service import ProductServiceCreate, ProductServiceUpdate
from app.modules.crm.services.status_flows import escape_like


async def create_product_service(
    db: AsyncSession, workspace_id: uuid.UUID, data: ProductServiceCreate, created_by: uuid.UUID | None = None
) -> ProductService:
    item = ProductService(workspace_id=workspace_id, created_by=created_by, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_product_services(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    type: str | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[ProductService], int]:
    q = select(ProductService).where(ProductService.workspace_id == workspace_id)
    count_q = select(func.count(ProductService.id)).where(ProductService.workspace_id == workspace_id)

    if type:
        q = q.where(ProductService.type == type)
        count_q = count_q.where(ProductService.type == type)
    if is_active is not None:
        q = q.where(ProductService.is_active == is_active)
        count_q = count_q.where(ProductService.is_active == is_active)
    if search:
        pattern = f"%{escape_like(search)}%"
        q = q.where(ProductService.name.ilike(pattern))
        count_q = count_q.where(ProductService.name.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(ProductService.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_product_service(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID
) -> ProductService:
    result = await db.scalars(
        select(ProductService).where(
            ProductService.id == item_id, ProductService.workspace_id == workspace_id
        )
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product/service not found")
    return item


async def update_product_service(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID, data: ProductServiceUpdate
) -> ProductService:
    item = await get_product_service(db, item_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def deactivate_product_service(
    db: AsyncSession, item_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    """Soft-delete: set is_active=False instead of deleting the record."""
    item = await get_product_service(db, item_id, workspace_id)
    item.is_active = False
    await db.commit()
