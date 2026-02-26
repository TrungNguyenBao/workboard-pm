"""Tests for /tasks endpoints."""
import pytest
from httpx import AsyncClient


async def _setup_workspace_and_project(client: AsyncClient, headers: dict) -> tuple[str, str]:
    """Helper: create workspace + project, return (workspace_id, project_id)."""
    import uuid
    slug = f"ws-{uuid.uuid4().hex[:8]}"
    ws = await client.post(
        "/api/v1/workspaces",
        json={"name": "Test WS", "slug": slug},
        headers=headers,
    )
    assert ws.status_code == 201
    ws_id = ws.json()["id"]

    proj = await client.post(
        f"/api/v1/workspaces/{ws_id}/projects",
        json={"name": "Test Project"},
        headers=headers,
    )
    assert proj.status_code == 201
    return ws_id, proj.json()["id"]


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, registered_user: dict, auth_headers: dict):
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    resp = await client.post(
        f"/api/v1/projects/{proj_id}/tasks",
        json={"title": "My first task", "priority": "high"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My first task"
    assert data["priority"] == "high"
    assert data["status"] == "incomplete"


@pytest.mark.asyncio
async def test_list_tasks(client: AsyncClient, auth_headers: dict):
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    # Create 2 tasks
    for i in range(2):
        await client.post(
            f"/api/v1/projects/{proj_id}/tasks",
            json={"title": f"Task {i}"},
            headers=auth_headers,
        )
    resp = await client.get(f"/api/v1/projects/{proj_id}/tasks", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_update_task_status(client: AsyncClient, auth_headers: dict):
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    create_resp = await client.post(
        f"/api/v1/projects/{proj_id}/tasks",
        json={"title": "Toggle me"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]

    update_resp = await client.patch(
        f"/api/v1/projects/{proj_id}/tasks/{task_id}",
        json={"status": "completed"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "completed"
    assert update_resp.json()["completed_at"] is not None


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, auth_headers: dict):
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    create_resp = await client.post(
        f"/api/v1/projects/{proj_id}/tasks",
        json={"title": "Delete me"},
        headers=auth_headers,
    )
    task_id = create_resp.json()["id"]

    del_resp = await client.delete(
        f"/api/v1/projects/{proj_id}/tasks/{task_id}",
        headers=auth_headers,
    )
    assert del_resp.status_code == 204

    # Should return 404 now
    get_resp = await client.get(
        f"/api/v1/projects/{proj_id}/tasks/{task_id}",
        headers=auth_headers,
    )
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_move_task(client: AsyncClient, auth_headers: dict):
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    # Get sections
    sections_resp = await client.get(
        f"/api/v1/projects/{proj_id}/sections", headers=auth_headers
    )
    sections = sections_resp.json()
    assert len(sections) >= 2

    task_resp = await client.post(
        f"/api/v1/projects/{proj_id}/tasks",
        json={"title": "Move me", "section_id": sections[0]["id"]},
        headers=auth_headers,
    )
    task_id = task_resp.json()["id"]

    move_resp = await client.patch(
        f"/api/v1/projects/{proj_id}/tasks/{task_id}/move",
        json={"section_id": sections[1]["id"], "position": 100.0},
        headers=auth_headers,
    )
    assert move_resp.status_code == 200
    assert move_resp.json()["section_id"] == sections[1]["id"]
