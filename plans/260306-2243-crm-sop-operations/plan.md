---
title: "CRM SOP Operational Workflows"
description: "Add workflow logic for all 15 CRM SOPs: lead scoring, distribution, deal closing, data quality, governance, and dashboard enhancements"
status: pending
priority: P1
effort: 14h
branch: main
tags: [crm, sop, backend, frontend, workflows]
created: 2026-03-06
---

# CRM SOP Operational Workflows

## Goal

The CRM module has full CRUD for 7 entities (Lead, Contact, Account, Deal, Activity, Campaign, Ticket) plus dashboard analytics. What is MISSING is the operational workflow logic described in each of the 15 SOPs: duplicate detection, lead scoring, round-robin distribution, status flow validation, deal close workflow, data quality checks, governance alerts, and enhanced analytics/dashboard.

## Current State

| Entity   | Model | Schema | Service | Router | Frontend | Status     |
|----------|-------|--------|---------|--------|----------|------------|
| Lead     | Y     | Y      | Y       | Y      | Y        | CRUD only  |
| Contact  | Y     | Y      | Y       | Y      | Y        | CRUD only  |
| Account  | Y     | Y      | Y       | Y      | Y        | CRUD+360   |
| Deal     | Y     | Y      | Y       | Y      | Y        | CRUD only  |
| Activity | Y     | Y      | Y       | Y      | Y        | CRUD only  |
| Campaign | Y     | Y      | Y       | Y      | Y        | CRUD+stats |
| Ticket   | Y     | Y      | Y       | Y      | Y        | CRUD only  |

## SOP-to-Phase Mapping

| SOP | Name                  | Phase |
|-----|-----------------------|-------|
| 01  | Lead Creation         | 1,2,3 |
| 02  | Lead Qualification    | 1,2,3 |
| 03  | Lead Distribution     | 1,2,3 |
| 04  | Opportunity Creation  | 2,3   |
| 05  | Pipeline Management   | 1,2,3 |
| 06  | Activity Logging      | 1,2,3 |
| 07  | Deal Closing          | 1,2,3 |
| 08  | Customer Creation     | 1,2   |
| 09  | Customer Support      | 1,2,3 |
| 10  | Customer Retention    | 1,2,3 |
| 11  | Campaign Management   | 2,3   |
| 12  | Data Quality          | 2,3   |
| 13  | CRM Reporting         | 2,3   |
| 14  | KPI Dashboard         | 4     |
| 15  | Governance Rules      | 2,3   |

## Phases

| # | Name                          | Effort | Status  | File                                    |
|---|-------------------------------|--------|---------|-----------------------------------------|
| 1 | Model & Schema + Migration    | 3h     | pending | phase-01-models-schemas-migration.md    |
| 2 | Backend Service Logic         | 5h     | pending | phase-02-backend-service-logic.md       |
| 3 | Backend Router Updates        | 3h     | pending | phase-03-backend-router-updates.md      |
| 4 | Frontend Updates              | 3h     | pending | phase-04-frontend-updates.md            |

## Key Dependencies

- Phase 2 depends on Phase 1 (new model fields must exist)
- Phase 3 depends on Phase 2 (services must exist for routers to call)
- Phase 4 depends on Phase 3 (API endpoints must exist for frontend hooks)

## Architecture Constraints

- Files must stay under 200 lines -- split services into focused files if needed
- Single Alembic migration for all model changes
- Follow existing patterns exactly (UUID PKs, workspace_id FK, Pydantic v2)
- API base: `/api/v1/crm/workspaces/{workspace_id}/...`
- RBAC: `require_workspace_role("guest"/"member"/"admin")`
- DO NOT recreate existing files -- only modify them

## New Files to Create

**Backend:**
- `backend/app/modules/crm/services/lead-workflows.py` -- duplicate check, scoring, distribution
- `backend/app/modules/crm/services/deal-workflows.py` -- stage validation, close workflow, stale detection
- `backend/app/modules/crm/services/data-quality.py` -- duplicate detection, completeness, staleness
- `backend/app/modules/crm/services/governance.py` -- governance alerts aggregation
- `backend/app/modules/crm/schemas/workflows.py` -- workflow-specific request/response schemas
- `backend/app/modules/crm/routers/workflows.py` -- new workflow endpoints router

**Frontend:**
- `frontend/src/modules/crm/features/deals/components/deal-close-dialog.tsx`
- `frontend/src/modules/crm/features/leads/components/lead-distribute-dialog.tsx`
- `frontend/src/modules/crm/features/dashboard/components/stale-deals-alert.tsx`
- `frontend/src/modules/crm/features/dashboard/components/sales-funnel-chart.tsx`
- `frontend/src/modules/crm/features/dashboard/hooks/use-governance-alerts.ts`
