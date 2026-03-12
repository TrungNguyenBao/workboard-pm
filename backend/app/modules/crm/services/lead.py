import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.lead import Lead
from app.modules.crm.schemas.lead import LeadConvertRequest, LeadCreate, LeadUpdate


async def create_lead(
    db: AsyncSession, workspace_id: uuid.UUID, data: LeadCreate
) -> tuple[Lead, list[Lead]]:
    """Create lead with duplicate check and auto-scoring. Returns (lead, duplicates)."""
    from app.modules.crm.services.lead_workflows import calculate_lead_score, check_lead_duplicates

    duplicates = await check_lead_duplicates(db, workspace_id, data.email, data.phone)

    lead = Lead(workspace_id=workspace_id, **data.model_dump())
    if lead.score == 0:
        lead.score = calculate_lead_score(lead)
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead, duplicates


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
        from app.modules.crm.services.status_flows import escape_like

        pattern = f"%{escape_like(search)}%"
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
    from app.modules.crm.services.status_flows import LEAD_STATUS_TRANSITIONS, validate_transition

    lead = await get_lead(db, lead_id, workspace_id)
    updates = data.model_dump(exclude_none=True)

    if "status" in updates and updates["status"] != lead.status:
        if not validate_transition(LEAD_STATUS_TRANSITIONS, lead.status, updates["status"]):
            allowed = LEAD_STATUS_TRANSITIONS.get(lead.status, [])
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from '{lead.status}' to '{updates['status']}'. Allowed: {allowed}",
            )

    for field, value in updates.items():
        setattr(lead, field, value)
    await db.commit()
    await db.refresh(lead)
    return lead


async def delete_lead(db: AsyncSession, lead_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
    lead = await get_lead(db, lead_id, workspace_id)
    await db.delete(lead)
    await db.commit()


async def convert_lead_to_opportunity(
    db: AsyncSession,
    lead_id: uuid.UUID,
    workspace_id: uuid.UUID,
    params: LeadConvertRequest | None = None,
) -> "Deal":  # noqa: F821
    from app.modules.crm.models.contact import Contact
    from app.modules.crm.models.deal import Deal
    from app.modules.crm.services.lead_workflows import calculate_lead_score

    if params is None:
        params = LeadConvertRequest()

    lead = await get_lead(db, lead_id, workspace_id)
    if lead.status != "qualified":
        raise HTTPException(status_code=400, detail="Only qualified leads can be converted")

    contact_id: uuid.UUID | None = None
    if params.create_contact:
        existing = await db.scalar(
            select(Contact).where(
                Contact.workspace_id == workspace_id,
                Contact.email == lead.email,
            )
        ) if lead.email else None

        if existing:
            contact_id = existing.id
        else:
            contact = Contact(
                name=lead.name,
                email=lead.email,
                phone=lead.phone,
                workspace_id=workspace_id,
            )
            db.add(contact)
            await db.flush()
            contact_id = contact.id

    score = lead.score or calculate_lead_score(lead)
    prob_map = {"website": 0.3, "ads": 0.2, "form": 0.35, "referral": 0.4, "manual": 0.15}
    deal = Deal(
        title=params.deal_title or f"{lead.name} - Deal",
        value=float(params.value) if params.value is not None else float(score * 100),
        stage="qualified",
        probability=prob_map.get(lead.source, 0.2),
        expected_close_date=params.expected_close_date,
        lead_id=lead.id,
        contact_id=contact_id,
        workspace_id=workspace_id,
    )
    db.add(deal)
    lead.status = "opportunity"
    await db.commit()
    await db.refresh(deal)
    return deal
