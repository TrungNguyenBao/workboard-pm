"""Governance alerts aggregation for CRM SOP 15."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.activity import Activity
from app.modules.crm.models.deal import Deal
from app.modules.crm.models.lead import Lead
from app.modules.crm.models.ticket import Ticket

HIGH_VALUE_THRESHOLD = 10_000.0  # deals above this value are considered high-value


async def get_governance_alerts(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Aggregate governance issues per SOP 15."""
    from app.modules.crm.services.deal_workflows import get_stale_deals
    from app.modules.crm.services.lead_workflows import get_stale_leads

    stale_deals = await get_stale_deals(db, workspace_id, days=30)
    stale_leads = await get_stale_leads(db, workspace_id, days=30)

    # Unassigned leads
    unassigned_leads = await db.scalar(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == workspace_id,
            Lead.owner_id.is_(None),
            Lead.status == "new",
        )
    ) or 0

    # Overdue tickets (open/in_progress > 7 days)
    overdue_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.workspace_id == workspace_id,
            Ticket.status.in_(["open", "in_progress"]),
            Ticket.created_at < (datetime.now(timezone.utc) - timedelta(days=7)),
        )
    ) or 0

    # Deals with missing/zero value (data quality risk)
    missing_deal_values = await db.scalar(
        select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.stage.notin_(["closed_won", "closed_lost"]),
            or_(Deal.value.is_(None), Deal.value == 0),
        )
    ) or 0

    # High-value deals with no activity in 30 days
    cutoff_30 = datetime.now(timezone.utc) - timedelta(days=30)
    active_deal_ids_q = (
        select(Activity.deal_id)
        .where(
            Activity.workspace_id == workspace_id,
            Activity.date > cutoff_30,
            Activity.deal_id.isnot(None),
        )
        .distinct()
    )
    high_value_no_activity = await db.scalar(
        select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.value > HIGH_VALUE_THRESHOLD,
            Deal.stage.notin_(["closed_won", "closed_lost"]),
            Deal.id.notin_(active_deal_ids_q),
        )
    ) or 0

    return {
        "stale_deals_count": len(stale_deals),
        "stale_deals": [
            {"id": str(d.id), "title": d.title, "stage": d.stage}
            for d in stale_deals[:10]
        ],
        "stale_leads_count": len(stale_leads),
        "unassigned_leads": unassigned_leads,
        "overdue_tickets": overdue_tickets,
        "missing_deal_values": missing_deal_values,
        "high_value_no_activity": high_value_no_activity,
    }
