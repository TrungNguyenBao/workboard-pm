import uuid
from datetime import date, datetime, timedelta

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
        pattern = f"%{search}%"
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
    """Calculate account health: 0-100 based on activity, tickets, revenue."""
    from app.modules.crm.models.activity import Activity
    from app.modules.crm.models.contact import Contact
    from app.modules.crm.models.ticket import Ticket

    score = 100
    open_tickets = await db.scalar(
        select(func.count(Ticket.id)).where(
            Ticket.account_id == account_id,
            Ticket.status.in_(["open", "in_progress"]),
        )
    ) or 0
    score -= min(open_tickets * 10, 30)

    cutoff = datetime.utcnow() - timedelta(days=90)
    recent_activities = await db.scalar(
        select(func.count(Activity.id)).where(
            Activity.workspace_id == workspace_id,
            Activity.contact_id.in_(
                select(Contact.id).where(Contact.account_id == account_id)
            ),
            Activity.date > cutoff,
        )
    ) or 0
    if recent_activities == 0:
        score -= 30

    account = await get_account(db, account_id, workspace_id)
    if account.total_revenue > 10000:
        score += 10

    return max(0, min(score, 100))


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
