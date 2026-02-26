"""Tests for workspace and project RBAC."""
import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_workspace_create_and_get(client: AsyncClient, auth_headers: dict):
    slug = f"my-ws-{uuid.uuid4().hex[:8]}"
    create_resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "My Workspace", "slug": slug},
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    ws_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/v1/workspaces/{ws_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["slug"] == slug


@pytest.mark.asyncio
async def test_non_member_cannot_access_workspace(client: AsyncClient):
    # Register a second user without workspace access
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"email": f"other-{uuid.uuid4().hex[:8]}@example.com", "name": "Other", "password": "password123"},
    )
    token2 = resp2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Register first user and create workspace
    resp1 = await client.post(
        "/api/v1/auth/register",
        json={"email": f"owner-{uuid.uuid4().hex[:8]}@example.com", "name": "Owner", "password": "password123"},
    )
    token1 = resp1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    slug = f"private-ws-{uuid.uuid4().hex[:8]}"
    ws_resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "Private", "slug": slug},
        headers=headers1,
    )
    ws_id = ws_resp.json()["id"]

    # Second user should get 403
    get_resp = await client.get(f"/api/v1/workspaces/{ws_id}", headers=headers2)
    assert get_resp.status_code == 403


@pytest.mark.asyncio
async def test_duplicate_slug_rejected(client: AsyncClient, auth_headers: dict):
    slug = f"dup-slug-{uuid.uuid4().hex[:8]}"
    await client.post(
        "/api/v1/workspaces",
        json={"name": "WS1", "slug": slug},
        headers=auth_headers,
    )
    resp2 = await client.post(
        "/api/v1/workspaces",
        json={"name": "WS2", "slug": slug},
        headers=auth_headers,
    )
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_project_default_sections(client: AsyncClient, auth_headers: dict):
    slug = f"ws-{uuid.uuid4().hex[:8]}"
    ws_resp = await client.post(
        "/api/v1/workspaces",
        json={"name": "WS", "slug": slug},
        headers=auth_headers,
    )
    ws_id = ws_resp.json()["id"]

    proj_resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/projects",
        json={"name": "New Project"},
        headers=auth_headers,
    )
    proj_id = proj_resp.json()["id"]

    sections_resp = await client.get(
        f"/api/v1/projects/{proj_id}/sections",
        headers=auth_headers,
    )
    assert sections_resp.status_code == 200
    sections = sections_resp.json()
    names = [s["name"] for s in sections]
    assert "To Do" in names
    assert "In Progress" in names
    assert "Done" in names
