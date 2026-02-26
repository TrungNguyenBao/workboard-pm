"""Tests for /auth endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "name": "New User", "password": "securepass"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@example.com", "name": "Dup", "password": "securepass"}
    await client.post("/api/v1/auth/register", json=payload)
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    email = "login_test@example.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "name": "Login", "password": "pass12345"},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "pass12345"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    email = "wrongpw@example.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "name": "WP", "password": "correctpass"},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "wrongpass"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert resp.status_code == 204
