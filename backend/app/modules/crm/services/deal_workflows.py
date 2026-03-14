"""Deal workflow operations: stage validation, close workflow, stale detection."""
import uuid
from datetime import datetime, timedelta, timezone

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
    db: AsyncSession,
    workspace_id: uuid.UUID,
    general_days: int = 60,
    high_value_days: int = 30,
    high_value_threshold: float = 500_000_000,
) -> list[Deal]:
    """Deals with no activity beyond thresholds (excluding closed).

    High-value deals (>= high_value_threshold) use a tighter window.
    """
    now = datetime.now(timezone.utc)
    general_cutoff = now - timedelta(days=general_days)
    high_value_cutoff = now - timedelta(days=high_value_days)
    closed = ["closed_won", "closed_lost"]

    q = select(Deal).where(
        Deal.workspace_id == workspace_id,
        Deal.stage.notin_(closed),
        or_(
            and_(
                Deal.value >= high_value_threshold,
                or_(
                    Deal.last_activity_date < high_value_cutoff,
                    and_(Deal.last_activity_date.is_(None), Deal.created_at < high_value_cutoff),
                ),
            ),
            and_(
                Deal.value < high_value_threshold,
                or_(
                    Deal.last_activity_date < general_cutoff,
                    and_(Deal.last_activity_date.is_(None), Deal.created_at < general_cutoff),
                ),
            ),
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
    competitor_id: uuid.UUID | None = None,
) -> Deal:
    """Close a deal as won or lost with appropriate side effects."""
    from app.modules.crm.services.account import recalculate_account_revenue
    from app.modules.crm.services.deal import get_deal

    deal = await get_deal(db, deal_id, workspace_id)
    now = datetime.now(timezone.utc)

    if deal.stage in ("closed_won", "closed_lost"):
        raise HTTPException(400, "Deal is already closed")

    if action == "won":
        deal.stage = "closed_won"
        deal.probability = 1.0
        deal.closed_at = now
        if competitor_id:
            deal.competitor_id = competitor_id
        account_id = deal.account_id
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
            account_id = account.id
            if deal.contact_id:
                contact = await db.get(Contact, deal.contact_id)
                if contact:
                    contact.account_id = account.id

        # Auto-create Contract on won
        from datetime import date as date_type

        from app.modules.crm.models.contract import Contract
        contract = Contract(
            deal_id=deal.id,
            account_id=account_id,
            contract_number=f"CT-{date_type.today().strftime('%Y%m%d')}-{str(deal.id)[:8]}",
            title=f"Contract - {deal.title}",
            value=deal.value,
            start_date=date_type.today(),
            status="draft",
            workspace_id=workspace_id,
            created_by=user_id,
        )
        db.add(contract)
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

    if deal.account_id:
        await recalculate_account_revenue(db, deal.account_id, workspace_id)

    return deal


async def reopen_deal(
    db: AsyncSession,
    deal_id: uuid.UUID,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
) -> Deal:
    """Reopen a closed deal, resetting it to negotiation stage."""
    from app.modules.crm.services.account import recalculate_account_revenue
    from app.modules.crm.services.deal import get_deal

    deal = await get_deal(db, deal_id, workspace_id)
    if deal.stage not in ("closed_won", "closed_lost"):
        raise HTTPException(400, "Only closed deals can be reopened")

    account_id = deal.account_id
    deal.stage = "negotiation"
    deal.probability = 75.0
    deal.closed_at = None
    deal.loss_reason = None
    if user_id:
        deal.last_updated_by = user_id

    await db.commit()
    await db.refresh(deal)

    if account_id:
        await recalculate_account_revenue(db, account_id, workspace_id)

    return deal
