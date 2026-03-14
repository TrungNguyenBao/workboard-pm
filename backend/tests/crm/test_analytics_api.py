"""API integration tests for CRM analytics endpoints."""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient


async def _setup_crm_workspace(client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": f"crm-analytics-{uid}@test.com", "name": "CRM User", "password": "pass12345"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    ws_resp = await client.post(
        "/api/v1/workspaces",
        json={"name": f"CRM WS {uid}", "slug": f"crm-ws-{uid}"},
        headers=headers,
    )
    assert ws_resp.status_code == 201
    return {"workspace_id": str(ws_resp.json()["id"]), "headers": headers}


@pytest_asyncio.fixture
async def crm_workspace(client: AsyncClient) -> dict:
    return await _setup_crm_workspace(client)


ANALYTICS = "/api/v1/crm/workspaces/{ws}/analytics"
DEALS = "/api/v1/crm/workspaces/{ws}/deals"
LEADS = "/api/v1/crm/workspaces/{ws}/leads"


@pytest.mark.asyncio
async def test_analytics_dashboard_empty(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(ANALYTICS.format(ws=ws), headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)


@pytest.mark.asyncio
async def test_analytics_with_data(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    # Create a deal and lead to populate analytics
    await client.post(DEALS.format(ws=ws), json={"title": "Analytics Deal", "value": 9999.0, "stage": "lead"}, headers=h)
    await client.post(LEADS.format(ws=ws), json={"name": "Analytics Lead", "source": "website"}, headers=h)
    resp = await client.get(ANALYTICS.format(ws=ws), headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_analytics_date_filter(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(
        ANALYTICS.format(ws=ws),
        params={"start_date": "2024-01-01", "end_date": "2024-12-31"},
        headers=h,
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_velocity_detail(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(f"{ANALYTICS.format(ws=ws)}/velocity-detail", headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_revenue_trend(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(f"{ANALYTICS.format(ws=ws)}/revenue-trend", headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), (dict, list))


@pytest.mark.asyncio
async def test_funnel_conversion(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(f"{ANALYTICS.format(ws=ws)}/funnel-conversion", headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), (dict, list))


@pytest.mark.asyncio
async def test_data_quality_report(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(
        f"/api/v1/crm/workspaces/{ws}/data-quality/report",
        headers=h,
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_governance_alerts(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(
        f"/api/v1/crm/workspaces/{ws}/governance/alerts",
        headers=h,
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), (dict, list))
