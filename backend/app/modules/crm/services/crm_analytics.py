import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.activity import Activity
from app.modules.crm.models.campaign import Campaign
from app.modules.crm.models.contact import Contact
from app.modules.crm.models.deal import Deal
from app.modules.crm.models.lead import Lead
from app.modules.crm.models.ticket import Ticket


async def get_crm_analytics(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Aggregate CRM analytics for the workspace dashboard."""
    # Core counts
    total_contacts = await db.scalar(
        select(func.count(Contact.id)).where(Contact.workspace_id == workspace_id)
    ) or 0
    total_deals = await db.scalar(
        select(func.count(Deal.id)).where(Deal.workspace_id == workspace_id)
    ) or 0
    total_leads = await db.scalar(
        select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id)
    ) or 0
    total_activities = await db.scalar(
        select(func.count(Activity.id)).where(Activity.workspace_id == workspace_id)
    ) or 0

    # Deal aggregations
    deals_result = await db.scalars(
        select(Deal).where(Deal.workspace_id == workspace_id)
    )
    deals = list(deals_result.all())

    pipeline_value = sum(d.value for d in deals)
    deals_won = sum(1 for d in deals if d.stage == "closed_won")
    deals_lost = sum(1 for d in deals if d.stage == "closed_lost")
    deals_closed = deals_won + deals_lost
    win_rate = (deals_won / deals_closed * 100) if deals_closed > 0 else 0

    # Pipeline value by stage
    stage_values: dict[str, float] = {}
    stage_counts: dict[str, int] = {}
    for d in deals:
        stage_values[d.stage] = stage_values.get(d.stage, 0) + d.value
        stage_counts[d.stage] = stage_counts.get(d.stage, 0) + 1

    # Lead stats
    lead_results = await db.scalars(
        select(Lead).where(Lead.workspace_id == workspace_id)
    )
    leads = list(lead_results.all())

    lead_source_counts: dict[str, int] = {}
    lead_status_counts: dict[str, int] = {}
    for ld in leads:
        lead_source_counts[ld.source] = lead_source_counts.get(ld.source, 0) + 1
        lead_status_counts[ld.status] = lead_status_counts.get(ld.status, 0) + 1

    converted_leads = lead_status_counts.get("opportunity", 0)
    lead_conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0

    # Campaign ROI
    campaigns_result = await db.scalars(
        select(Campaign).where(Campaign.workspace_id == workspace_id)
    )
    campaigns = list(campaigns_result.all())
    total_campaign_budget = sum(c.budget for c in campaigns)
    total_campaign_cost = sum(c.actual_cost for c in campaigns)

    # Open tickets
    open_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.workspace_id == workspace_id,
            Ticket.status.in_(["open", "in_progress"]),
        )
    ) or 0

    return {
        "total_contacts": total_contacts,
        "total_deals": total_deals,
        "total_leads": total_leads,
        "total_activities": total_activities,
        "pipeline_value": pipeline_value,
        "deals_won": deals_won,
        "deals_lost": deals_lost,
        "win_rate": round(win_rate, 1),
        "stage_values": stage_values,
        "stage_counts": stage_counts,
        "lead_source_counts": lead_source_counts,
        "lead_status_counts": lead_status_counts,
        "lead_conversion_rate": round(lead_conversion_rate, 1),
        "total_campaign_budget": total_campaign_budget,
        "total_campaign_cost": total_campaign_cost,
        "open_tickets": open_tickets,
    }
