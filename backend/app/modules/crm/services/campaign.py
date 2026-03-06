import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.campaign import Campaign
from app.modules.crm.schemas.campaign import CampaignCreate, CampaignUpdate


async def create_campaign(db: AsyncSession, workspace_id: uuid.UUID, data: CampaignCreate) -> Campaign:
    campaign = Campaign(workspace_id=workspace_id, **data.model_dump())
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def list_campaigns(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    status_filter: str | None = None,
    type_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Campaign], int]:
    q = select(Campaign).where(Campaign.workspace_id == workspace_id)
    count_q = select(func.count(Campaign.id)).where(Campaign.workspace_id == workspace_id)

    if status_filter:
        q = q.where(Campaign.status == status_filter)
        count_q = count_q.where(Campaign.status == status_filter)
    if type_filter:
        q = q.where(Campaign.type == type_filter)
        count_q = count_q.where(Campaign.type == type_filter)
    if search:
        pattern = f"%{search}%"
        q = q.where(Campaign.name.ilike(pattern))
        count_q = count_q.where(Campaign.name.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Campaign.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_campaign(db: AsyncSession, campaign_id: uuid.UUID, workspace_id: uuid.UUID) -> Campaign:
    result = await db.scalars(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.workspace_id == workspace_id)
    )
    campaign = result.first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


async def get_campaign_stats(db: AsyncSession, campaign_id: uuid.UUID, workspace_id: uuid.UUID) -> dict:
    """Get lead count and conversion stats for a campaign."""
    from app.modules.crm.models.lead import Lead

    campaign = await get_campaign(db, campaign_id, workspace_id)
    total_leads = await db.scalar(
        select(func.count(Lead.id)).where(Lead.campaign_id == campaign_id)
    ) or 0
    converted_leads = await db.scalar(
        select(func.count(Lead.id)).where(Lead.campaign_id == campaign_id, Lead.status == "opportunity")
    ) or 0

    return {
        "campaign": campaign,
        "total_leads": total_leads,
        "converted_leads": converted_leads,
        "conversion_rate": (converted_leads / total_leads * 100) if total_leads > 0 else 0,
    }


async def update_campaign(
    db: AsyncSession, campaign_id: uuid.UUID, workspace_id: uuid.UUID, data: CampaignUpdate
) -> Campaign:
    campaign = await get_campaign(db, campaign_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(campaign, field, value)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def delete_campaign(db: AsyncSession, campaign_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
    campaign = await get_campaign(db, campaign_id, workspace_id)
    await db.delete(campaign)
    await db.commit()
