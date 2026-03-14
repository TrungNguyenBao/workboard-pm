"""Service-layer tests for campaign.py — CRUD, status transitions, ROI metrics."""
import uuid

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.schemas.campaign import CampaignCreate, CampaignUpdate
from app.modules.crm.services.campaign import (
    create_campaign,
    delete_campaign,
    get_campaign,
    get_campaign_metrics,
    get_campaign_stats,
    list_campaigns,
    update_campaign,
)

from tests.crm.conftest import make_campaign, make_deal, make_lead, make_workspace


@pytest_asyncio.fixture
async def ws(db: AsyncSession):
    return await make_workspace(db)


# --- create / get ---


@pytest.mark.asyncio
async def test_create_campaign(db: AsyncSession, ws):
    data = CampaignCreate(name="Summer Sale", type="email")
    campaign = await create_campaign(db, ws.id, data)
    assert campaign.id is not None
    assert campaign.name == "Summer Sale"
    assert campaign.status == "draft"


@pytest.mark.asyncio
async def test_get_campaign_404(db: AsyncSession, ws):
    with pytest.raises(HTTPException) as exc:
        await get_campaign(db, uuid.uuid4(), ws.id)
    assert exc.value.status_code == 404


# --- list_campaigns ---


@pytest.mark.asyncio
async def test_list_campaigns_filter_status(db: AsyncSession, ws):
    await make_campaign(db, ws.id, status="draft")
    await make_campaign(db, ws.id, status="draft")
    # Activate one via update to bypass direct model state
    c = await make_campaign(db, ws.id, status="draft")
    await update_campaign(db, c.id, ws.id, CampaignUpdate(status="active"))

    campaigns, total = await list_campaigns(db, ws.id, status_filter="active")
    assert all(c.status == "active" for c in campaigns)
    assert total >= 1


@pytest.mark.asyncio
async def test_list_campaigns_search(db: AsyncSession, ws):
    await make_campaign(db, ws.id, name="Black Friday Blast")
    await make_campaign(db, ws.id, name="Spring Promo")
    results, _ = await list_campaigns(db, ws.id, search="Black Friday")
    assert any("Black Friday" in c.name for c in results)


# --- update_campaign transitions ---


@pytest.mark.asyncio
async def test_update_campaign_valid_transition(db: AsyncSession, ws):
    c = await make_campaign(db, ws.id, status="draft")
    updated = await update_campaign(db, c.id, ws.id, CampaignUpdate(status="active"))
    assert updated.status == "active"


@pytest.mark.asyncio
async def test_update_campaign_invalid_transition_raises(db: AsyncSession, ws):
    c = await make_campaign(db, ws.id, status="draft")
    await update_campaign(db, c.id, ws.id, CampaignUpdate(status="active"))
    await update_campaign(db, c.id, ws.id, CampaignUpdate(status="completed"))
    with pytest.raises(HTTPException) as exc:
        await update_campaign(db, c.id, ws.id, CampaignUpdate(status="active"))
    assert exc.value.status_code == 400


# --- delete_campaign ---


@pytest.mark.asyncio
async def test_delete_campaign(db: AsyncSession, ws):
    c = await make_campaign(db, ws.id)
    await delete_campaign(db, c.id, ws.id)
    with pytest.raises(HTTPException) as exc:
        await get_campaign(db, c.id, ws.id)
    assert exc.value.status_code == 404


# --- get_campaign_stats ---


@pytest.mark.asyncio
async def test_campaign_stats_no_leads(db: AsyncSession, ws):
    c = await make_campaign(db, ws.id)
    stats = await get_campaign_stats(db, c.id, ws.id)
    assert stats["total_leads"] == 0
    assert stats["roi_percent"] == 0
    assert stats["cost_per_lead"] == 0


@pytest.mark.asyncio
async def test_campaign_stats_with_leads_and_deals(db: AsyncSession, ws):
    campaign = await make_campaign(db, ws.id, actual_cost=1000.0)
    lead = await make_lead(db, ws.id, campaign_id=campaign.id, status="opportunity")
    await make_deal(db, ws.id, lead_id=lead.id, stage="closed_won", value=5000.0)
    stats = await get_campaign_stats(db, campaign.id, ws.id)
    assert stats["total_leads"] == 1
    assert stats["converted_leads"] == 1
    assert stats["won_deal_value"] == pytest.approx(5000.0)
    assert stats["roi_percent"] == pytest.approx(400.0)  # (5000-1000)/1000*100


@pytest.mark.asyncio
async def test_campaign_stats_roi_formula(db: AsyncSession, ws):
    campaign = await make_campaign(db, ws.id, actual_cost=2000.0)
    lead = await make_lead(db, ws.id, campaign_id=campaign.id)
    await make_deal(db, ws.id, lead_id=lead.id, stage="closed_won", value=6000.0)
    stats = await get_campaign_stats(db, campaign.id, ws.id)
    # (6000 - 2000) / 2000 * 100 = 200.0
    assert stats["roi_percent"] == pytest.approx(200.0)


# --- get_campaign_metrics ---


@pytest.mark.asyncio
async def test_campaign_metrics_cost_per_lead(db: AsyncSession, ws):
    campaign = await make_campaign(db, ws.id, actual_cost=500.0)
    await make_lead(db, ws.id, campaign_id=campaign.id)
    await make_lead(db, ws.id, campaign_id=campaign.id)
    metrics = await get_campaign_metrics(db, campaign.id, ws.id)
    assert metrics["cost_per_lead"] == pytest.approx(250.0)


@pytest.mark.asyncio
async def test_campaign_metrics_zero_cost(db: AsyncSession, ws):
    campaign = await make_campaign(db, ws.id, actual_cost=0.0)
    await make_lead(db, ws.id, campaign_id=campaign.id)
    metrics = await get_campaign_metrics(db, campaign.id, ws.id)
    assert metrics["roi_pct"] == 0.0
    assert metrics["cost_per_lead"] == 0.0
