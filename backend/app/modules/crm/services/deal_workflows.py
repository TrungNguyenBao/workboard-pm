"""Deal workflow operations: stage validation, close workflow, stale detection."""
import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.account import Account
from app.modules.crm.models.contact import Contact
from app.modules.crm.models.deal import Deal
from app.modules.crm.services.status_flows import DEAL_STAGE_TRANSITIONS, validate_transition


def validate_stage_change(current: str, target: str) -> None:
    """Raise 400 if stage transition is invalid."""
    if not validate_transition(DEAL_STAGE_TRANSITIONS, current, target):
        allowed = DEAL_STAGE_TRANSITIONS.get(current, [])
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current}' to '{target}'. Allowed: {allowed}",
        )


async def get_stale_deals(
    db: AsyncSession, workspace_id: uuid.UUID, days: int = 30
) -> list[Deal]:
    """Deals with no activity for more than `days` days (excluding closed)."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    closed = ["closed_won", "closed_lost"]
    q = select(Deal).where(
        Deal.workspace_id == workspace_id,
        Deal.stage.notin_(closed),
        or_(
            Deal.last_activity_date < cutoff,
            and_(Deal.last_activity_date.is_(None), Deal.created_at < cutoff),
        ),
    )
    result = await db.scalars(q)
    return list(result.all())


async def close_deal(
    db: AsyncSession,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
    action: str,
    loss_reason: str | None = None,
    user_id: uuid.UUID | None = None,
) -> Deal:
    """Close a deal as won or lost with appropriate side effects."""
    from app.modules.crm.services.deal import get_deal

    deal = await get_deal(db, deal_id, workspace_id)
    now = datetime.utcnow()

    if deal.stage in ("closed_won", "closed_lost"):
        raise HTTPException(400, "Deal is already closed")

    if action == "won":
        deal.stage = "closed_won"
        deal.probability = 1.0
        deal.closed_at = now
        if not deal.account_id:
            account = Account(
                name=deal.title.replace("Opportunity: ", ""),
                total_revenue=deal.value,
                source_deal_id=deal.id,
                workspace_id=workspace_id,
            )
            db.add(account)
            await db.flush()
            deal.account_id = account.id
            if deal.contact_id:
                contact = await db.get(Contact, deal.contact_id)
                if contact:
                    contact.account_id = account.id
    elif action == "lost":
        if not loss_reason:
            raise HTTPException(400, "loss_reason is required for closed_lost")
        deal.stage = "closed_lost"
        deal.probability = 0.0
        deal.closed_at = now
        deal.loss_reason = loss_reason
    else:
        raise HTTPException(400, f"Invalid close action: {action}")

    if user_id:
        deal.last_updated_by = user_id

    await db.commit()
    await db.refresh(deal)
    return deal
