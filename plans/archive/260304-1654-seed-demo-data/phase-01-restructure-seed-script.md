# Phase 1: Restructure Seed Script into Modular Files

## Context
- Current: `backend/scripts/seed.py` (675 lines, single monolith)
- Makefile expects: `python -m app.scripts.seed` (module path `backend/app/scripts/`)
- Goal: split into per-module files under `backend/app/scripts/`, each under 200 lines

## Overview
- **Priority**: P1 (blocks all other phases)
- **Status**: completed
- **Effort**: 45min

## Related Code Files

### Files to Create
- `backend/app/scripts/__init__.py` -- empty
- `backend/app/scripts/__main__.py` -- entry point
- `backend/app/scripts/seed_shared.py` -- DB engine, helpers, users, workspace
- `backend/app/scripts/seed_pms.py` -- projects, sections, tasks, tags, comments, goals, custom fields
- `backend/app/scripts/seed_crm.py` -- contacts, deals

### Files to Delete
- `backend/scripts/seed.py` -- replaced by modular structure

## Implementation Steps

### Step 1: Create `backend/app/scripts/__init__.py`
Empty file.

### Step 2: Create `backend/app/scripts/seed_shared.py`
Extract from existing seed.py:
```python
"""Shared seed utilities: engine, helpers, users, workspace."""
import os
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://workboard:workboard@localhost:5432/workboard",
)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def days(n: int) -> timedelta:
    return timedelta(days=n)

# Full table list for TRUNCATE (order doesn't matter with CASCADE)
TRUNCATE_TABLES = (
    "payroll_records, leave_requests, leave_types, employees, departments, "
    "inventory_items, wms_devices, wms_products, wms_suppliers, warehouses, "
    "deals, contacts, "
    "goal_task_links, goal_project_links, goals, "
    "task_followers, task_tags, task_dependencies, "
    "comments, attachments, custom_field_definitions, "
    "tasks, sections, project_memberships, projects, "
    "tags, team_memberships, teams, "
    "workspace_memberships, workspaces, "
    "refresh_tokens, activity_logs, notifications, users"
)

async def clear_data(session: AsyncSession) -> None:
    print("  Clearing existing data...")
    await session.execute(text(f"TRUNCATE TABLE {TRUNCATE_TABLES} RESTART IDENTITY CASCADE"))
    await session.commit()
    print("  Done clearing.")

async def seed_users_and_workspace(session: AsyncSession) -> dict:
    """Create 3 users + 1 workspace. Returns dict with IDs."""
    print("Creating users...")
    demo_id = uuid.uuid4()
    alice_id = uuid.uuid4()
    bob_id = uuid.uuid4()

    await session.execute(text("""
        INSERT INTO users (id, email, name, hashed_password, is_active, created_at, updated_at)
        VALUES
          (:id1, 'demo@workboard.io', 'Demo User',  :pw1, true, now(), now()),
          (:id2, 'alice@workboard.io', 'Alice Chen', :pw2, true, now(), now()),
          (:id3, 'bob@workboard.io',   'Bob Martinez', :pw3, true, now(), now())
    """), {
        "id1": demo_id, "pw1": hash_password("demo1234"),
        "id2": alice_id, "pw2": hash_password("demo1234"),
        "id3": bob_id,   "pw3": hash_password("demo1234"),
    })

    print("Creating workspace...")
    ws_id = uuid.uuid4()
    await session.execute(text("""
        INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
        VALUES (:id, 'Acme Corp', 'acme-corp', :owner, now(), now())
    """), {"id": ws_id, "owner": demo_id})

    for user_id, role in [(demo_id, "admin"), (alice_id, "member"), (bob_id, "member")]:
        await session.execute(text("""
            INSERT INTO workspace_memberships
              (id, workspace_id, user_id, role, created_at, updated_at)
            VALUES (:id, :ws, :user, :role, now(), now())
        """), {"id": uuid.uuid4(), "ws": ws_id, "user": user_id, "role": role})

    return {
        "demo_id": demo_id, "alice_id": alice_id, "bob_id": bob_id,
        "ws_id": ws_id,
    }
```
~75 lines. Well under 200.

### Step 3: Create `backend/app/scripts/seed_pms.py`
Extract PMS section from existing seed.py (tags, projects, sections, custom fields, tasks, comments, goals, followers).

Signature:
```python
async def seed_pms(session: AsyncSession, ws_id, demo_id, alice_id, bob_id) -> dict:
    """Seed PMS module. Returns dict of created IDs."""
```
This will be the longest file (~190 lines). Copy existing logic verbatim.

### Step 4: Create `backend/app/scripts/seed_crm.py`
Extract CRM section from existing seed.py.

Signature:
```python
async def seed_crm(session: AsyncSession, ws_id) -> dict:
    """Seed CRM contacts and deals. Returns dict of created IDs."""
```
~80 lines.

### Step 5: Create `backend/app/scripts/__main__.py`
```python
"""Entry point: python -m app.scripts.seed"""
import asyncio
from app.scripts.seed_shared import AsyncSessionLocal, engine, clear_data, seed_users_and_workspace
from app.scripts.seed_pms import seed_pms
from app.scripts.seed_crm import seed_crm
from app.scripts.seed_wms import seed_wms  # phase 2
from app.scripts.seed_hrm import seed_hrm  # phase 3

async def main() -> None:
    print("WorkBoard seed script")
    print("=" * 40)
    async with AsyncSessionLocal() as session:
        await clear_data(session)
        ctx = await seed_users_and_workspace(session)
        ws_id = ctx["ws_id"]
        demo_id, alice_id, bob_id = ctx["demo_id"], ctx["alice_id"], ctx["bob_id"]

        await seed_pms(session, ws_id, demo_id, alice_id, bob_id)
        await seed_crm(session, ws_id)
        await seed_wms(session, ws_id)
        await seed_hrm(session, ws_id, demo_id)

        await session.commit()
    await engine.dispose()
    print("\nSeed complete.")

if __name__ == "__main__":
    asyncio.run(main())
```
~30 lines.

### Step 6: Delete `backend/scripts/seed.py`
Remove the old monolith file.

### Step 7: Verify Makefile
Makefile already has `cd backend && uv run python -m app.scripts.seed` -- this matches the new `app/scripts/__main__.py`.

## Todo List
- [x] Create `backend/app/scripts/__init__.py`
- [x] Create `backend/app/scripts/seed_shared.py`
- [x] Create `backend/app/scripts/seed_pms.py` (extract from existing)
- [x] Create `backend/app/scripts/seed_crm.py` (extract from existing)
- [x] Create `backend/app/scripts/__main__.py`
- [x] Delete `backend/scripts/seed.py`
- [x] Run `make seed` to verify no regressions
- [x] Split `seed_pms.py` into 4 files: seed_pms.py, seed_pms_setup.py, seed_pms_tasks.py, seed_pms_extras.py (to meet 200-line limit)

## Success Criteria
- `make seed` works identically to before
- Each file under 200 lines
- No duplicate code between files

## Risk Assessment
- **Low risk**: purely mechanical refactor, no logic changes
- Ensure all task IDs and cross-references preserved when splitting
