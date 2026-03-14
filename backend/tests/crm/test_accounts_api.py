"""API integration tests for CRM account endpoints."""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient


async def _setup_crm_workspace(client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": f"crm-accounts-{uid}@test.com", "name": "CRM User", "password": "pass12345"},
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


BASE = "/api/v1/crm/workspaces/{ws}/accounts"


async def _create_account(client, ws, headers, **kwargs) -> dict:
    payload = {"name": f"Account {uuid.uuid4().hex[:6]}", "status": "active"}
    payload.update(kwargs)
    resp = await client.post(BASE.format(ws=ws), json=payload, headers=headers)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_account(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.post(
        BASE.format(ws=ws),
        json={"name": "Acme Corp", "status": "active"},
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Acme Corp"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_accounts(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await _create_account(client, ws, h)
    resp = await client.get(BASE.format(ws=ws), headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_account(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    resp = await client.get(f"{BASE.format(ws=ws)}/{account['id']}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == account["id"]


@pytest.mark.asyncio
async def test_update_account(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    resp = await client.patch(
        f"{BASE.format(ws=ws)}/{account['id']}",
        json={"name": "Updated Corp"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Corp"


@pytest.mark.asyncio
async def test_delete_account(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    resp = await client.delete(f"{BASE.format(ws=ws)}/{account['id']}", headers=h)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_account_360(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    resp = await client.get(f"{BASE.format(ws=ws)}/{account['id']}/360", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)


@pytest.mark.asyncio
async def test_accounts_follow_ups(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(
        f"/api/v1/crm/workspaces/{ws}/accounts/follow-ups",
        headers=h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "count" in data
    assert "accounts" in data
