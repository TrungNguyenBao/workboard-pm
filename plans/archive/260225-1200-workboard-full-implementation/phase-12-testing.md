# Phase 12 — Testing

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Backend pytest, frontend Vitest, E2E Playwright

## Related Code Files

### Create
```
backend/
  tests/
    conftest.py              # async test client, DB fixtures, factory helpers
    test_auth.py
    test_tasks.py
    test_rbac.py
    test_notifications.py

frontend/
  src/features/auth/tests/
    authStore.test.ts
  src/features/tasks/tests/
    useTasks.test.ts
    TaskCard.test.tsx
  playwright/
    e2e/
      full-user-flow.spec.ts
      board-drag-drop.spec.ts
```

## Backend Tests (pytest + pytest-asyncio + httpx)

### conftest.py
```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.core.database import Base, get_db

TEST_DATABASE_URL = "postgresql+asyncpg://workboard:workboard@localhost:5432/workboard_test"

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db(db_engine):
    async with async_sessionmaker(db_engine, expire_on_commit=False)() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture
async def client(db):
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

# Factory fixtures
@pytest_asyncio.fixture
async def user(db):
    return await create_test_user(db, email="test@example.com", password="Password1")

@pytest_asyncio.fixture
async def auth_headers(client, user):
    res = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "Password1"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

### test_auth.py
```python
async def test_register_creates_user_and_workspace(client):
    res = await client.post("/api/v1/auth/register", json={
        "name": "Alice", "email": "alice@test.com",
        "password": "Password1", "workspace_name": "Acme"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@test.com"

async def test_login_wrong_password_returns_401(client, user):
    res = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert res.status_code == 401

async def test_refresh_rotates_token(client, user):
    # Login → get refresh cookie → call /refresh → get new access token
    login = await client.post("/api/v1/auth/login", ...)
    refresh = await client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200
    assert "access_token" in refresh.json()
```

### test_tasks.py
```python
async def test_create_task_returns_201(client, auth_headers, project, section):
    res = await client.post(f"/api/v1/projects/{project.id}/tasks",
        json={"title": "Test task", "section_id": str(section.id), "priority": "high"},
        headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["title"] == "Test task"

async def test_task_position_assigned_at_end(client, auth_headers, project, section):
    # Create 3 tasks, verify positions are ascending

async def test_subtask_depth_limit(client, auth_headers, task):
    # Create task → subtask → sub-subtask → sub-sub-subtask → expect 400

async def test_complete_task_sets_completed_at(client, auth_headers, task):
    res = await client.post(f"/api/v1/tasks/{task.id}/complete", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["completed_at"] is not None

async def test_soft_delete_task(client, auth_headers, task):
    await client.delete(f"/api/v1/tasks/{task.id}", headers=auth_headers)
    res = await client.get(f"/api/v1/tasks/{task.id}", headers=auth_headers)
    assert res.status_code == 404
```

### test_rbac.py
```python
async def test_viewer_cannot_create_task(client, viewer_headers, project):
    res = await client.post(f"/api/v1/projects/{project.id}/tasks",
        json={"title": "Test"}, headers=viewer_headers)
    assert res.status_code == 403

async def test_private_project_hidden_from_non_member(client, other_user_headers, private_project):
    res = await client.get(f"/api/v1/projects/{private_project.id}", headers=other_user_headers)
    assert res.status_code == 404   # not 403, don't leak existence

async def test_commenter_can_comment_but_not_edit_task(client, commenter_headers, project, task):
    # POST comment → 201
    comment_res = await client.post(f"/api/v1/tasks/{task.id}/comments",
        json={"content": "hi"}, headers=commenter_headers)
    assert comment_res.status_code == 201
    # PUT task → 403
    edit_res = await client.put(f"/api/v1/tasks/{task.id}",
        json={"title": "hacked"}, headers=commenter_headers)
    assert edit_res.status_code == 403
```

### test_notifications.py
```python
async def test_assign_task_creates_notification(client, auth_headers, project, task, other_user):
    res = await client.put(f"/api/v1/tasks/{task.id}",
        json={"assignee_id": str(other_user.id)}, headers=auth_headers)
    assert res.status_code == 200
    notifs = await client.get("/api/v1/notifications", headers=other_user_headers)
    assert any(n["type"] == "task_assigned" for n in notifs.json()["items"])
```

## Frontend Tests (Vitest + React Testing Library)

### authStore.test.ts
```typescript
import { useAuthStore } from '@/stores/authStore'

test('setAuth stores user and token, marks authenticated', () => {
  const { setAuth, isAuthenticated, user } = useAuthStore.getState()
  setAuth({ id: '1', name: 'Alice', email: 'a@b.com' }, 'token123')
  expect(useAuthStore.getState().isAuthenticated).toBe(true)
  expect(useAuthStore.getState().accessToken).toBe('token123')
})

test('clearAuth removes user and token', () => {
  useAuthStore.getState().setAuth({ id: '1', name: 'A', email: 'a@b.com' }, 'token')
  useAuthStore.getState().clearAuth()
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
  expect(useAuthStore.getState().accessToken).toBeNull()
})
```

### TaskCard.test.tsx
```typescript
import { render, screen } from '@testing-library/react'
import { TaskCard } from '@/features/tasks/components/board/TaskCard'

test('renders task title and due date', () => {
  const task = { id: '1', title: 'Fix bug', priority: 'high', due_date: '2026-03-01', ... }
  render(<TaskCard task={task} />)
  expect(screen.getByText('Fix bug')).toBeInTheDocument()
  expect(screen.getByText('Mar 1')).toBeInTheDocument()
})

test('overdue due date renders in red', () => {
  const task = { ..., due_date: '2025-01-01', completed_at: null }
  const { container } = render(<TaskCard task={task} />)
  const dateEl = container.querySelector('[data-testid="due-date"]')
  expect(dateEl).toHaveClass('text-danger')
})
```

## E2E Tests (Playwright)

### full-user-flow.spec.ts
```typescript
test('complete user flow: register → create project → add task → complete task', async ({ page }) => {
  // 1. Register
  await page.goto('/register')
  await page.fill('[name=name]', 'Alice')
  await page.fill('[name=email]', `alice+${Date.now()}@test.com`)
  await page.fill('[name=password]', 'Password1')
  await page.fill('[name=workspace_name]', 'Acme Corp')
  await page.click('button[type=submit]')
  await page.waitForURL('/')

  // 2. Create project
  await page.click('[data-testid=new-project-btn]')
  await page.fill('[name=project-name]', 'Q1 Roadmap')
  await page.click('[data-testid=create-project-submit]')
  await page.waitForURL(/\/projects\//)

  // 3. Add task in board
  await page.click('[data-testid=add-task-inline]')
  await page.fill('[data-testid=task-title-input]', 'Design homepage')
  await page.keyboard.press('Enter')
  await expect(page.locator('text=Design homepage')).toBeVisible()

  // 4. Open task detail
  await page.click('text=Design homepage')
  await expect(page.locator('[data-testid=task-detail-drawer]')).toBeVisible()

  // 5. Complete task
  await page.click('[data-testid=task-status-btn]')
  await page.click('text=Completed')
  await expect(page.locator('[data-testid=task-status-btn]')).toContainText('Completed')
})
```

### board-drag-drop.spec.ts
```typescript
test('drag task between columns updates section', async ({ page }) => {
  // Setup: go to board with known tasks
  // Drag task from "Backlog" to "In Progress"
  // Verify task appears in In Progress column
  // Reload page, verify position persisted
})
```

## Todo
- [ ] Setup pytest + pytest-asyncio + httpx in backend
- [ ] Create test DB (workboard_test) + conftest.py
- [ ] Write auth tests (register, login, refresh, 401 cases)
- [ ] Write task tests (CRUD, position, subtask depth, complete, soft delete)
- [ ] Write RBAC tests (viewer 403, private project 404, commenter restrictions)
- [ ] Write notification tests (assign creates notification)
- [ ] Setup Vitest + React Testing Library in frontend
- [ ] Write authStore unit tests
- [ ] Write TaskCard render tests
- [ ] Setup Playwright + write full user flow E2E test
- [ ] Write board DnD E2E test
- [ ] All tests must pass before marking phase complete

## Success Criteria
- Backend: all pytest tests pass (0 failures, 0 errors)
- Frontend: all Vitest tests pass
- E2E: full user flow passes in Chromium
- RBAC: all 403/404 permission tests correct
- No test uses fake data, mocks only external services (email)

## Risk Assessment
- Test DB: run `CREATE DATABASE workboard_test` before tests; add to CI setup
- Playwright DnD: use `page.dragAndDrop()` or `mouse.move()` — test carefully on Chromium

## Next Steps
→ Phase complete → Cook implementation
