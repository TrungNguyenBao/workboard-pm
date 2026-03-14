"""Service-layer tests for lead_workflows.py — DB-backed async tests."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import WorkspaceMembership
from app.modules.crm.models.lead import Lead
from app.modules.crm.services.lead_workflows import (
    check_lead_duplicates,
    distribute_leads,
    get_stale_leads,
    merge_leads,
    recalculate_lead_score,
)

from tests.crm.conftest import make_activity, make_lead, make_user, make_workspace

UTC = timezone.utc


@pytest_asyncio.fixture
async def ws(db: AsyncSession):
    return await make_workspace(db)


# --- check_lead_duplicates ---


@pytest.mark.asyncio
async def test_check_duplicates_by_email(db: AsyncSession, ws):
    email = f"dup-{uuid.uuid4().hex[:6]}@example.com"
    await make_lead(db, ws.id, email=email)
    await make_lead(db, ws.id, email=email)
    results = await check_lead_duplicates(db, ws.id, email=email, phone=None)
    assert len(results) == 2


@pytest.mark.asyncio
async def test_check_duplicates_by_phone(db: AsyncSession, ws):
    phone = f"05{uuid.uuid4().hex[:8]}"
    await make_lead(db, ws.id, phone=phone, email=f"a-{uuid.uuid4().hex[:4]}@ex.com")
    await make_lead(db, ws.id, phone=phone, email=f"b-{uuid.uuid4().hex[:4]}@ex.com")
    results = await check_lead_duplicates(db, ws.id, email=None, phone=phone)
    assert len(results) == 2


@pytest.mark.asyncio
async def test_check_duplicates_none_inputs(db: AsyncSession, ws):
    results = await check_lead_duplicates(db, ws.id, email=None, phone=None)
    assert results == []


@pytest.mark.asyncio
async def test_check_duplicates_cross_workspace(db: AsyncSession):
    ws1 = await make_workspace(db)
    ws2 = await make_workspace(db)
    email = f"cross-{uuid.uuid4().hex[:6]}@example.com"
    await make_lead(db, ws1.id, email=email)
    results = await check_lead_duplicates(db, ws2.id, email=email, phone=None)
    assert results == []


# --- merge_leads ---


@pytest.mark.asyncio
async def test_merge_leads_copies_null_fields(db: AsyncSession, ws):
    keep = await make_lead(db, ws.id, email=None, phone=None)
    source_email = f"src-{uuid.uuid4().hex[:6]}@example.com"
    source = await make_lead(db, ws.id, email=source_email, phone="0999")
    merged = await merge_leads(db, ws.id, keep.id, source.id)
    assert merged.email == source_email
    assert merged.phone == "0999"


@pytest.mark.asyncio
async def test_merge_leads_keeps_higher_score(db: AsyncSession, ws):
    keep = await make_lead(db, ws.id, score=30)
    source = await make_lead(db, ws.id, score=80)
    merged = await merge_leads(db, ws.id, keep.id, source.id)
    assert merged.score == 80


@pytest.mark.asyncio
async def test_merge_leads_deletes_source(db: AsyncSession, ws):
    keep = await make_lead(db, ws.id)
    source = await make_lead(db, ws.id)
    source_id = source.id
    await merge_leads(db, ws.id, keep.id, source_id)
    result = await db.get(Lead, source_id)
    assert result is None


# --- recalculate_lead_score ---


@pytest.mark.asyncio
async def test_recalculate_score_with_activities(db: AsyncSession, ws):
    # name="X" (len=1, no name bonus), source=manual(5), no email/phone/campaign -> initial=5
    lead = await make_lead(db, ws.id, name="X", source="manual", email=None, phone=None, score=0)
    for _ in range(3):
        await make_activity(db, ws.id, lead_id=lead.id)
    new_score = await recalculate_lead_score(db, lead)
    # initial=5 + 3*5=15 = 20
    assert new_score == 20


@pytest.mark.asyncio
async def test_recalculate_score_capped_at_100(db: AsyncSession, ws):
    lead = await make_lead(db, ws.id, source="referral", email="a@b.com", phone="123")
    # initial = 25+20+15+10(name>3)=70
    for _ in range(10):
        await make_activity(db, ws.id, lead_id=lead.id)
    new_score = await recalculate_lead_score(db, lead)
    assert new_score <= 100


# --- get_stale_leads ---


@pytest.mark.asyncio
async def test_stale_leads_old_no_activity(db: AsyncSession, ws):
    old_time = datetime.now(UTC) - timedelta(days=45)
    lead = await make_lead(db, ws.id, status="new")
    # Manually set created_at to old date
    lead.created_at = old_time
    await db.commit()
    stale = await get_stale_leads(db, ws.id, days=30)
    assert any(s.id == lead.id for s in stale)


@pytest.mark.asyncio
async def test_stale_leads_recent_activity_not_stale(db: AsyncSession, ws):
    lead = await make_lead(db, ws.id, status="new")
    lead.created_at = datetime.now(UTC) - timedelta(days=45)
    await db.commit()
    # Recent activity prevents it being stale
    await make_activity(db, ws.id, lead_id=lead.id,
                        date=datetime.now(UTC) - timedelta(days=5))
    stale = await get_stale_leads(db, ws.id, days=30)
    assert all(s.id != lead.id for s in stale)


@pytest.mark.asyncio
async def test_stale_leads_excludes_closed(db: AsyncSession, ws):
    lead = await make_lead(db, ws.id, status="lost")
    lead.created_at = datetime.now(UTC) - timedelta(days=45)
    await db.commit()
    stale = await get_stale_leads(db, ws.id, days=30)
    assert all(s.id != lead.id for s in stale)


# --- distribute_leads ---


@pytest.mark.asyncio
async def test_distribute_leads_round_robin(db: AsyncSession, ws):
    user1 = await make_user(db, "member1@test.com")
    user2 = await make_user(db, "member2@test.com")
    for uid in [user1.id, user2.id]:
        db.add(WorkspaceMembership(workspace_id=ws.id, user_id=uid, role="member"))
    await db.commit()

    lead1 = await make_lead(db, ws.id, status="new")
    lead2 = await make_lead(db, ws.id, status="new")
    lead3 = await make_lead(db, ws.id, status="new")

    assigned = await distribute_leads(db, ws.id)
    assert len(assigned) == 3
    owner_ids = [l.owner_id for l in assigned]
    assert set(owner_ids) == {user1.id, user2.id}


@pytest.mark.asyncio
async def test_distribute_no_unassigned(db: AsyncSession):
    ws = await make_workspace(db)
    assigned = await distribute_leads(db, ws.id)
    assert assigned == []


@pytest.mark.asyncio
async def test_distribute_no_members(db: AsyncSession):
    ws = await make_workspace(db)
    await make_lead(db, ws.id, status="new")
    assigned = await distribute_leads(db, ws.id)
    assert assigned == []
