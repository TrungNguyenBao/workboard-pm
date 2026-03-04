# Phase 4: Update Entry Point and Finalize

## Context
- Phases 1-3 create the modular seed files
- This phase wires everything together and validates

## Overview
- **Priority**: P1
- **Status**: completed
- **Effort**: 15min

## Implementation Steps

### Step 1: Verify `__main__.py` imports all seed modules

```python
"""Entry point: python -m app.scripts.seed"""
import asyncio

from app.scripts.seed_shared import AsyncSessionLocal, engine, clear_data, seed_users_and_workspace
from app.scripts.seed_pms import seed_pms
from app.scripts.seed_crm import seed_crm
from app.scripts.seed_wms import seed_wms
from app.scripts.seed_hrm import seed_hrm


async def main() -> None:
    print("A-ERP seed script")
    print("=" * 40)
    async with AsyncSessionLocal() as session:
        await clear_data(session)
        ctx = await seed_users_and_workspace(session)

        ws = ctx["ws_id"]
        demo = ctx["demo_id"]
        alice = ctx["alice_id"]
        bob = ctx["bob_id"]

        await seed_pms(session, ws, demo, alice, bob)
        await seed_crm(session, ws)
        await seed_wms(session, ws)
        await seed_hrm(session, ws, demo, alice, bob)

        await session.commit()

    await engine.dispose()
    print("\nSeed complete. Login: demo@workboard.io / demo1234")


if __name__ == "__main__":
    asyncio.run(main())
```

### Step 2: Verify TRUNCATE_TABLES in `seed_shared.py`

Must include ALL tables from ALL modules. Full list:
```
payroll_records, leave_requests, leave_types, employees, departments,
inventory_items, wms_devices, wms_products, wms_suppliers, warehouses,
deals, contacts,
goal_task_links, goal_project_links, goals,
task_followers, task_tags, task_dependencies,
comments, attachments, custom_field_definitions,
tasks, sections, project_memberships, projects,
tags, team_memberships, teams,
workspace_memberships, workspaces,
refresh_tokens, activity_logs, notifications, users
```

### Step 3: Verify Makefile
Existing: `cd backend && uv run python -m app.scripts.seed`
This resolves to `backend/app/scripts/__main__.py` -- correct.

### Step 4: Delete old file
```bash
rm backend/scripts/seed.py
```
Also check if `backend/scripts/` directory has other files. If empty, remove the directory.

### Step 5: Print summary at end
After all seeds, print counts:
```
Seed complete. Login: demo@workboard.io / demo1234
  PMS: 3 projects, 18 tasks, 2 goals, 5 tags
  CRM: 10 contacts, 12 deals
  WMS: 2 warehouses, 6 products, 3 suppliers, 8 devices, 6 inventory items
  HRM: 4 departments, 8 employees, 4 leave types, 6 leave requests, 16 payroll records
```

Each seed function should return a summary dict, and `__main__.py` prints them.

### Step 6: Run and validate
```bash
cd backend && uv run python -m app.scripts.seed
```
Verify no errors, check DB counts:
```sql
SELECT 'warehouses' as t, count(*) FROM warehouses
UNION ALL SELECT 'wms_products', count(*) FROM wms_products
UNION ALL SELECT 'departments', count(*) FROM departments
UNION ALL SELECT 'employees', count(*) FROM employees;
```

## Todo List
- [x] Finalize `__main__.py` with all imports and summary printing
- [x] Verify TRUNCATE_TABLES includes all WMS + HRM tables
- [x] Delete `backend/scripts/seed.py`
- [x] Run `make seed` end-to-end
- [x] Spot-check DB counts
- [x] Verified: all module data present, idempotent (running twice produces same result), clean summary output

## Success Criteria
- `make seed` completes without errors
- All module data present in DB
- Idempotent (running twice produces same result)
- Clean summary output

## Risk Assessment
- **Missing table in TRUNCATE**: would cause FK violation on second run. Mitigated by CASCADE flag.
- **Import errors**: if any seed module has syntax error, whole script fails. Test early.
