"""API integration tests for CRM deal endpoints."""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient


async def _setup_crm_workspace(client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": f"crm-deals-{uid}@test.com", "name": "CRM User", "password": "pass12345"},
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


DEALS = "/api/v1/crm/workspaces/{ws}/deals"
WORKFLOWS = "/api/v1/crm/workspaces/{ws}"


async def _create_deal(client, ws, headers, **kwargs) -> dict:
    payload = {"title": "Test Deal", "value": 1000.0, "stage": "lead"}
    payload.update(kwargs)
    resp = await client.post(DEALS.format(ws=ws), json=payload, headers=headers)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_deal(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.post(
        DEALS.format(ws=ws),
        json={"title": "My Deal", "value": 5000.0, "stage": "lead"},
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My Deal"
    assert data["stage"] == "lead"


@pytest.mark.asyncio
async def test_list_deals(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await _create_deal(client, ws, h)
    resp = await client.get(DEALS.format(ws=ws), headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_deals_filter_stage(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await _create_deal(client, ws, h, stage="lead")
    resp = await client.get(DEALS.format(ws=ws), params={"stage": "lead"}, headers=h)
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["stage"] == "lead"


@pytest.mark.asyncio
async def test_get_deal(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h)
    deal_id = deal["id"]
    resp = await client.get(f"{DEALS.format(ws=ws)}/{deal_id}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == deal_id


@pytest.mark.asyncio
async def test_get_deal_404(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(f"{DEALS.format(ws=ws)}/{uuid.uuid4()}", headers=h)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_deal_stage(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h, stage="lead")
    deal_id = deal["id"]
    resp = await client.patch(
        f"{DEALS.format(ws=ws)}/{deal_id}",
        json={"stage": "qualified"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == "qualified"


@pytest.mark.asyncio
async def test_update_deal_invalid_stage(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h, stage="lead")
    deal_id = deal["id"]
    resp = await client.patch(
        f"{DEALS.format(ws=ws)}/{deal_id}",
        json={"stage": "closed_won"},
        headers=h,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_deal(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h)
    resp = await client.delete(f"{DEALS.format(ws=ws)}/{deal['id']}", headers=h)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_close_deal_won(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h, stage="negotiation")
    resp = await client.post(
        f"{WORKFLOWS.format(ws=ws)}/deals/{deal['id']}/close",
        json={"action": "won"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == "closed_won"


@pytest.mark.asyncio
async def test_close_deal_lost(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h, stage="negotiation")
    resp = await client.post(
        f"{WORKFLOWS.format(ws=ws)}/deals/{deal['id']}/close",
        json={"action": "lost", "loss_reason": "Too expensive"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == "closed_lost"


@pytest.mark.asyncio
async def test_close_deal_lost_no_reason(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h, stage="negotiation")
    resp = await client.post(
        f"{WORKFLOWS.format(ws=ws)}/deals/{deal['id']}/close",
        json={"action": "lost"},
        headers=h,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_reopen_deal(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    deal = await _create_deal(client, ws, h, stage="negotiation")
    await client.post(
        f"{WORKFLOWS.format(ws=ws)}/deals/{deal['id']}/close",
        json={"action": "lost", "loss_reason": "Budget"},
        headers=h,
    )
    resp = await client.post(
        f"{WORKFLOWS.format(ws=ws)}/deals/{deal['id']}/reopen",
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["stage"] == "negotiation"


@pytest.mark.asyncio
async def test_stale_deals_endpoint(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(f"{WORKFLOWS.format(ws=ws)}/deals/stale", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "count" in data
    assert "deals" in data


@pytest.mark.asyncio
async def test_distribute_leads_endpoint(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.post(
        f"/api/v1/crm/workspaces/{ws}/leads/distribute",
        headers=h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "distributed_count" in data


@pytest.mark.asyncio
async def test_deals_unauthenticated(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    resp = await client.get(DEALS.format(ws=ws))
    assert resp.status_code == 401
