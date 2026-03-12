"""Lead workflow operations: duplicate check, scoring, distribution, stale detection."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import WorkspaceMembership
from app.modules.crm.models.activity import Activity
from app.modules.crm.models.lead import Lead


async def check_lead_duplicates(
    db: AsyncSession, workspace_id: uuid.UUID, email: str | None, phone: str | None
) -> list[Lead]:
    """Return existing leads matching email (case-insensitive) or phone within workspace."""
    if not email and not phone:
        return []
    conditions = []
    if email:
        conditions.append(func.lower(Lead.email) == func.lower(email))
    if phone:
        conditions.append(Lead.phone == phone)
    q = select(Lead).where(Lead.workspace_id == workspace_id, or_(*conditions))
    result = await db.scalars(q)
    return list(result.all())


async def merge_leads(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    keep_id: uuid.UUID,
    merge_id: uuid.UUID,
) -> Lead:
    """Merge merge_id into keep_id: copy non-null fields, transfer activities, delete merge_id."""
    from app.modules.crm.services.lead import get_lead

    keep = await get_lead(db, keep_id, workspace_id)
    source = await get_lead(db, merge_id, workspace_id)

    # Copy non-null fields from source only if keep field is empty/null
    fill_fields = ["email", "phone", "source", "owner_id", "campaign_id", "contacted_at", "assigned_at"]
    for field in fill_fields:
        if not getattr(keep, field) and getattr(source, field):
            setattr(keep, field, getattr(source, field))

    # Keep higher score
    if source.score > keep.score:
        keep.score = source.score

    await db.delete(source)
    await db.commit()
    await db.refresh(keep)
    return keep


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


def get_score_level(score: int) -> str:
    """Return score level label based on numeric score."""
    if score <= 30:
        return "cold"
    if score <= 60:
        return "warm"
    return "hot"


async def get_stale_leads(
    db: AsyncSession, workspace_id: uuid.UUID, days: int = 30
) -> list[Lead]:
    """Leads with no activity for `days` days (excludes closed/disqualified).
    Uses latest activity date; falls back to contacted_at then created_at."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    # Subquery: latest activity date per lead
    latest_activity_sq = (
        select(Activity.lead_id, func.max(Activity.date).label("last_activity"))
        .where(Activity.workspace_id == workspace_id)
        .group_by(Activity.lead_id)
        .subquery()
    )
    active_statuses = ["lost", "disqualified", "opportunity"]
    q = (
        select(Lead)
        .outerjoin(latest_activity_sq, Lead.id == latest_activity_sq.c.lead_id)
        .where(
            Lead.workspace_id == workspace_id,
            Lead.status.notin_(active_statuses),
            or_(
                # Has activities but none recent
                (latest_activity_sq.c.last_activity != None) & (latest_activity_sq.c.last_activity < cutoff),  # noqa: E711
                # No activities — use contacted_at or created_at as fallback
                (latest_activity_sq.c.last_activity == None) & (  # noqa: E711
                    func.coalesce(Lead.contacted_at, Lead.created_at) < cutoff
                ),
            ),
        )
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

    now = datetime.now(timezone.utc)
    for i, lead in enumerate(leads):
        idx = (start_idx + i) % len(member_ids)
        lead.owner_id = member_ids[idx]
        lead.assigned_at = now

    await db.commit()
    return leads
