import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.deal import Deal


async def get_velocity_detail(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Avg days to close per owner; identify slowest owner as bottleneck."""
    deals = list((await db.scalars(
        select(Deal).where(
            Deal.workspace_id == workspace_id,
            Deal.stage == "closed_won",
            Deal.closed_at.is_not(None),
        )
    )).all())

    owner_days: dict[str, list[float]] = {}
    for deal in deals:
        if not deal.created_at or not deal.closed_at:
            continue
        days = (deal.closed_at - deal.created_at).days
        key = str(deal.owner_id) if deal.owner_id else "unassigned"
        owner_days.setdefault(key, []).append(days)

    by_owner = []
    for owner_id, days_list in owner_days.items():
        avg = round(sum(days_list) / len(days_list), 1)
        by_owner.append({"owner_id": owner_id, "avg_days": avg, "deals_count": len(days_list)})

    by_owner.sort(key=lambda x: x["avg_days"], reverse=True)
    bottleneck = by_owner[0] if by_owner else None

    all_days = [d for days in owner_days.values() for d in days]
    overall_avg = round(sum(all_days) / len(all_days), 1) if all_days else 0.0

    return {
        "overall_avg_days": overall_avg,
        "by_owner": by_owner,
        "bottleneck": bottleneck,
        "total_closed_won": len(deals),
    }
