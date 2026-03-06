---
title: "HRM Module Implementation"
description: "Full HRM module: pagination/filtering backend, new models (payroll, leave), complete frontend for departments, employees, leave, payroll"
status: completed
completed: 2026-03-03
priority: P2
effort: 8h
branch: main
tags: [hrm, frontend, backend, module]
created: 2026-03-03
---

# HRM Module Implementation

## Goal

Transform HRM from scaffold (basic Employee/Department CRUD + placeholder UI) into a functional module with paginated/filterable lists, leave management, payroll records, and full CRUD UI.

## Current State

- **Backend:** Basic CRUD for employees/departments, no pagination, no search/filtering
- **Frontend:** Two "coming soon" placeholder pages
- **DB:** Tables `employees` and `departments` exist via migration `4988635d81cc`
- **Routes:** Registered in `router.tsx` at `/hrm` (single placeholder route)

## Phases

| # | Phase | Status | Effort | Key Files |
|---|-------|--------|--------|-----------|
| 1 | [Backend Enhancements](./phase-01-backend-enhancements.md) | completed | 2h | 12 modified/new |
| 2 | [Frontend Shared + Departments UI](./phase-02-frontend-departments.md) | completed | 1.5h | 6 new/modified |
| 3 | [Employees Frontend](./phase-03-employees-frontend.md) | completed | 1.5h | 4 new/modified |
| 4 | [Leave Management Frontend](./phase-04-leave-management.md) | completed | 1.5h | 4 new |
| 5 | [Payroll Records Frontend](./phase-05-payroll-records.md) | completed | 1.5h | 4 new |

## Architecture

```
Backend changes:
  - Reuse CRM PaginatedResponse schema (move to shared or import from crm)
  - Add search/filter/pagination to employee + department services
  - New models: PayrollRecord, LeaveType, LeaveRequest
  - New services + routers for leave + payroll
  - Alembic migration for new tables

Frontend additions:
  modules/hrm/features/
    shared/components/     hrm-data-table, hrm-pagination, hrm-page-header (reuse CRM pattern)
    departments/hooks/     use-departments.ts
    departments/components/ department-form-dialog.tsx
    departments/pages/     departments-list.tsx (replace placeholder)
    employees/hooks/       use-employees.ts
    employees/components/  employee-form-dialog.tsx
    employees/pages/       employees-list.tsx (replace placeholder)
    leave/hooks/           use-leave.ts
    leave/components/      leave-request-form-dialog.tsx, leave-type-form-dialog.tsx
    leave/pages/           leave-requests-list.tsx
    payroll/hooks/         use-payroll.ts
    payroll/components/    payroll-form-dialog.tsx
    payroll/pages/         payroll-list.tsx

Router updates:
  - Add /hrm/departments, /hrm/employees, /hrm/leave, /hrm/payroll routes
  - Add HRM sidebar nav items
```

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Payroll calc | Store amounts only | KISS — calc rules vary |
| Leave approval | Single-level admin | Multi-level YAGNI |
| Leave calendar | Skip | YAGNI for v1 |
| Shared components | Reuse CRM pattern (separate HRM copies) | Module isolation |
| PaginatedResponse | Moved to shared app/schemas/ | DRY + module isolation |

## Dependencies

- Shared UI: Dialog, Input, Label, Select, Badge, Button, toast (all exist)
- Stores: workspace.store (activeWorkspaceId), module.store (activeModule === 'hrm')
- API: axios instance at `@/shared/lib/api`
- RBAC: `require_workspace_role` dependency (exists)

## Out of Scope

- Org chart visualization
- Multi-level leave approval
- Auto payroll calculation
- Leave calendar view
- Employee import/export
