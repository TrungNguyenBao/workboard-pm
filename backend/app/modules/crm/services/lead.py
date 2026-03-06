import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.lead import Lead
from app.modules.crm.schemas.lead import LeadCreate, LeadUpdate


async def create_lead(db: AsyncSession, workspace_id: uuid.UUID, data: LeadCreate) -> Lead:
    lead = Lead(workspace_id=workspace_id, **data.model_dump())
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


async def list_leads(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    status_filter: str | None = None,
    source: str | None = None,
    owner_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Lead], int]:
    q = select(Lead).where(Lead.workspace_id == workspace_id)
    count_q = select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id)

    if status_filter:
        q = q.where(Lead.status == status_filter)
        count_q = count_q.where(Lead.status == status_filter)
    if source:
        q = q.where(Lead.source == source)
        count_q = count_q.where(Lead.source == source)
    if owner_id:
        q = q.where(Lead.owner_id == owner_id)
        count_q = count_q.where(Lead.owner_id == owner_id)
    if search:
        pattern = f"%{search}%"
        search_filter = Lead.name.ilike(pattern) | Lead.email.ilike(pattern)
        q = q.where(search_filter)
        count_q = count_q.where(search_filter)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Lead.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_lead(db: AsyncSession, lead_id: uuid.UUID, workspace_id: uuid.UUID) -> Lead:
    result = await db.scalars(
        select(Lead).where(Lead.id == lead_id, Lead.workspace_id == workspace_id)
    )
    lead = result.first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return lead


async def update_lead(
    db: AsyncSession, lead_id: uuid.UUID, workspace_id: uuid.UUID, data: LeadUpdate
) -> Lead:
    lead = await get_lead(db, lead_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    await db.commit()
    await db.refresh(lead)
    return lead


async def delete_lead(db: AsyncSession, lead_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
    lead = await get_lead(db, lead_id, workspace_id)
    await db.delete(lead)
    await db.commit()


async def convert_lead_to_opportunity(
    db: AsyncSession, lead_id: uuid.UUID, workspace_id: uuid.UUID
) -> "Deal":  # noqa: F821
    from app.modules.crm.models.deal import Deal

    lead = await get_lead(db, lead_id, workspace_id)
    deal = Deal(
        title=f"Opportunity: {lead.name}",
        value=0.0,
        stage="qualified",
        lead_id=lead.id,
        workspace_id=workspace_id,
    )
    db.add(deal)
    lead.status = "opportunity"
    await db.commit()
    await db.refresh(deal)
    return deal
