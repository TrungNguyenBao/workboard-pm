"""Service-layer tests for deal_workflows.py — DB-backed async tests."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.contract import Contract
from app.modules.crm.services.deal_workflows import (
    close_deal,
    get_stale_deals,
    reopen_deal,
    validate_stage_change,
)

from tests.crm.conftest import make_account, make_contact, make_deal, make_workspace

UTC = timezone.utc


@pytest_asyncio.fixture
async def ws(db: AsyncSession):
    return await make_workspace(db)


# --- validate_stage_change ---


def test_validate_stage_change_valid():
    validate_stage_change("lead", "qualified")  # should not raise


def test_validate_stage_change_invalid_raises():
    with pytest.raises(HTTPException) as exc:
        validate_stage_change("lead", "negotiation")
    assert exc.value.status_code == 400


# --- close_deal: won ---


@pytest.mark.asyncio
async def test_close_deal_won(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="negotiation")
    closed = await close_deal(db, deal.id, ws.id, action="won")
    assert closed.stage == "closed_won"
    assert closed.probability == 1.0
    assert closed.closed_at is not None


@pytest.mark.asyncio
async def test_close_deal_won_creates_account_if_missing(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="negotiation", title="Opportunity: Acme")
    closed = await close_deal(db, deal.id, ws.id, action="won")
    assert closed.account_id is not None


@pytest.mark.asyncio
async def test_close_deal_won_links_contact_to_account(db: AsyncSession, ws):
    contact = await make_contact(db, ws.id)
    deal = await make_deal(db, ws.id, stage="negotiation", contact_id=contact.id)
    await close_deal(db, deal.id, ws.id, action="won")
    await db.refresh(contact)
    assert contact.account_id is not None


@pytest.mark.asyncio
async def test_close_deal_won_creates_contract(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="negotiation")
    closed = await close_deal(db, deal.id, ws.id, action="won")
    contracts = list(
        (await db.scalars(select(Contract).where(Contract.deal_id == closed.id))).all()
    )
    assert len(contracts) == 1
    assert contracts[0].status == "draft"


# --- close_deal: lost ---


@pytest.mark.asyncio
async def test_close_deal_lost_requires_reason(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="negotiation")
    with pytest.raises(HTTPException) as exc:
        await close_deal(db, deal.id, ws.id, action="lost", loss_reason=None)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_close_deal_lost_with_reason(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="negotiation")
    closed = await close_deal(db, deal.id, ws.id, action="lost", loss_reason="Price")
    assert closed.stage == "closed_lost"
    assert closed.probability == 0.0
    assert closed.loss_reason == "Price"


@pytest.mark.asyncio
async def test_close_deal_already_closed_raises(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="closed_won")
    with pytest.raises(HTTPException) as exc:
        await close_deal(db, deal.id, ws.id, action="won")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_close_deal_invalid_action_raises(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="negotiation")
    with pytest.raises(HTTPException) as exc:
        await close_deal(db, deal.id, ws.id, action="maybe")
    assert exc.value.status_code == 400


# --- reopen_deal ---


@pytest.mark.asyncio
async def test_reopen_closed_won(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="closed_won")
    reopened = await reopen_deal(db, deal.id, ws.id)
    assert reopened.stage == "negotiation"
    assert reopened.probability == 75.0
    assert reopened.closed_at is None


@pytest.mark.asyncio
async def test_reopen_closed_lost(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="closed_lost")
    reopened = await reopen_deal(db, deal.id, ws.id)
    assert reopened.stage == "negotiation"
    assert reopened.closed_at is None


@pytest.mark.asyncio
async def test_reopen_open_deal_raises(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="lead")
    with pytest.raises(HTTPException) as exc:
        await reopen_deal(db, deal.id, ws.id)
    assert exc.value.status_code == 400


# --- get_stale_deals ---


@pytest.mark.asyncio
async def test_stale_deals_general(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="lead", value=1000.0)
    deal.created_at = datetime.now(UTC) - timedelta(days=65)
    await db.commit()
    stale = await get_stale_deals(db, ws.id, general_days=60, high_value_days=30)
    assert any(s.id == deal.id for s in stale)


@pytest.mark.asyncio
async def test_stale_deals_high_value_tighter_window(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="lead", value=600_000_000.0)
    deal.created_at = datetime.now(UTC) - timedelta(days=35)
    await db.commit()
    stale = await get_stale_deals(
        db, ws.id, general_days=60, high_value_days=30, high_value_threshold=500_000_000
    )
    assert any(s.id == deal.id for s in stale)


@pytest.mark.asyncio
async def test_stale_deals_excludes_closed(db: AsyncSession, ws):
    deal = await make_deal(db, ws.id, stage="closed_won", value=1000.0)
    deal.created_at = datetime.now(UTC) - timedelta(days=90)
    await db.commit()
    stale = await get_stale_deals(db, ws.id)
    assert all(s.id != deal.id for s in stale)
