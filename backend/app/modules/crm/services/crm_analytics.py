import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.activity import Activity
from app.modules.crm.models.campaign import Campaign
from app.modules.crm.models.contact import Contact
from app.modules.crm.models.deal import Deal
from app.modules.crm.models.lead import Lead
from app.modules.crm.models.ticket import Ticket


def _date_filter(col, start: date | None, end: date | None):
    """Build date range filter conditions."""
    conditions = []
    if start:
        conditions.append(col >= datetime(start.year, start.month, start.day, tzinfo=timezone.utc))
    if end:
        next_day = datetime(end.year, end.month, end.day, tzinfo=timezone.utc) + timedelta(days=1)
        conditions.append(col < next_day)
    return conditions


async def get_crm_analytics(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    """Aggregate CRM analytics for the workspace dashboard."""
    date_conds = _date_filter(Deal.created_at, start_date, end_date)

    total_contacts = await db.scalar(
        select(func.count(Contact.id)).where(Contact.workspace_id == workspace_id)
    ) or 0
    total_deals = await db.scalar(
        select(func.count(Deal.id)).where(Deal.workspace_id == workspace_id, *date_conds)
    ) or 0
    total_activities = await db.scalar(
        select(func.count(Activity.id)).where(Activity.workspace_id == workspace_id)
    ) or 0

    # Deal aggregations
    deal_q = select(Deal).where(Deal.workspace_id == workspace_id, *date_conds)
    deals = list((await db.scalars(deal_q)).all())

    pipeline_value = sum(d.value for d in deals)
    deals_won = sum(1 for d in deals if d.stage == "closed_won")
    deals_lost = sum(1 for d in deals if d.stage == "closed_lost")
    deals_closed = deals_won + deals_lost
    win_rate = (deals_won / deals_closed * 100) if deals_closed > 0 else 0

    stage_values: dict[str, float] = {}
    stage_counts: dict[str, int] = {}
    for d in deals:
        stage_values[d.stage] = stage_values.get(d.stage, 0) + d.value
        stage_counts[d.stage] = stage_counts.get(d.stage, 0) + 1

    # Lead stats
    leads = list((await db.scalars(
        select(Lead).where(Lead.workspace_id == workspace_id)
    )).all())
    lead_source_counts: dict[str, int] = {}
    lead_status_counts: dict[str, int] = {}
    for ld in leads:
        lead_source_counts[ld.source] = lead_source_counts.get(ld.source, 0) + 1
        lead_status_counts[ld.status] = lead_status_counts.get(ld.status, 0) + 1

    converted_leads = lead_status_counts.get("opportunity", 0)
    lead_conversion_rate = (converted_leads / len(leads) * 100) if leads else 0

    # Campaign totals
    campaigns = list((await db.scalars(
        select(Campaign).where(Campaign.workspace_id == workspace_id)
    )).all())
    total_campaign_budget = sum(c.budget for c in campaigns)
    total_campaign_cost = sum(c.actual_cost for c in campaigns)

    open_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.workspace_id == workspace_id,
            Ticket.status.in_(["open", "in_progress"]),
        )
    ) or 0

    # Sales funnel (SOP 13)
    qualified = lead_status_counts.get("qualified", 0) + converted_leads
    sales_funnel = {
        "total_leads": len(leads),
        "qualified": qualified,
        "opportunity": converted_leads,
        "closed_won": deals_won,
    }

    # Deal velocity: avg days for closed deals
    closed_deals = [d for d in deals if d.closed_at and d.created_at]
    if closed_deals:
        total_days = sum((d.closed_at - d.created_at).days for d in closed_deals)
        deal_velocity_days = round(total_days / len(closed_deals), 1)
    else:
        deal_velocity_days = 0

    # Deal velocity by stage: compute avg days per stage using closed deals
    stage_velocity: list[dict] = []
    stage_days: dict[str, list[float]] = {}
    for d in closed_deals:
        stage_days.setdefault(d.stage, []).append((d.closed_at - d.created_at).days)
    for stage_name, days_list in stage_days.items():
        stage_velocity.append({
            "stage": stage_name,
            "avg_days": round(sum(days_list) / len(days_list), 1),
        })

    return {
        "total_contacts": total_contacts,
        "total_deals": total_deals,
        "total_leads": len(leads),
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
        "sales_funnel": sales_funnel,
        "deal_velocity_days": deal_velocity_days,
        "deal_velocity_by_stage": stage_velocity,
    }
