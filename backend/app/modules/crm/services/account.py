import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.account import Account
from app.modules.crm.schemas.account import AccountCreate, AccountUpdate


async def create_account(db: AsyncSession, workspace_id: uuid.UUID, data: AccountCreate) -> Account:
    account = Account(workspace_id=workspace_id, **data.model_dump())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


async def list_accounts(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    status_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Account], int]:
    q = select(Account).where(Account.workspace_id == workspace_id)
    count_q = select(func.count(Account.id)).where(Account.workspace_id == workspace_id)

    if status_filter:
        q = q.where(Account.status == status_filter)
        count_q = count_q.where(Account.status == status_filter)
    if search:
        from app.modules.crm.services.status_flows import escape_like

        pattern = f"%{escape_like(search)}%"
        search_filter = Account.name.ilike(pattern) | Account.industry.ilike(pattern)
        q = q.where(search_filter)
        count_q = count_q.where(search_filter)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Account.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total


async def get_account(db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID) -> Account:
    result = await db.scalars(
        select(Account).where(Account.id == account_id, Account.workspace_id == workspace_id)
    )
    account = result.first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


async def get_account_360(db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID) -> dict:
    """Get full 360-degree view of an account with contacts, deals, activities, tickets."""
    from app.modules.crm.models.activity import Activity
    from app.modules.crm.models.contact import Contact
    from app.modules.crm.models.deal import Deal
    from app.modules.crm.models.ticket import Ticket

    account = await get_account(db, account_id, workspace_id)

    contacts = await db.scalars(
        select(Contact).where(Contact.account_id == account_id, Contact.workspace_id == workspace_id)
    )
    deals = await db.scalars(
        select(Deal).where(Deal.account_id == account_id, Deal.workspace_id == workspace_id)
    )
    activities = await db.scalars(
        select(Activity)
        .where(Activity.workspace_id == workspace_id, Activity.contact_id.in_(
            select(Contact.id).where(Contact.account_id == account_id)
        ))
        .order_by(Activity.date.desc())
        .limit(50)
    )
    tickets = await db.scalars(
        select(Ticket).where(Ticket.account_id == account_id, Ticket.workspace_id == workspace_id)
    )

    return {
        "account": account,
        "contacts": list(contacts.all()),
        "deals": list(deals.all()),
        "activities": list(activities.all()),
        "tickets": list(tickets.all()),
    }


async def update_account(
    db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID, data: AccountUpdate
) -> Account:
    account = await get_account(db, account_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(account, field, value)
    await db.commit()
    await db.refresh(account)
    return account


async def delete_account(db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
    account = await get_account(db, account_id, workspace_id)
    await db.delete(account)
    await db.commit()


async def calculate_health_score(
    db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID
) -> int:
    """Calculate account health: 0-100 using weighted formula (revenue/recency/tickets/pipeline)."""
    from app.modules.crm.models.activity import Activity
    from app.modules.crm.models.contact import Contact
    from app.modules.crm.models.deal import Deal
    from app.modules.crm.models.ticket import Ticket

    account = await get_account(db, account_id, workspace_id)

    # Revenue: 30% weight
    revenue_score = min(account.total_revenue / 50_000_000, 1.0) * 30

    # Activity recency: 30% weight — date of most recent activity
    last_activity_date = await db.scalar(
        select(func.max(Activity.date)).where(
            Activity.workspace_id == workspace_id,
            Activity.contact_id.in_(
                select(Contact.id).where(Contact.account_id == account_id)
            ),
        )
    )
    now = datetime.now(timezone.utc)
    days_since = (now - last_activity_date).days if last_activity_date else 999
    if days_since <= 7:
        recency_score = 30.0
    elif days_since <= 30:
        recency_score = 20.0
    elif days_since <= 60:
        recency_score = 10.0
    else:
        recency_score = 0.0

    # Ticket health: 20% weight
    open_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.account_id == account_id,
            Ticket.status.in_(["open", "in_progress"]),
        )
    ) or 0
    total_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(Ticket.account_id == account_id)
    ) or 0
    ticket_score = (1 - open_tickets / max(total_tickets, 1)) * 20

    # Pipeline: 20% weight
    active_deal_count = await db.scalar(
        select(func.count(Deal.id)).where(
            Deal.account_id == account_id,
            Deal.workspace_id == workspace_id,
            Deal.stage.notin_(["closed_won", "closed_lost"]),
        )
    ) or 0
    pipeline_score = min(active_deal_count, 3) / 3 * 20

    health_score = round(revenue_score + recency_score + ticket_score + pipeline_score)
    return max(0, min(health_score, 100))


async def recalculate_account_revenue(
    db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID
) -> None:
    """Aggregate total_revenue from closed_won deals and persist to account."""
    from app.modules.crm.models.deal import Deal

    total = await db.scalar(
        select(func.coalesce(func.sum(Deal.value), 0.0)).where(
            Deal.account_id == account_id,
            Deal.workspace_id == workspace_id,
            Deal.stage == "closed_won",
        )
    )
    account = await get_account(db, account_id, workspace_id)
    account.total_revenue = total
    await db.commit()


async def get_account_revenue_by_month(
    db: AsyncSession, account_id: uuid.UUID, workspace_id: uuid.UUID, months: int = 12
) -> list[dict]:
    """Return closed_won deal revenue grouped by month for the last N months."""

    from app.modules.crm.models.deal import Deal

    cutoff = datetime.now(timezone.utc) - timedelta(days=months * 30)
    result = await db.execute(
        select(
            func.to_char(Deal.closed_at, "YYYY-MM").label("month"),
            func.coalesce(func.sum(Deal.value), 0.0).label("revenue"),
        )
        .where(
            Deal.account_id == account_id,
            Deal.workspace_id == workspace_id,
            Deal.stage == "closed_won",
            Deal.closed_at.isnot(None),
            Deal.closed_at >= cutoff,
        )
        .group_by(func.to_char(Deal.closed_at, "YYYY-MM"))
        .order_by(func.to_char(Deal.closed_at, "YYYY-MM"))
    )
    return [{"month": row.month, "revenue": float(row.revenue)} for row in result.all()]


async def get_accounts_needing_follow_up(
    db: AsyncSession, workspace_id: uuid.UUID
) -> list[Account]:
    """Accounts with next_follow_up_date <= today."""
    today = date.today()
    q = select(Account).where(
        Account.workspace_id == workspace_id,
        Account.next_follow_up_date <= today,
        Account.status == "active",
    )
    result = await db.scalars(q)
    return list(result.all())
