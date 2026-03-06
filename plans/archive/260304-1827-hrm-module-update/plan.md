---
title: "HRM Module Update (Phase 1+2)"
description: "Expand HRM from 5 basic entities to full HR platform: org structure, recruitment, attendance, performance, training, offboarding, assets"
status: pending
priority: P1
effort: 40h
branch: main
tags: [hrm, backend, frontend, database]
created: 2026-03-04
---

# HRM Module Update — Phase 1 + 2

## Summary
Expand HRM module from 5 entities (departments, employees, leave types/requests, payroll) to 27 entities covering full HR lifecycle. 22 new tables + 2 alterations, ~12 new pages, ~65 new API endpoints.

## Architecture Decisions
- Hardcoded per-feature (no generic workflow engine) -- YAGNI
- Employee stays lightweight; related data in separate FK tables
- Department hierarchy via self-referential FK + recursive CTE
- Admin features (assets, procurement) stay inside HRM module
- VN tax brackets as hardcoded constants
- Local file storage for uploads (resume, contracts)

## Phases

| Phase | Name | Status | Effort | Depends On |
|-------|------|--------|--------|------------|
| 1A | [Org Structure](phase-1a-org-structure.md) | pending | 4h | -- |
| 1B | [Employee Records](phase-1b-employee-records.md) | pending | 5h | -- |
| 1C | [Recruitment Pipeline](phase-1c-recruitment-pipeline.md) | pending | 8h | 1A, 1B |
| 1D | [Attendance & C&B](phase-1d-attendance-payroll.md) | pending | 6h | 1B |
| 2A | [Performance Mgmt](phase-2a-performance.md) | pending | 5h | 1B |
| 2B | [Training & Dev](phase-2b-training.md) | pending | 3h | -- |
| 2C | [Offboarding](phase-2c-offboarding.md) | pending | 4h | 1B |
| 2D | [Assets & Procurement](phase-2d-assets-procurement.md) | pending | 5h | -- |

## Implementation Order
```
Phase 1A + 1B ──> parallel, no deps
Phase 1C ────────> after 1A + 1B
Phase 1D ────────> after 1B
Phase 2A ────────> after 1B
Phase 2B ────────> independent
Phase 2C ────────> after 1B
Phase 2D ────────> independent
```

## Key Patterns (existing codebase)
- **Backend:** model -> schema -> service -> router (thin routers, service owns logic)
- **Frontend:** hook (TanStack Query) -> component -> page
- **Routes:** `/api/v1/hrm/workspaces/{workspace_id}/{resource}`
- **Pagination:** offset-based via `PaginatedResponse[T]`
- **RBAC:** `require_workspace_role("member"|"admin"|"guest")`
- **Models:** `Base + TimestampMixin`, `Mapped[T]` typed, UUID PK
- **Schemas:** Pydantic v2, `from_attributes=True`, Create/Update/Response

## References
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- [Code Standards](../../docs/code-standards.md)
- Existing HRM: `backend/app/modules/hrm/`
- Frontend HRM: `frontend/src/modules/hrm/features/`
