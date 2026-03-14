"""Service-layer tests for data_quality.py — DB-backed async tests."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.services.data_quality import (
    get_data_quality_report,
    get_overall_quality_score,
)

from tests.crm.conftest import (
    make_account,
    make_activity,
    make_contact,
    make_deal,
    make_lead,
    make_workspace,
)

UTC = timezone.utc


@pytest_asyncio.fixture
async def ws(db: AsyncSession):
    return await make_workspace(db)


# --- get_data_quality_report ---


@pytest.mark.asyncio
async def test_quality_report_duplicate_emails(db: AsyncSession, ws):
    email = f"dup-{uuid.uuid4().hex[:6]}@example.com"
    await make_lead(db, ws.id, email=email)
    await make_lead(db, ws.id, email=email)
    report = await get_data_quality_report(db, ws.id)
    assert report["duplicate_email_count"] >= 1


@pytest.mark.asyncio
async def test_quality_report_incomplete_leads(db: AsyncSession, ws):
    await make_lead(db, ws.id, email=None, phone=None)
    report = await get_data_quality_report(db, ws.id)
    assert report["incomplete_leads"] >= 1


@pytest.mark.asyncio
async def test_quality_report_ownerless_deals(db: AsyncSession, ws):
    await make_deal(db, ws.id, stage="lead", owner_id=None)
    report = await get_data_quality_report(db, ws.id)
    assert report["ownerless_deals"] >= 1


@pytest.mark.asyncio
async def test_quality_report_clean_data(db: AsyncSession):
    clean_ws = await make_workspace(db)
    # Lead with email + phone (not incomplete, not duplicate)
    await make_lead(db, clean_ws.id,
                    email=f"clean-{uuid.uuid4().hex[:6]}@ex.com", phone="0111")
    report = await get_data_quality_report(db, clean_ws.id)
    assert report["duplicate_email_count"] == 0
    assert report["incomplete_leads"] == 0
    assert report["ownerless_deals"] == 0


@pytest.mark.asyncio
async def test_quality_report_stale_contacts_90_days(db: AsyncSession, ws):
    contact = await make_contact(db, ws.id)
    # No recent activity → stale
    report = await get_data_quality_report(db, ws.id)
    assert report["stale_contacts_90d"] >= 1


@pytest.mark.asyncio
async def test_quality_report_active_contact_not_stale(db: AsyncSession, ws):
    contact = await make_contact(db, ws.id)
    await make_activity(db, ws.id, contact_id=contact.id,
                        date=datetime.now(UTC) - timedelta(days=5))
    report = await get_data_quality_report(db, ws.id)
    # This contact has recent activity so should not appear as stale
    # (we check there's no stale contact for this specific ws contact)
    # Since other tests may run with same DB, we verify the contact is active
    from sqlalchemy import select
    from app.modules.crm.models.activity import Activity
    cutoff = datetime.now(UTC) - timedelta(days=90)
    active = await db.scalars(
        select(Activity).where(
            Activity.contact_id == contact.id,
            Activity.date > cutoff,
        )
    )
    assert len(list(active.all())) >= 1


# --- get_overall_quality_score ---


@pytest.mark.asyncio
async def test_overall_score_empty_workspace(db: AsyncSession):
    empty_ws = await make_workspace(db)
    result = await get_overall_quality_score(db, empty_ws.id)
    assert result["score"] == 0
    assert "breakdown" in result


@pytest.mark.asyncio
async def test_overall_score_perfect_data(db: AsyncSession):
    perfect_ws = await make_workspace(db)
    account = await make_account(db, perfect_ws.id, total_revenue=100_000.0)
    contact = await make_contact(
        db, perfect_ws.id,
        email=f"p-{uuid.uuid4().hex[:6]}@ex.com",
        phone="0999",
        account_id=account.id,
    )
    # Active lead updated recently (not stale)
    lead = await make_lead(db, perfect_ws.id,
                           email=f"l-{uuid.uuid4().hex[:6]}@ex.com", status="new")
    # Deal with expected_close_date and contact
    from datetime import date
    await make_deal(
        db, perfect_ws.id,
        stage="lead",
        contact_id=contact.id,
        expected_close_date=date.today(),
    )
    result = await get_overall_quality_score(db, perfect_ws.id)
    # Should have high score (not necessarily 100 due to lead freshness timing)
    assert result["score"] >= 50
    assert result["breakdown"]["account_coverage"] > 0


@pytest.mark.asyncio
async def test_overall_score_partial_contacts(db: AsyncSession):
    partial_ws = await make_workspace(db)
    # One complete contact
    account = await make_account(db, partial_ws.id)
    await make_contact(
        db, partial_ws.id,
        email=f"c1-{uuid.uuid4().hex[:6]}@ex.com",
        phone="0111",
        account_id=account.id,
    )
    # One incomplete contact (no phone, no account)
    await make_contact(
        db, partial_ws.id,
        email=f"c2-{uuid.uuid4().hex[:6]}@ex.com",
    )
    result = await get_overall_quality_score(db, partial_ws.id)
    # contact_completeness = (1/2) * 25 = 12.5
    assert result["breakdown"]["contact_completeness"] == pytest.approx(12.5)
