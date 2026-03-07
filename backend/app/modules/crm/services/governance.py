"""Governance alerts aggregation for CRM SOP 15."""
import uuid
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.lead import Lead
from app.modules.crm.models.ticket import Ticket


async def get_governance_alerts(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Aggregate governance issues per SOP 15."""
    from app.modules.crm.services.deal_workflows import get_stale_deals
    from app.modules.crm.services.lead_workflows import get_stale_leads

    stale_deals = await get_stale_deals(db, workspace_id, days=30)
    stale_leads = await get_stale_leads(db, workspace_id, hours=48)

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
            Ticket.created_at < (datetime.utcnow() - timedelta(days=7)),
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
    }
