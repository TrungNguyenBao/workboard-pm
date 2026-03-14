import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.deal_contact_role import DealContactRole
from app.modules.crm.schemas.deal_contact_role import DealContactRoleCreate, DealContactRoleUpdate


async def add_contact_to_deal(
    db: AsyncSession,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: DealContactRoleCreate,
) -> DealContactRole:
    # Check for existing (deal_id, contact_id) pair
    existing = await db.scalars(
        select(DealContactRole).where(
            DealContactRole.deal_id == deal_id,
            DealContactRole.contact_id == data.contact_id,
        )
    )
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contact already linked to this deal",
        )

    if data.is_primary:
        await _unset_primary(db, deal_id)

    item = DealContactRole(
        deal_id=deal_id,
        workspace_id=workspace_id,
        **data.model_dump(),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_deal_contacts(
    db: AsyncSession, deal_id: uuid.UUID, workspace_id: uuid.UUID
) -> list[DealContactRole]:
    result = await db.scalars(
        select(DealContactRole).where(
            DealContactRole.deal_id == deal_id,
            DealContactRole.workspace_id == workspace_id,
        ).order_by(DealContactRole.is_primary.desc(), DealContactRole.created_at)
    )
    return list(result.all())


async def get_deal_contact_role(
    db: AsyncSession, role_id: uuid.UUID, deal_id: uuid.UUID, workspace_id: uuid.UUID
) -> DealContactRole:
    result = await db.scalars(
        select(DealContactRole).where(
            DealContactRole.id == role_id,
            DealContactRole.deal_id == deal_id,
            DealContactRole.workspace_id == workspace_id,
        )
    )
    item = result.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal contact role not found")
    return item


async def update_role(
    db: AsyncSession,
    role_id: uuid.UUID,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: DealContactRoleUpdate,
) -> DealContactRole:
    item = await get_deal_contact_role(db, role_id, deal_id, workspace_id)

    if data.is_primary:
        await _unset_primary(db, deal_id)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def remove_contact_from_deal(
    db: AsyncSession, role_id: uuid.UUID, deal_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    item = await get_deal_contact_role(db, role_id, deal_id, workspace_id)
    await db.delete(item)
    await db.commit()


async def _unset_primary(db: AsyncSession, deal_id: uuid.UUID) -> None:
    """Clear is_primary flag for all contacts on this deal before setting a new primary."""
    await db.execute(
        update(DealContactRole)
        .where(DealContactRole.deal_id == deal_id, DealContactRole.is_primary == True)  # noqa: E712
        .values(is_primary=False)
    )
