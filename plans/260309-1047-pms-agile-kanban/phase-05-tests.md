# Phase 5: Tests — Backend pytest + Frontend vitest

## Context Links
- [Phase 1 — DB Models](./phase-01-db-models-migration.md)
- [Phase 2 — Backend API](./phase-02-backend-api.md)
- [Phase 3 — Frontend UI](./phase-03-frontend-sprint-ui.md)
- [Phase 4 — Analytics](./phase-04-analytics.md)
- [Existing board test](../../frontend/src/modules/pms/features/projects/tests/board.test.tsx)
- [Sprint service](./phase-02-backend-api.md#step-2-create-sprint-service)
- [Sprint router](./phase-02-backend-api.md#step-4-create-sprint-router)

## Overview
- **Priority:** P2
- **Status:** completed
- **Effort:** 1.5h
- **Depends on:** Phases 1-4 (all implementation complete)
- **Description:** Backend pytest tests for sprint CRUD, lifecycle, backlog, and analytics endpoints. Frontend vitest tests for sprint hooks and key components.

## Requirements

### Functional
- Test sprint CRUD operations (create, list, get, update, delete)
- Test sprint lifecycle transitions (start, complete) including error cases
- Test backlog endpoint (tasks without sprint)
- Test burndown and velocity data computation
- Test frontend sprint hooks render correctly
- Test WIP limit display logic

### Non-Functional
- Use existing test patterns (async pytest with httpx for backend, vitest + testing-library for frontend)
- No mocking of DB -- use test database (existing pattern)
- Keep test files under 200 lines each; split if needed

## Architecture

### Test Strategy

```
Backend (pytest):
  test_sprint_crud.py       -- CRUD + soft delete
  test_sprint_lifecycle.py  -- start/complete transitions, one-active constraint
  test_sprint_board.py      -- board + backlog + analytics endpoints

Frontend (vitest):
  sprint-selector.test.tsx  -- render, selection, sprint list display
```

### Test Database Setup

Backend tests use the existing conftest.py fixtures:
- `db` -- async session with test database
- `client` -- httpx AsyncClient with auth headers
- `test_user` -- authenticated user
- `test_workspace` -- workspace fixture
- `test_project` -- project with default sections

These fixtures already exist in the PMS test suite. New tests should reuse them.

## Related Code Files

### Files to CREATE
1. `backend/tests/modules/pms/test_sprint_crud.py`
2. `backend/tests/modules/pms/test_sprint_lifecycle.py`
3. `frontend/src/modules/pms/features/projects/tests/sprint-selector.test.tsx`

### Files to MODIFY
None -- tests are additive only.

## Implementation Steps

### Step 1: Create sprint CRUD tests

Create `backend/tests/modules/pms/test_sprint_crud.py`:

```python
"""Tests for sprint CRUD endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_sprint(client: AsyncClient, test_project):
    """POST /pms/projects/{id}/sprints creates a sprint in planning status."""
    resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints",
        json={"name": "Sprint 1", "goal": "Deliver MVP"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Sprint 1"
    assert data["goal"] == "Deliver MVP"
    assert data["status"] == "planning"
    assert data["project_id"] == str(test_project.id)


@pytest.mark.asyncio
async def test_list_sprints(client: AsyncClient, test_project):
    """GET /pms/projects/{id}/sprints returns all sprints."""
    # Create two sprints
    await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints",
        json={"name": "Sprint 1"},
    )
    await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints",
        json={"name": "Sprint 2"},
    )
    resp = await client.get(f"/api/v1/pms/projects/{test_project.id}/sprints")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_list_sprints_status_filter(client: AsyncClient, test_project):
    """GET /pms/projects/{id}/sprints?status=planning filters by status."""
    await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints",
        json={"name": "Planning Sprint"},
    )
    resp = await client.get(
        f"/api/v1/pms/projects/{test_project.id}/sprints?status=planning"
    )
    assert resp.status_code == 200
    for sprint in resp.json():
        assert sprint["status"] == "planning"


@pytest.mark.asyncio
async def test_get_sprint(client: AsyncClient, test_project):
    """GET /pms/projects/{id}/sprints/{sprint_id} returns sprint detail."""
    create_resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints",
        json={"name": "Sprint X"},
    )
    sprint_id = create_resp.json()["id"]
    resp = await client.get(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint_id}"
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Sprint X"


@pytest.mark.asyncio
async def test_update_sprint(client: AsyncClient, test_project):
    """PATCH /pms/projects/{id}/sprints/{sprint_id} updates sprint fields."""
    create_resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints",
        json={"name": "Old Name"},
    )
    sprint_id = create_resp.json()["id"]
    resp = await client.patch(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint_id}",
        json={"name": "New Name", "goal": "Updated goal"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"
    assert resp.json()["goal"] == "Updated goal"


@pytest.mark.asyncio
async def test_delete_sprint(client: AsyncClient, test_project):
    """DELETE /pms/projects/{id}/sprints/{sprint_id} soft-deletes sprint."""
    create_resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints",
        json={"name": "To Delete"},
    )
    sprint_id = create_resp.json()["id"]
    del_resp = await client.delete(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint_id}"
    )
    assert del_resp.status_code == 204

    # Verify sprint no longer appears in list
    list_resp = await client.get(
        f"/api/v1/pms/projects/{test_project.id}/sprints"
    )
    ids = [s["id"] for s in list_resp.json()]
    assert sprint_id not in ids


@pytest.mark.asyncio
async def test_get_nonexistent_sprint(client: AsyncClient, test_project):
    """GET sprint with bad ID returns 404."""
    resp = await client.get(
        f"/api/v1/pms/projects/{test_project.id}/sprints/00000000-0000-0000-0000-000000000000"
    )
    assert resp.status_code == 404
```

### Step 2: Create sprint lifecycle tests

Create `backend/tests/modules/pms/test_sprint_lifecycle.py`:

```python
"""Tests for sprint lifecycle transitions and constraints."""
import pytest
from httpx import AsyncClient


async def _create_sprint(client: AsyncClient, project_id, name="Sprint"):
    resp = await client.post(
        f"/api/v1/pms/projects/{project_id}/sprints",
        json={"name": name},
    )
    return resp.json()


@pytest.mark.asyncio
async def test_start_sprint(client: AsyncClient, test_project):
    """POST .../start transitions planning -> active."""
    sprint = await _create_sprint(client, test_project.id)
    resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint['id']}/start"
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"
    assert resp.json()["start_date"] is not None


@pytest.mark.asyncio
async def test_start_sprint_already_active_returns_400(client: AsyncClient, test_project):
    """Cannot start a sprint that is already active."""
    sprint = await _create_sprint(client, test_project.id)
    await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint['id']}/start"
    )
    # Try to start again
    resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint['id']}/start"
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_only_one_active_sprint(client: AsyncClient, test_project):
    """Starting a second sprint while one is active returns 409."""
    s1 = await _create_sprint(client, test_project.id, "Sprint 1")
    s2 = await _create_sprint(client, test_project.id, "Sprint 2")
    await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{s1['id']}/start"
    )
    resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{s2['id']}/start"
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_complete_sprint(client: AsyncClient, test_project):
    """POST .../complete transitions active -> completed."""
    sprint = await _create_sprint(client, test_project.id)
    await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint['id']}/start"
    )
    resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint['id']}/complete"
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"
    assert resp.json()["end_date"] is not None


@pytest.mark.asyncio
async def test_complete_planning_sprint_returns_400(client: AsyncClient, test_project):
    """Cannot complete a sprint that is still in planning."""
    sprint = await _create_sprint(client, test_project.id)
    resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/sprints/{sprint['id']}/complete"
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_backlog_returns_unsprinted_tasks(client: AsyncClient, test_project):
    """GET .../backlog returns tasks with no sprint_id."""
    # Create task without sprint
    await client.post(
        f"/api/v1/pms/projects/{test_project.id}/tasks",
        json={"title": "Backlog task"},
    )
    resp = await client.get(
        f"/api/v1/pms/projects/{test_project.id}/backlog"
    )
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert "Backlog task" in titles


@pytest.mark.asyncio
async def test_backlog_excludes_sprinted_tasks(
    client: AsyncClient, test_project
):
    """Tasks assigned to a sprint do not appear in backlog."""
    sprint = await _create_sprint(client, test_project.id)
    task_resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/tasks",
        json={"title": "Sprinted task", "sprint_id": sprint["id"]},
    )
    resp = await client.get(
        f"/api/v1/pms/projects/{test_project.id}/backlog"
    )
    titles = [t["title"] for t in resp.json()]
    assert "Sprinted task" not in titles


@pytest.mark.asyncio
async def test_task_agile_fields_round_trip(client: AsyncClient, test_project):
    """Create task with agile fields and verify they persist."""
    sprint = await _create_sprint(client, test_project.id)
    resp = await client.post(
        f"/api/v1/pms/projects/{test_project.id}/tasks",
        json={
            "title": "Agile task",
            "story_points": 5,
            "task_type": "story",
            "sprint_id": sprint["id"],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["story_points"] == 5
    assert data["task_type"] == "story"
    assert data["sprint_id"] == sprint["id"]
```

### Step 3: Create frontend sprint-selector test

Create `frontend/src/modules/pms/features/projects/tests/sprint-selector.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SprintSelector } from '../components/sprint-selector'

// Mock the hooks
vi.mock('../hooks/use-sprints', () => ({
  useSprints: () => ({
    data: [
      {
        id: 'sprint-1',
        name: 'Sprint 1',
        status: 'active',
        project_id: 'proj-1',
        goal: null,
        start_date: '2026-03-01',
        end_date: '2026-03-15',
        created_by_id: 'user-1',
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        task_count: 5,
        completed_points: 8,
        total_points: 21,
      },
      {
        id: 'sprint-2',
        name: 'Sprint 2',
        status: 'planning',
        project_id: 'proj-1',
        goal: null,
        start_date: null,
        end_date: null,
        created_by_id: 'user-1',
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        task_count: 0,
        completed_points: 0,
        total_points: 0,
      },
    ],
  }),
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('SprintSelector', () => {
  it('renders with Backlog label when no sprint selected', () => {
    render(
      <SprintSelector projectId="proj-1" selectedSprintId={null} onSelect={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText('Backlog')).toBeInTheDocument()
  })

  it('renders with sprint name when sprint selected', () => {
    render(
      <SprintSelector projectId="proj-1" selectedSprintId="sprint-1" onSelect={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText('Sprint 1')).toBeInTheDocument()
  })

  it('shows Sprint: label', () => {
    render(
      <SprintSelector projectId="proj-1" selectedSprintId={null} onSelect={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByText('Sprint:')).toBeInTheDocument()
  })
})
```

**Note:** These are smoke tests verifying rendering. Integration tests with real API calls would use MSW (mock service worker) if the project adopts it later.

## Todo List

- [ ] Create `backend/tests/modules/pms/test_sprint_crud.py`
- [ ] Create `backend/tests/modules/pms/test_sprint_lifecycle.py`
- [ ] Create `frontend/.../tests/sprint-selector.test.tsx`
- [ ] Run `make test` -- verify all tests pass
- [ ] Verify existing task tests still pass (no regressions)
- [ ] Verify existing board test still passes

## Success Criteria

- All backend sprint tests pass: CRUD, lifecycle, backlog, agile fields
- Frontend sprint-selector test passes
- Existing test suite has zero regressions
- `make test` exits 0

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Test DB fixtures may not exist in all envs | Use existing conftest.py patterns, document fixture requirements |
| Sprint lifecycle tests depend on DB state | Each test creates its own sprint, no shared state between tests |
| Frontend mocks drift from real API | Keep mock data matching SprintResponse schema exactly |

## Security Considerations

- Tests use authenticated client fixtures (existing pattern)
- No test credentials committed to repo
- Test database is separate from production (existing setup)
