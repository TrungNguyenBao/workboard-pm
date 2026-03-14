"""API integration tests for CRM ticket endpoints."""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient


async def _setup_crm_workspace(client: AsyncClient) -> dict:
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": f"crm-tickets-{uid}@test.com", "name": "CRM User", "password": "pass12345"},
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


TICKETS = "/api/v1/crm/workspaces/{ws}/tickets"
ACCOUNTS = "/api/v1/crm/workspaces/{ws}/accounts"


async def _create_account(client, ws, headers) -> dict:
    resp = await client.post(
        ACCOUNTS.format(ws=ws),
        json={"name": f"Account {uuid.uuid4().hex[:6]}", "status": "active"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


async def _create_ticket(client, ws, headers, account_id, **kwargs) -> dict:
    payload = {
        "subject": f"Ticket {uuid.uuid4().hex[:6]}",
        "priority": "medium",
        "status": "open",
        "account_id": account_id,
    }
    payload.update(kwargs)
    resp = await client.post(TICKETS.format(ws=ws), json=payload, headers=headers)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_create_ticket(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    resp = await client.post(
        TICKETS.format(ws=ws),
        json={"subject": "Login broken", "priority": "high", "account_id": account["id"]},
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["subject"] == "Login broken"
    assert data["status"] == "open"


@pytest.mark.asyncio
async def test_list_tickets(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    await _create_ticket(client, ws, h, account["id"])
    resp = await client.get(TICKETS.format(ws=ws), headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_ticket(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    ticket = await _create_ticket(client, ws, h, account["id"])
    resp = await client.get(f"{TICKETS.format(ws=ws)}/{ticket['id']}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == ticket["id"]


@pytest.mark.asyncio
async def test_update_ticket_status(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    ticket = await _create_ticket(client, ws, h, account["id"], status="open")
    resp = await client.patch(
        f"{TICKETS.format(ws=ws)}/{ticket['id']}",
        json={"status": "in_progress"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_invalid_ticket_transition(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    ticket = await _create_ticket(client, ws, h, account["id"], status="open")
    resp = await client.patch(
        f"{TICKETS.format(ws=ws)}/{ticket['id']}",
        json={"status": "resolved"},
        headers=h,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_ticket(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    account = await _create_account(client, ws, h)
    ticket = await _create_ticket(client, ws, h, account["id"])
    resp = await client.delete(f"{TICKETS.format(ws=ws)}/{ticket['id']}", headers=h)
    assert resp.status_code == 204
