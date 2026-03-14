"""API integration tests for CRM campaign endpoints."""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient


async def _setup_crm_workspace(client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": f"crm-campaigns-{uid}@test.com", "name": "CRM User", "password": "pass12345"},
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


BASE = "/api/v1/crm/workspaces/{ws}/campaigns"


async def _create_campaign(client, ws, headers, **kwargs) -> dict:
    payload = {"name": f"Campaign {uuid.uuid4().hex[:6]}", "type": "email", "status": "draft"}
    payload.update(kwargs)
    resp = await client.post(BASE.format(ws=ws), json=payload, headers=headers)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_campaign(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.post(
        BASE.format(ws=ws),
        json={"name": "Q1 Email Blast", "type": "email", "budget": 1000.0},
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Q1 Email Blast"
    assert data["type"] == "email"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_campaigns(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await _create_campaign(client, ws, h)
    resp = await client.get(BASE.format(ws=ws), headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_campaign(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    campaign = await _create_campaign(client, ws, h)
    resp = await client.get(f"{BASE.format(ws=ws)}/{campaign['id']}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == campaign["id"]


@pytest.mark.asyncio
async def test_update_campaign(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    campaign = await _create_campaign(client, ws, h, status="draft")
    resp = await client.patch(
        f"{BASE.format(ws=ws)}/{campaign['id']}",
        json={"status": "active"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_invalid_status_transition(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    campaign = await _create_campaign(client, ws, h, status="draft")
    resp = await client.patch(
        f"{BASE.format(ws=ws)}/{campaign['id']}",
        json={"status": "completed"},
        headers=h,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_campaign_stats(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    campaign = await _create_campaign(client, ws, h)
    resp = await client.get(f"{BASE.format(ws=ws)}/{campaign['id']}/stats", headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_campaign_metrics(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    campaign = await _create_campaign(client, ws, h)
    resp = await client.get(f"{BASE.format(ws=ws)}/{campaign['id']}/metrics", headers=h)
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)


@pytest.mark.asyncio
async def test_delete_campaign(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    campaign = await _create_campaign(client, ws, h)
    resp = await client.delete(f"{BASE.format(ws=ws)}/{campaign['id']}", headers=h)
    assert resp.status_code == 204
