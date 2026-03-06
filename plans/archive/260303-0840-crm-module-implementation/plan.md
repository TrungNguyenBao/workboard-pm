---
title: "CRM Module Implementation"
description: "Enhance CRM backend with pagination/filtering, build full frontend for contacts and deals"
status: completed
priority: P2
effort: 6h
branch: main
tags: [crm, frontend, backend, module]
created: 2026-03-03
completed: 2026-03-03
---

# CRM Module Implementation

## Goal

Transform CRM from scaffold (basic CRUD + placeholder UI) into a functional module with paginated/filterable lists and full CRUD UI for contacts and deals.

## Current State

- **Backend:** Basic CRUD for contacts/deals, no pagination, no search/filtering
- **Frontend:** Two "coming soon" placeholder pages, no hooks/components/dialogs
- **DB:** Tables `contacts` and `deals` exist via migration `4988635d81cc`
- **Routes:** Registered in `router.tsx` at `/crm` (contacts only, no deals route)

## Phases

| # | Phase | Status | Effort | Files |
|---|-------|--------|--------|-------|
| 1 | [Backend Enhancements](./phase-01-backend-enhancements.md) | completed | 1.5h | 6 modified |
| 2 | [Frontend Shared Components](./phase-02-frontend-shared-components.md) | completed | 1h | 3 new |
| 3 | [Contacts Frontend](./phase-03-contacts-frontend.md) | completed | 1.5h | 3 modified/new |
| 4 | [Deals Frontend](./phase-04-deals-frontend.md) | completed | 2h | 3 modified/new, 2 modified |

## Architecture

```
Backend changes:
  - Add CRM-specific PaginatedResponse schema (reuse WMS pattern)
  - Add search/filter params to list_contacts and list_deals services
  - Update routers to accept Query params and return PaginatedResponse

Frontend additions:
  modules/crm/features/
    shared/components/     crm-data-table, crm-pagination, crm-page-header
    contacts/hooks/        use-contacts.ts
    contacts/components/   contact-form-dialog.tsx
    contacts/pages/        contacts-list.tsx (replace placeholder)
    deals/hooks/           use-deals.ts
    deals/components/      deal-form-dialog.tsx
    deals/pages/           deals-list.tsx (replace placeholder)

Router updates:
  - Add /crm/contacts and /crm/deals routes
  - Add CRM sidebar nav items
```

## Dependencies

- Shared UI: Dialog, Input, Label, Select, Badge, Button, toast (all exist)
- Stores: workspace.store (activeWorkspaceId), module.store (activeModule === 'crm')
- API: axios instance at `@/shared/lib/api`
- RBAC: `require_workspace_role` dependency (exists)

## Out of Scope

- Custom fields, activity logging, tags, soft delete
- Deal pipeline Kanban view
- Contact enrichment, import/export
- Full-text search (tsvector) -- ILIKE sufficient
