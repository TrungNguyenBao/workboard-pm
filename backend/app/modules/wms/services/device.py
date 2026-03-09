import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.wms.models.device import Device
from app.modules.wms.models.product import Product


async def create_device(
    db: AsyncSession, workspace_id: uuid.UUID, data: dict
) -> Device:
    # Validate product exists and is serial-tracked
    product = await db.scalar(select(Product).where(Product.id == data["product_id"]))
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if not product.is_serial_tracked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is not serial-tracked. Only serial-tracked products can have devices registered.",
        )

    # Check serial uniqueness within workspace
    existing = await db.scalar(
        select(Device).where(
            Device.workspace_id == workspace_id,
            Device.serial_number == data["serial_number"],
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number already exists in this workspace",
        )

    device = Device(workspace_id=workspace_id, **data)
    db.add(device)
    await db.commit()
    await db.refresh(device, attribute_names=["product", "warehouse"])
    return device


async def list_devices(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    product_id: uuid.UUID | None = None,
    warehouse_id: uuid.UUID | None = None,
    device_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Device], int]:
    base = Device.workspace_id == workspace_id
    q = select(Device).where(base).options(selectinload(Device.product), selectinload(Device.warehouse))
    count_q = select(func.count(Device.id)).where(base)

    if search:
        pattern = f"%{search}%"
        q = q.where(Device.serial_number.ilike(pattern))
        count_q = count_q.where(Device.serial_number.ilike(pattern))
    if product_id:
        q = q.where(Device.product_id == product_id)
        count_q = count_q.where(Device.product_id == product_id)
    if warehouse_id:
        q = q.where(Device.warehouse_id == warehouse_id)
        count_q = count_q.where(Device.warehouse_id == warehouse_id)
    if device_status:
        q = q.where(Device.status == device_status)
        count_q = count_q.where(Device.status == device_status)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Device.serial_number).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_device(db: AsyncSession, device_id: uuid.UUID) -> Device:
    result = await db.scalars(
        select(Device)
        .where(Device.id == device_id)
        .options(selectinload(Device.product), selectinload(Device.warehouse))
    )
    device = result.first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


async def update_device(
    db: AsyncSession, device_id: uuid.UUID, data: dict
) -> Device:
    device = await get_device(db, device_id)
    for field, value in data.items():
        if value is not None:
            setattr(device, field, value)
    await db.commit()
    await db.refresh(device, attribute_names=["product", "warehouse"])
    return device


async def retire_device(db: AsyncSession, device_id: uuid.UUID) -> Device:
    device = await get_device(db, device_id)
    device.status = "retired"
    await db.commit()
    await db.refresh(device, attribute_names=["product", "warehouse"])
    return device
