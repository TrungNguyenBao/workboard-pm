"""Lead workflow operations: duplicate check, scoring, distribution, stale detection."""
import uuid
from datetime import datetime, timedelta

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import WorkspaceMembership
from app.modules.crm.models.lead import Lead


async def check_lead_duplicates(
    db: AsyncSession, workspace_id: uuid.UUID, email: str | None, phone: str | None
) -> list[Lead]:
    """Return existing leads matching email or phone within workspace."""
    if not email and not phone:
        return []
    conditions = []
    if email:
        conditions.append(Lead.email == email)
    if phone:
        conditions.append(Lead.phone == phone)
    q = select(Lead).where(Lead.workspace_id == workspace_id, or_(*conditions))
    result = await db.scalars(q)
    return list(result.all())


def calculate_lead_score(lead: Lead) -> int:
    """Score lead based on source quality + data completeness (0-100)."""
    score = 0
    source_scores = {"website": 15, "ads": 10, "form": 20, "referral": 25, "manual": 5}
    score += source_scores.get(lead.source, 5)
    if lead.email:
        score += 20
    if lead.phone:
        score += 15
    if lead.campaign_id:
        score += 10
    if lead.name and len(lead.name) > 3:
        score += 10
    return min(score, 100)


async def get_stale_leads(
    db: AsyncSession, workspace_id: uuid.UUID, hours: int = 48
) -> list[Lead]:
    """Leads with status='new' created more than `hours` ago."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    q = select(Lead).where(
        Lead.workspace_id == workspace_id,
        Lead.status == "new",
        Lead.created_at < cutoff,
    )
    result = await db.scalars(q)
    return list(result.all())


async def distribute_leads(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[Lead]:
    """Assign unassigned new leads to workspace members via round-robin."""
    unassigned = await db.scalars(
        select(Lead).where(
            Lead.workspace_id == workspace_id,
            Lead.owner_id.is_(None),
            Lead.status == "new",
        ).order_by(Lead.created_at)
    )
    leads = list(unassigned.all())
    if not leads:
        return []

    members = await db.scalars(
        select(WorkspaceMembership.user_id).where(
            WorkspaceMembership.workspace_id == workspace_id
        )
    )
    member_ids = list(members.all())
    if not member_ids:
        return []

    last_assigned = await db.scalar(
        select(Lead.owner_id).where(
            Lead.workspace_id == workspace_id,
            Lead.owner_id.isnot(None),
        ).order_by(Lead.assigned_at.desc().nullslast()).limit(1)
    )
    start_idx = 0
    if last_assigned and last_assigned in member_ids:
        start_idx = (member_ids.index(last_assigned) + 1) % len(member_ids)

    now = datetime.utcnow()
    for i, lead in enumerate(leads):
        idx = (start_idx + i) % len(member_ids)
        lead.owner_id = member_ids[idx]
        lead.assigned_at = now

    await db.commit()
    return leads
