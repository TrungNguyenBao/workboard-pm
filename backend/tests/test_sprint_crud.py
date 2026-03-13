"""Tests for sprint CRUD endpoints."""
import uuid

import pytest
from httpx import AsyncClient


async def _setup_workspace_and_project(client: AsyncClient, headers: dict) -> tuple[str, str]:
    """Helper: create workspace + project, return (workspace_id, project_id)."""
    slug = f"ws-{uuid.uuid4().hex[:8]}"
    ws = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test WS", "slug": slug},
        headers=headers,
    )
    assert ws.status_code == 201
    ws_id = ws.json()["id"]

    proj = await client.post(
        f"/api/v1/pms/workspaces/{ws_id}/projects",
        json={"name": "Test Project", "project_type": "agile"},
        headers=headers,
    )
    assert proj.status_code == 201
    return ws_id, proj.json()["id"]


@pytest.mark.asyncio
async def test_create_sprint(client: AsyncClient, auth_headers: dict):
    """POST /pms/projects/{id}/sprints creates a sprint in planning status."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints",
        json={"name": "Sprint 1", "goal": "Deliver MVP"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Sprint 1"
    assert data["goal"] == "Deliver MVP"
    assert data["status"] == "planning"
    assert data["project_id"] == proj_id


@pytest.mark.asyncio
async def test_list_sprints(client: AsyncClient, auth_headers: dict):
    """GET /pms/projects/{id}/sprints returns all sprints."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    # Create two sprints
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints",
        json={"name": "Sprint 1"},
        headers=auth_headers,
    )
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints",
        json={"name": "Sprint 2"},
        headers=auth_headers,
    )
    resp = await client.get(
        f"/api/v1/pms/projects/{proj_id}/sprints", headers=auth_headers
    )
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_list_sprints_status_filter(client: AsyncClient, auth_headers: dict):
    """GET /pms/projects/{id}/sprints?status=planning filters by status."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints",
        json={"name": "Planning Sprint"},
        headers=auth_headers,
    )
    resp = await client.get(
        f"/api/v1/pms/projects/{proj_id}/sprints?status=planning",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    for sprint in resp.json():
        assert sprint["status"] == "planning"


@pytest.mark.asyncio
async def test_get_sprint(client: AsyncClient, auth_headers: dict):
    """GET /pms/projects/{id}/sprints/{sprint_id} returns sprint detail."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    create_resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints",
        json={"name": "Sprint X"},
        headers=auth_headers,
    )
    sprint_id = create_resp.json()["id"]
    resp = await client.get(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Sprint X"


@pytest.mark.asyncio
async def test_update_sprint(client: AsyncClient, auth_headers: dict):
    """PATCH /pms/projects/{id}/sprints/{sprint_id} updates sprint fields."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    create_resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints",
        json={"name": "Old Name"},
        headers=auth_headers,
    )
    sprint_id = create_resp.json()["id"]
    resp = await client.patch(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint_id}",
        json={"name": "New Name", "goal": "Updated goal"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"
    assert resp.json()["goal"] == "Updated goal"


@pytest.mark.asyncio
async def test_delete_sprint(client: AsyncClient, auth_headers: dict):
    """DELETE /pms/projects/{id}/sprints/{sprint_id} soft-deletes sprint."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    create_resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints",
        json={"name": "To Delete"},
        headers=auth_headers,
    )
    sprint_id = create_resp.json()["id"]
    del_resp = await client.delete(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint_id}",
        headers=auth_headers,
    )
    assert del_resp.status_code == 204

    # Verify sprint no longer appears in list
    list_resp = await client.get(
        f"/api/v1/pms/projects/{proj_id}/sprints", headers=auth_headers
    )
    ids = [s["id"] for s in list_resp.json()]
    assert sprint_id not in ids


@pytest.mark.asyncio
async def test_get_nonexistent_sprint(client: AsyncClient, auth_headers: dict):
    """GET sprint with bad ID returns 404."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    resp = await client.get(
        f"/api/v1/pms/projects/{proj_id}/sprints/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404
