---
title: "CRM Module — Complete Gap Closure (28 US, 13 New Models, 14 Logic Fixes)"
description: "Close all 26 partial/missing user stories: 13 new models, 14 logic refactors, RBAC expansion, frontend polish"
status: pending
priority: P1
effort: 56h
branch: main
tags: [crm, backend, frontend, models, api, refactor]
created: 2026-03-14
---

# CRM Module — Revised Implementation Plan

## Gap Analysis Reference
`plans/reports/gap-analysis-260314-0016-crm-userstory-vs-code.md`

## Current State
- 8/21 models implemented (Lead, Contact, Deal, Account, Activity, Campaign, Ticket, PipelineStage + ScoringConfig)
- 1/27 user stories DONE, 17 PARTIAL, 9 MISSING
- Critical logic gaps: lead scoring dual-mode, health score formula, deal reopen, RBAC, stale thresholds

## Key Code Findings (from source review)
- `activity.py` L29-35 already has activity-based scoring (+15 call, +20 demo, etc.) -- gap analysis partially incorrect
- `lead_workflows.py` `calculate_lead_score()` is static source+completeness, used only on lead creation
- `deal_workflows.py` `close_deal()` blocks already-closed deals (L57-58) -- no reopen path
- `deal_workflows.py` `get_stale_deals()` hardcodes `days=30` -- needs 60d general + 30d high-value
- `account.py` `calculate_health_score()` is penalty-based (100 - penalties) -- needs weighted formula
- No CRM dependencies/ folder exists -- RBAC is workspace-level only (admin/member/guest)

## Phase Overview

| Phase | Priority | Focus | Effort | Status |
|-------|----------|-------|--------|--------|
| [Phase 1](phase-01-p0-new-models.md) | P0 | ProductService, Contract, CrmNotification, CrmAttachment, DealContactRole | 8h | pending |
| [Phase 2](phase-02-p0-logic-fixes.md) | P0 | Lead scoring refactor, RBAC expansion, health score, deal reopen, stale thresholds, activity->score fix | 8h | pending |
| [Phase 3](phase-03-quotation-contract.md) | P0 | Quotation + QuotationLine + close-deal auto-create Contract | 8h | pending |
| [Phase 4](phase-04-p1-new-models.md) | P1 | CrmCustomField, EmailTemplate, EmailLog, Competitor | 8h | pending |
| [Phase 5](phase-05-p1-features.md) | P1 | SalesForecast, ImportJob, enhanced analytics | 8h | pending |
| [Phase 6](phase-06-integration-polish.md) | P1/P2 | Cross-module, campaign ROI, pipeline config, data quality score | 8h | pending |
| [Phase 7](phase-07-frontend-polish.md) | P1/P2 | BANT checklist, My Leads toggle, contact detail, bulk actions, revenue chart | 8h | pending |

## Gap-to-Phase Mapping

| Gap # | Description | Phase |
|-------|-------------|-------|
| 1 | Lead scoring refactor (interaction-based) | 2 |
| 2 | RBAC expansion (5 CRM roles) | 2 |
| 3 | Health score weighted formula | 2 |
| 4 | Deal reopen endpoint | 2 |
| 5 | Activity->score trigger fix | 2 |
| 6 | Stale thresholds (60d/30d) | 2 |
| 7 | BANT checklist UI | 7 |
| 8 | Bulk disqualify | 7 |
| 9 | My Leads toggle | 7 |
| 10 | Contact detail (linked deals/emails/tickets) | 7 |
| 11 | Revenue auto-aggregate SUM(won deals) | 2 |
| 12 | Campaign ROI formula | 6 |
| 13 | Ticket reopen_count field | 2 |
| 14 | Overall data quality score 0-100 | 6 |
| M1 | ProductService | 1 |
| M2 | Quotation + QuotationLine | 3 |
| M3 | Contract | 1 |
| M4 | DealContactRole | 1 |
| M5 | Competitor | 4 |
| M6 | EmailTemplate + EmailLog | 4 |
| M7 | CrmNotification | 1 |
| M8 | CrmAttachment | 1 |
| M9 | CrmCustomField | 4 |
| M10 | SalesForecast | 5 |
| M11 | ImportJob | 5 |

## Dependencies

```
Phase 1 (models) --> Phase 2 (logic fixes use new models)
Phase 1 (ProductService) --> Phase 3 (Quotation references products)
Phase 1 (Notification) --> Phase 2+ (notification triggers)
Phase 1 (Contract) --> Phase 3 (close-deal auto-create)
Phase 4 (CustomField) --> Phase 5 (ImportJob respects custom fields)
```

## Migration Strategy
One Alembic migration per phase. Each adds tables + indexes. Never modify completed migrations.

## Patterns
- Models: `Base` + `TimestampMixin`, `Mapped[T]`, UUID PKs, `workspace_id` FK
- Routers: thin, `Depends(require_workspace_role())`, delegate to service
- Services: async, commit inside, return model
- Schemas: Pydantic v2, `model_config = {"from_attributes": True}`
- Frontend: feature folders, TanStack Query, kebab-case, <200 lines
