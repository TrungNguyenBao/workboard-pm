import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.hrm.models.asset import Asset
from app.modules.hrm.schemas.asset import AssetCreate, AssetUpdate


async def create_asset(db: AsyncSession, workspace_id: uuid.UUID, data: AssetCreate) -> Asset:
    asset = Asset(workspace_id=workspace_id, **data.model_dump())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


async def list_assets(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    asset_status: str | None = None,
    category: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Asset], int]:
    q = select(Asset).where(Asset.workspace_id == workspace_id)
    count_q = select(func.count(Asset.id)).where(Asset.workspace_id == workspace_id)

    if asset_status:
        q = q.where(Asset.status == asset_status)
        count_q = count_q.where(Asset.status == asset_status)
    if category:
        q = q.where(Asset.category == category)
        count_q = count_q.where(Asset.category == category)
    if search:
        pattern = f"%{search}%"
        cond = or_(Asset.name.ilike(pattern), Asset.serial_number.ilike(pattern))
        q = q.where(cond)
        count_q = count_q.where(cond)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Asset.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_asset(db: AsyncSession, asset_id: uuid.UUID, workspace_id: uuid.UUID) -> Asset:
    result = await db.scalars(
        select(Asset).where(Asset.id == asset_id, Asset.workspace_id == workspace_id)
    )
    asset = result.first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


async def update_asset(
    db: AsyncSession, asset_id: uuid.UUID, workspace_id: uuid.UUID, data: AssetUpdate
) -> Asset:
    asset = await get_asset(db, asset_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(asset, field, value)
    await db.commit()
    await db.refresh(asset)
    return asset


async def set_asset_status(
    db: AsyncSession, asset_id: uuid.UUID, workspace_id: uuid.UUID, new_status: str
) -> Asset:
    asset = await get_asset(db, asset_id, workspace_id)
    asset.status = new_status
    await db.commit()
    await db.refresh(asset)
    return asset


async def delete_asset(db: AsyncSession, asset_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
    asset = await get_asset(db, asset_id, workspace_id)
    await db.delete(asset)
    await db.commit()
