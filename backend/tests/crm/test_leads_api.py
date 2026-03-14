"""API integration tests for CRM lead endpoints."""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient


async def _setup_crm_workspace(client: AsyncClient) -> dict:
    """Register user, create workspace — returns workspace_id and auth headers."""
    uid = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": f"crm-leads-{uid}@test.com", "name": "CRM User", "password": "pass12345"},
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


BASE = "/api/v1/crm/workspaces/{ws}/leads"


@pytest.mark.asyncio
async def test_create_lead(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.post(
        BASE.format(ws=ws),
        json={"name": "Jane Doe", "email": "jane@test.com", "source": "website"},
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["lead"]["name"] == "Jane Doe"
    assert data["lead"]["score"] >= 0


@pytest.mark.asyncio
async def test_create_lead_returns_duplicates(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    payload = {"name": "Dup Lead", "email": "dup-lead@test.com", "source": "manual"}
    await client.post(BASE.format(ws=ws), json=payload, headers=h)
    resp = await client.post(BASE.format(ws=ws), json=payload, headers=h)
    assert resp.status_code == 201
    data = resp.json()
    assert data["duplicates"] is not None
    assert len(data["duplicates"]) >= 1


@pytest.mark.asyncio
async def test_list_leads(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await client.post(BASE.format(ws=ws), json={"name": "List Lead", "source": "manual"}, headers=h)
    resp = await client.get(BASE.format(ws=ws), headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_leads_filter_status(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await client.post(BASE.format(ws=ws), json={"name": "New Status Lead", "source": "manual", "status": "new"}, headers=h)
    resp = await client.get(BASE.format(ws=ws), params={"status": "new"}, headers=h)
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["status"] == "new"


@pytest.mark.asyncio
async def test_list_leads_search(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    await client.post(BASE.format(ws=ws), json={"name": "SearchableName XYZ", "source": "manual"}, headers=h)
    resp = await client.get(BASE.format(ws=ws), params={"search": "SearchableName"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_get_lead(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    create = await client.post(BASE.format(ws=ws), json={"name": "Get Lead", "source": "manual"}, headers=h)
    lead_id = create.json()["lead"]["id"]
    resp = await client.get(f"{BASE.format(ws=ws)}/{lead_id}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == lead_id


@pytest.mark.asyncio
async def test_get_lead_404(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    resp = await client.get(f"{BASE.format(ws=ws)}/{uuid.uuid4()}", headers=h)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_lead(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    create = await client.post(BASE.format(ws=ws), json={"name": "Update Me", "source": "manual"}, headers=h)
    lead_id = create.json()["lead"]["id"]
    resp = await client.patch(f"{BASE.format(ws=ws)}/{lead_id}", json={"name": "Updated Name"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_update_lead_bant(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    create = await client.post(BASE.format(ws=ws), json={"name": "BANT Lead", "source": "manual"}, headers=h)
    lead_id = create.json()["lead"]["id"]
    resp = await client.patch(
        f"{BASE.format(ws=ws)}/{lead_id}/bant",
        json={"budget": "100k", "authority": "CEO", "need": "CRM", "timeline": "Q1"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == lead_id


@pytest.mark.asyncio
async def test_delete_lead(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    create = await client.post(BASE.format(ws=ws), json={"name": "Delete Me", "source": "manual"}, headers=h)
    lead_id = create.json()["lead"]["id"]
    resp = await client.delete(f"{BASE.format(ws=ws)}/{lead_id}", headers=h)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_disqualify_lead(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    create = await client.post(BASE.format(ws=ws), json={"name": "Disqualify Me", "source": "manual", "status": "new"}, headers=h)
    lead_id = create.json()["lead"]["id"]
    resp = await client.post(
        f"{BASE.format(ws=ws)}/{lead_id}/disqualify",
        json={"reason": "Not a fit"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "disqualified"


@pytest.mark.asyncio
async def test_disqualify_invalid_status(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    create = await client.post(BASE.format(ws=ws), json={"name": "Opp Lead", "source": "manual", "status": "opportunity"}, headers=h)
    lead_id = create.json()["lead"]["id"]
    resp = await client.post(
        f"{BASE.format(ws=ws)}/{lead_id}/disqualify",
        json={"reason": "Bad timing"},
        headers=h,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_bulk_disqualify(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    ids = []
    for i in range(2):
        r = await client.post(BASE.format(ws=ws), json={"name": f"Bulk {i}", "source": "manual", "status": "new"}, headers=h)
        ids.append(r.json()["lead"]["id"])
    resp = await client.post(
        f"/api/v1/crm/workspaces/{ws}/leads/bulk-disqualify",
        json={"lead_ids": ids, "reason": "Mass disqualify"},
        headers=h,
    )
    assert resp.status_code == 200
    assert resp.json()["disqualified"] == 2


@pytest.mark.asyncio
async def test_convert_lead(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    h = crm_workspace["headers"]
    create = await client.post(
        BASE.format(ws=ws),
        json={"name": "Convert Lead", "source": "manual", "status": "qualified"},
        headers=h,
    )
    lead_id = create.json()["lead"]["id"]
    resp = await client.post(
        f"{BASE.format(ws=ws)}/{lead_id}/convert",
        json={"deal_title": "New Deal", "value": 5000.0},
        headers=h,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["stage"] in ["lead", "qualified", "needs_analysis", "proposal", "negotiation"]


@pytest.mark.asyncio
async def test_leads_unauthenticated(client: AsyncClient, crm_workspace: dict):
    ws = crm_workspace["workspace_id"]
    resp = await client.get(BASE.format(ws=ws))
    assert resp.status_code == 401
