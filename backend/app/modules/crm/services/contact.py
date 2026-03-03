import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.contact import Contact
from app.modules.crm.schemas.contact import ContactCreate, ContactUpdate


async def create_contact(
    db: AsyncSession, workspace_id: uuid.UUID, data: ContactCreate
) -> Contact:
    contact = Contact(workspace_id=workspace_id, **data.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def list_contacts(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Contact], int]:
    q = select(Contact).where(Contact.workspace_id == workspace_id)
    count_q = select(func.count(Contact.id)).where(Contact.workspace_id == workspace_id)

    if search:
        pattern = f"%{search}%"
        search_filter = (
            Contact.name.ilike(pattern)
            | Contact.email.ilike(pattern)
            | Contact.company.ilike(pattern)
        )
        q = q.where(search_filter)
        count_q = count_q.where(search_filter)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Contact.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_contact(
    db: AsyncSession, contact_id: uuid.UUID, workspace_id: uuid.UUID
) -> Contact:
    """Fetch contact by id, enforcing workspace ownership (returns 404 on mismatch)."""
    result = await db.scalars(
        select(Contact).where(Contact.id == contact_id, Contact.workspace_id == workspace_id)
    )
    contact = result.first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


async def update_contact(
    db: AsyncSession, contact_id: uuid.UUID, workspace_id: uuid.UUID, data: ContactUpdate
) -> Contact:
    contact = await get_contact(db, contact_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(contact, field, value)
    await db.commit()
    await db.refresh(contact)
    return contact


async def delete_contact(
    db: AsyncSession, contact_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    contact = await get_contact(db, contact_id, workspace_id)
    await db.delete(contact)
    await db.commit()
