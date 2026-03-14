"""Data quality checks for CRM entities."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.account import Account
from app.modules.crm.models.activity import Activity
from app.modules.crm.models.contact import Contact
from app.modules.crm.models.deal import Deal
from app.modules.crm.models.lead import Lead


async def get_data_quality_report(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Aggregate data quality issues across CRM entities."""
    # 1. Duplicate leads (same email)
    dup_email_q = (
        select(Lead.email, func.count(Lead.id).label("cnt"))
        .where(Lead.workspace_id == workspace_id, Lead.email.isnot(None))
        .group_by(Lead.email)
        .having(func.count(Lead.id) > 1)
    )
    dup_emails = await db.execute(dup_email_q)
    duplicate_email_count = len(list(dup_emails.all()))

    # 2. Duplicate leads (same phone)
    dup_phone_q = (
        select(Lead.phone, func.count(Lead.id).label("cnt"))
        .where(Lead.workspace_id == workspace_id, Lead.phone.isnot(None))
        .group_by(Lead.phone)
        .having(func.count(Lead.id) > 1)
    )
    dup_phones = await db.execute(dup_phone_q)
    duplicate_phone_count = len(list(dup_phones.all()))

    # 3. Incomplete leads (missing email AND phone)
    incomplete_leads = await db.scalar(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == workspace_id,
            Lead.email.is_(None),
            Lead.phone.is_(None),
        )
    ) or 0

    # 4. Stale contacts (no activity in 90 days)
    cutoff_90 = datetime.now(timezone.utc) - timedelta(days=90)
    active_contact_ids = (
        select(Activity.contact_id)
        .where(
            Activity.workspace_id == workspace_id,
            Activity.date > cutoff_90,
            Activity.contact_id.isnot(None),
        )
        .distinct()
    )
    stale_contacts = await db.scalar(
        select(func.count(Contact.id)).where(
            Contact.workspace_id == workspace_id,
            Contact.id.notin_(active_contact_ids),
        )
    ) or 0

    # 5. Deals without owner
    ownerless_deals = await db.scalar(
        select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.owner_id.is_(None),
            Deal.stage.notin_(["closed_won", "closed_lost"]),
        )
    ) or 0

    return {
        "duplicate_email_count": duplicate_email_count,
        "duplicate_phone_count": duplicate_phone_count,
        "incomplete_leads": incomplete_leads,
        "stale_contacts_90d": stale_contacts,
        "ownerless_deals": ownerless_deals,
    }


async def get_overall_quality_score(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Compute a 0-100 quality score with per-dimension breakdown (25% each)."""
    cutoff_30 = datetime.now(timezone.utc) - timedelta(days=30)

    # Contact completeness 25%
    total_contacts = await db.scalar(
        select(func.count(Contact.id)).where(Contact.workspace_id == workspace_id)
    ) or 0
    complete_contacts = await db.scalar(
        select(func.count(Contact.id)).where(
            Contact.workspace_id == workspace_id,
            Contact.email.isnot(None),
            Contact.phone.isnot(None),
            Contact.account_id.isnot(None),
        )
    ) or 0
    contact_pct = complete_contacts / max(total_contacts, 1)

    # Lead freshness 25% — active leads not stale (>30d no update)
    total_leads = await db.scalar(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == workspace_id,
            Lead.status.notin_(["disqualified", "opportunity"]),
        )
    ) or 0
    stale_leads = await db.scalar(
        select(func.count(Lead.id)).where(
            Lead.workspace_id == workspace_id,
            Lead.status.notin_(["disqualified", "opportunity"]),
            Lead.updated_at < cutoff_30,
        )
    ) or 0
    lead_pct = (total_leads - stale_leads) / max(total_leads, 1)

    # Deal hygiene 25%
    total_deals = await db.scalar(
        select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.stage.notin_(["closed_won", "closed_lost"]),
        )
    ) or 0
    clean_deals = await db.scalar(
        select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.stage.notin_(["closed_won", "closed_lost"]),
            Deal.expected_close_date.isnot(None),
            Deal.contact_id.isnot(None),
        )
    ) or 0
    deal_pct = clean_deals / max(total_deals, 1)

    # Account coverage 25%
    total_accounts = await db.scalar(
        select(func.count(Account.id)).where(Account.workspace_id == workspace_id)
    ) or 0
    healthy_accounts = await db.scalar(
        select(func.count(Account.id)).where(
            Account.workspace_id == workspace_id,
            Account.total_revenue > 0,
        )
    ) or 0
    account_pct = healthy_accounts / max(total_accounts, 1)

    score = int(contact_pct * 25 + lead_pct * 25 + deal_pct * 25 + account_pct * 25)
    return {
        "score": score,
        "breakdown": {
            "contact_completeness": round(contact_pct * 25, 1),
            "lead_freshness": round(lead_pct * 25, 1),
            "deal_hygiene": round(deal_pct * 25, 1),
            "account_coverage": round(account_pct * 25, 1),
        },
    }
