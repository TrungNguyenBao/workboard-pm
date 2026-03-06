---
title: "Seed demo data across all modules"
description: "Extend seed script to populate WMS and HRM modules with realistic Vietnamese-friendly demo data"
status: completed
priority: P1
effort: 2h
branch: main
tags: [seed, demo-data, wms, hrm, crm, pms]
created: 2026-03-04
completed: 2026-03-04
---

# Seed Demo Data -- All Modules

## Current State

Existing `backend/scripts/seed.py` (675 lines) already seeds:
- **Users**: demo@workboard.io, alice@workboard.io, bob@workboard.io (pw: demo1234)
- **Workspace**: Acme Corp
- **PMS**: 3 projects, sections, 18 tasks, subtasks, tags, comments, goals, custom fields, followers
- **CRM**: 10 contacts, 12 deals

**Missing**: WMS and HRM data. Also no `app/scripts/` module path (Makefile runs `python -m app.scripts.seed`).

## Issues to Fix

1. **Module path mismatch**: Makefile runs `cd backend && uv run python -m app.scripts.seed` but file lives at `backend/scripts/seed.py`, not `backend/app/scripts/seed.py`. Need to either move the file or fix the Makefile. Recommendation: create `backend/app/scripts/` with `__init__.py` + `__main__.py` + split seed files.
2. **File too large**: Current seed.py is 675 lines. Adding WMS + HRM would push it past 900. Must split into per-module files.
3. **TRUNCATE_TABLES missing WMS/HRM tables**: `wms_products`, `wms_devices`, `wms_suppliers`, `warehouses`, `inventory_items`, `departments`, `employees`, `leave_types`, `leave_requests`, `payroll_records`.
4. **Vietnamese-friendly data**: HRM employees should use Vietnamese names and departments in Vietnamese context.

## Architecture

```
backend/app/scripts/
  __init__.py              # empty
  __main__.py              # entry: asyncio.run(main())
  seed_shared.py           # users, workspace, memberships (extracted from existing)
  seed_pms.py              # projects, sections, tasks, tags, comments, goals, custom fields
  seed_wms.py              # NEW: products, warehouses, devices, suppliers, inventory items
  seed_hrm.py              # NEW: departments, employees, leave types, leave requests, payroll
  seed_crm.py              # contacts, deals (extracted from existing)
```

Each seed file exports a single async function: `async def seed_xxx(session, ws_id, user_ids) -> dict`
Returns dict of created IDs for cross-module references if needed.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Restructure seed script into modular files | completed | [phase-01](phase-01-restructure-seed-script.md) |
| 2 | Add WMS seed data | completed | [phase-02](phase-02-seed-wms-data.md) |
| 3 | Add HRM seed data | completed | [phase-03](phase-03-seed-hrm-data.md) |
| 4 | Update TRUNCATE + entry point + Makefile | completed | [phase-04](phase-04-update-entry-point.md) |

## Key Dependencies

- PostgreSQL running (via `docker-compose up -d`)
- Alembic migrations applied (`make migrate`)
- All model tables exist (WMS + HRM models already in codebase)

## Success Criteria

- `make seed` runs without errors
- All modules populated: PMS (3 projects, 18 tasks), WMS (5+ products, 2 warehouses), HRM (4+ departments, 8+ employees, leave data, payroll), CRM (10 contacts, 12 deals)
- Idempotent (TRUNCATE CASCADE before insert)
- Each file under 200 lines
