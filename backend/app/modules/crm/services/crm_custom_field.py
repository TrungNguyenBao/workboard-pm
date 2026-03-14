import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.crm_custom_field import CrmCustomField
from app.modules.crm.schemas.crm_custom_field import CrmCustomFieldCreate, CrmCustomFieldUpdate


async def create_custom_field(
    db: AsyncSession, workspace_id: uuid.UUID, data: CrmCustomFieldCreate
) -> CrmCustomField:
    field = CrmCustomField(workspace_id=workspace_id, **data.model_dump())
    db.add(field)
    try:
        await db.commit()
        await db.refresh(field)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Field name already exists for this entity type")
    return field


async def list_custom_fields(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    entity_type: str | None = None,
) -> list[CrmCustomField]:
    q = select(CrmCustomField).where(CrmCustomField.workspace_id == workspace_id)
    if entity_type:
        q = q.where(CrmCustomField.entity_type == entity_type)
    q = q.order_by(CrmCustomField.entity_type, CrmCustomField.position)
    result = await db.scalars(q)
    return list(result.all())


async def get_custom_field(
    db: AsyncSession, field_id: uuid.UUID, workspace_id: uuid.UUID
) -> CrmCustomField:
    result = await db.scalars(
        select(CrmCustomField).where(
            CrmCustomField.id == field_id,
            CrmCustomField.workspace_id == workspace_id,
        )
    )
    field = result.first()
    if not field:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom field not found")
    return field


async def update_custom_field(
    db: AsyncSession,
    field_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: CrmCustomFieldUpdate,
) -> CrmCustomField:
    field = await get_custom_field(db, field_id, workspace_id)
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(field, key, value)
    await db.commit()
    await db.refresh(field)
    return field


async def delete_custom_field(
    db: AsyncSession, field_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    field = await get_custom_field(db, field_id, workspace_id)
    await db.delete(field)
    await db.commit()
