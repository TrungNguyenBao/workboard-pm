"""Tests for sprint lifecycle transitions and constraints."""
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
        f"/api/v1/workspaces/{ws_id}/projects",
        json={"name": "Test Project", "project_type": "agile"},
        headers=headers,
    )
    assert proj.status_code == 201
    return ws_id, proj.json()["id"]


async def _create_sprint(
    client: AsyncClient, project_id: str, headers: dict, name: str = "Sprint"
) -> dict:
    """Helper: create a sprint and return its data."""
    resp = await client.post(
        f"/api/v1/pms/projects/{project_id}/sprints",
        json={"name": name},
        headers=headers,
    )
    return resp.json()


@pytest.mark.asyncio
async def test_start_sprint(client: AsyncClient, auth_headers: dict):
    """POST .../start transitions planning -> active."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    sprint = await _create_sprint(client, proj_id, auth_headers)
    resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint['id']}/start",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"
    assert resp.json()["start_date"] is not None


@pytest.mark.asyncio
async def test_start_sprint_already_active_returns_400(
    client: AsyncClient, auth_headers: dict
):
    """Cannot start a sprint that is already active."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    sprint = await _create_sprint(client, proj_id, auth_headers)
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint['id']}/start",
        headers=auth_headers,
    )
    # Try to start again
    resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint['id']}/start",
        headers=auth_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_only_one_active_sprint(client: AsyncClient, auth_headers: dict):
    """Starting a second sprint while one is active returns 409."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    s1 = await _create_sprint(client, proj_id, auth_headers, "Sprint 1")
    s2 = await _create_sprint(client, proj_id, auth_headers, "Sprint 2")
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{s1['id']}/start",
        headers=auth_headers,
    )
    resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{s2['id']}/start",
        headers=auth_headers,
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_complete_sprint(client: AsyncClient, auth_headers: dict):
    """POST .../complete transitions active -> completed."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    sprint = await _create_sprint(client, proj_id, auth_headers)
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint['id']}/start",
        headers=auth_headers,
    )
    resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint['id']}/complete",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"
    assert resp.json()["end_date"] is not None


@pytest.mark.asyncio
async def test_complete_planning_sprint_returns_400(
    client: AsyncClient, auth_headers: dict
):
    """Cannot complete a sprint that is still in planning."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    sprint = await _create_sprint(client, proj_id, auth_headers)
    resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/sprints/{sprint['id']}/complete",
        headers=auth_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_backlog_returns_unsprinted_tasks(
    client: AsyncClient, auth_headers: dict
):
    """GET .../backlog returns tasks with no sprint_id."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    # Create task without sprint
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/tasks",
        json={"title": "Backlog task"},
        headers=auth_headers,
    )
    resp = await client.get(
        f"/api/v1/pms/projects/{proj_id}/backlog", headers=auth_headers
    )
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert "Backlog task" in titles


@pytest.mark.asyncio
async def test_backlog_excludes_sprinted_tasks(
    client: AsyncClient, auth_headers: dict
):
    """Tasks assigned to a sprint do not appear in backlog."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    sprint = await _create_sprint(client, proj_id, auth_headers)
    await client.post(
        f"/api/v1/pms/projects/{proj_id}/tasks",
        json={"title": "Sprinted task", "sprint_id": sprint["id"]},
        headers=auth_headers,
    )
    resp = await client.get(
        f"/api/v1/pms/projects/{proj_id}/backlog", headers=auth_headers
    )
    titles = [t["title"] for t in resp.json()]
    assert "Sprinted task" not in titles


@pytest.mark.asyncio
async def test_task_agile_fields_round_trip(client: AsyncClient, auth_headers: dict):
    """Create task with agile fields and verify they persist."""
    _, proj_id = await _setup_workspace_and_project(client, auth_headers)
    sprint = await _create_sprint(client, proj_id, auth_headers)
    resp = await client.post(
        f"/api/v1/pms/projects/{proj_id}/tasks",
        json={
            "title": "Agile task",
            "story_points": 5,
            "task_type": "story",
            "sprint_id": sprint["id"],
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["story_points"] == 5
    assert data["task_type"] == "story"
    assert data["sprint_id"] == sprint["id"]
