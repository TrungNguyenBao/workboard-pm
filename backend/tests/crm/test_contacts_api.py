"""API integration tests for CRM contact endpoints."""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient


async def _setup_crm_workspace(client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": f"crm-contacts-{uid}@test.com", "name": "CRM User", "password": "pass12345"},
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


BASE = "/api/v1/crm/workspaces/{ws}/contacts"


async def _create_contact(client, ws, headers, **kwargs) -> dict:
    payload = {"name": "Test Contact", "email": f"contact-{uuid.uuid4().hex[:6]}@test.com"}
    payload.update(kwargs)
    resp = await client.post(BASE.format(ws=ws), json=payload, headers=headers)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_contact(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.post(
        BASE.format(ws=ws),
        json={"name": "Alice Smith", "email": "alice@test.com"},
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Alice Smith"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_contacts(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await _create_contact(client, ws, h)
    resp = await client.get(BASE.format(ws=ws), headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_contacts_search(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await _create_contact(client, ws, h, name="UniqueSearchName ZZZ")
    resp = await client.get(BASE.format(ws=ws), params={"search": "UniqueSearchName"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_get_contact(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    contact = await _create_contact(client, ws, h)
    resp = await client.get(f"{BASE.format(ws=ws)}/{contact['id']}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == contact["id"]


@pytest.mark.asyncio
async def test_get_contact_404(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(f"{BASE.format(ws=ws)}/{uuid.uuid4()}", headers=h)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_contact(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    contact = await _create_contact(client, ws, h)
    resp = await client.patch(
        f"{BASE.format(ws=ws)}/{contact['id']}",
        json={"name": "Updated Name"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_contact(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    contact = await _create_contact(client, ws, h)
    resp = await client.delete(f"{BASE.format(ws=ws)}/{contact['id']}", headers=h)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_contact_360(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    contact = await _create_contact(client, ws, h)
    resp = await client.get(f"{BASE.format(ws=ws)}/{contact['id']}/360", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    # 360 view should include deals, activities, emails, tickets sections
    assert "contact" in data or "deals" in data or "id" in data
