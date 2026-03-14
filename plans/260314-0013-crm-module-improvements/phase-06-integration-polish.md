---
phase: 6
title: "P1/P2 Integration & Polish — Cross-module, Campaign ROI, Pipeline Config, Data Quality"
sprint: Sprint 6
priority: P1/P2
effort: 8h
status: pending
user_stories: [US-027, US-016, US-025, US-020, US-013]
gaps_addressed: [12, 14]
dependencies: [phase-05]
---

# Phase 6: Integration & Polish

## Context
- US-027: Cross-module Integration (MISSING 0/4)
- US-016: Campaign ROI (PARTIAL — wrong formula)
- US-025: Pipeline/Scoring Config (PARTIAL 3/4)
- US-020: Data Quality overall score (PARTIAL — missing 0-100)
- US-013: Follow-up & Contract Management (PARTIAL)

---

## 1. Cross-module Integration (US-027)

### Deal -> PMS Project (AC1)
**Endpoint:** `POST /crm/workspaces/{wid}/deals/{did}/create-project`
Logic: On won deal, create PMS project with title from deal, link account. Return project_id.
```python
from app.modules.pms.services.project import create_project
project = await create_project(db, workspace_id, ProjectCreate(
    name=f"Project - {deal.title}",
    description=f"From CRM deal {deal.title}, value={deal.value}",
))
```

### Account -> WMS Devices (AC2)
Frontend only: Add Devices tab to account-detail that fetches `GET /wms/workspaces/{wid}/devices?account_id={aid}`.
Graceful degradation if WMS module not available.

### Sales Team from HRM (AC4)
Frontend enrichment: When showing deal owners, fetch employee data from `/hrm/employees`. No backend changes.

---

## 2. Campaign ROI Fix (Gap #12, US-016 AC3)

### Current State
`crm_analytics.py` has `total_campaign_budget` and `total_campaign_cost` but no per-campaign ROI.

### Desired Formula
```python
# Per campaign:
revenue = SUM(deals.value) WHERE deal.lead.campaign_id = campaign.id AND deal.stage = 'closed_won'
roi = ((revenue - campaign.actual_cost) / campaign.actual_cost) * 100 if actual_cost > 0 else 0
cost_per_lead = campaign.actual_cost / lead_count if lead_count > 0 else 0
```

### New Endpoint
`GET /crm/workspaces/{wid}/campaigns/{cid}/metrics`
Returns: `{revenue, roi_pct, cost_per_lead, lead_count, qualified_count, won_count, funnel}`

### Files to Modify
- `backend/app/modules/crm/services/campaign.py` — add `get_campaign_metrics()`
- `backend/app/modules/crm/routers/campaigns.py` — add metrics endpoint

---

## 3. Pipeline & Scoring Config Polish (US-025)

### Current State
PipelineStage and ScoringConfig have CRUD APIs + settings pages. Gaps:
- No drag-to-reorder stages in frontend
- Scoring threshold edit unclear

### Changes
- Frontend: Add drag-reorder to `pipeline-settings.tsx` (use position field)
- Frontend: Scoring settings — show threshold ranges (Cold: 0-25, Warm: 26-60, Hot: 61-100) matching Phase 2 thresholds
- Backend: scoring config already has API, ensure threshold values match new ranges

### Files to Modify
- `frontend/src/modules/crm/features/settings/pages/pipeline-settings.tsx` — add DnD reorder
- `frontend/src/modules/crm/features/settings/pages/scoring-settings.tsx` — show threshold ranges

---

## 4. Data Quality Overall Score (Gap #14, US-020 AC1)

### Current State
`data_quality.py` has per-entity completeness metrics but no single 0-100 score.

### Desired State
```python
# Overall score = weighted average:
# - Contact completeness 25%: contacts with email+phone+account / total contacts
# - Lead freshness 25%: non-stale leads / total active leads
# - Deal hygiene 25%: deals with expected_close_date + contact / total open deals
# - Data coverage 25%: accounts with health_score > 50 / total accounts
overall_score = int(contact_pct*25 + lead_pct*25 + deal_pct*25 + account_pct*25)
```

### Files to Modify
- `backend/app/modules/crm/services/data_quality.py` — add `get_overall_quality_score()`
- `backend/app/modules/crm/routers/analytics.py` — add quality score to response
- `frontend/src/modules/crm/features/data-quality/pages/data-quality-report.tsx` — show score gauge

---

## 5. Follow-up & Contract Enhancement (US-013)

### Contract Renewal Alert (AC3)
- `POST /crm/workspaces/{wid}/contracts/{cid}/renew` — create new contract with extended dates
- Background job: check contracts where `end_date < today + 30d`, fire CrmNotification

### Upsell (AC5)
- "Create Deal" button on account-detail that pre-fills account_id
- Frontend only

### Files to Create
- `backend/app/modules/crm/routers/cross_module.py`
- `backend/app/modules/crm/services/cross_module.py`
- `frontend/src/modules/crm/features/accounts/components/account-devices-tab.tsx`
- `frontend/src/modules/crm/features/accounts/components/account-contracts-tab.tsx`
- `frontend/src/modules/crm/features/campaigns/components/campaign-metrics.tsx`

### Files to Modify
- `backend/app/modules/crm/router.py` — include cross_module router
- `backend/app/modules/crm/services/contract.py` — add renew method
- `backend/app/modules/crm/routers/contracts.py` — add renew endpoint
- `backend/app/modules/crm/services/campaign.py` — add metrics calculation
- `backend/app/modules/crm/routers/campaigns.py` — add metrics endpoint
- `backend/app/modules/crm/services/data_quality.py` — add overall score
- `frontend/src/modules/crm/features/accounts/pages/account-detail.tsx` — Contracts + Devices tabs + upsell button
- `frontend/src/modules/crm/features/campaigns/pages/campaign-detail.tsx` — metrics section
- `frontend/src/modules/crm/features/data-quality/pages/data-quality-report.tsx` — score gauge
- `frontend/src/modules/crm/features/settings/pages/pipeline-settings.tsx` — DnD
- `frontend/src/modules/crm/features/settings/pages/scoring-settings.tsx` — thresholds

## Implementation Steps
1. Create cross_module service + router for deal->project
2. Add campaign metrics endpoint (ROI, CPL, funnel)
3. Add contract renew endpoint
4. Add overall data quality score
5. Frontend: account-devices-tab + account-contracts-tab
6. Frontend: campaign-metrics component
7. Frontend: pipeline settings DnD reorder
8. Frontend: scoring settings threshold display
9. Frontend: data quality score gauge
10. Frontend: upsell button on account-detail

## Success Criteria
- [ ] Deal -> PMS project creation works (graceful if PMS unavailable)
- [ ] Campaign ROI = (revenue - cost) / cost * 100
- [ ] Campaign metrics: ROI, CPL, funnel per campaign
- [ ] Contract renew creates new contract with extended dates
- [ ] Overall data quality score 0-100 displayed
- [ ] Pipeline stages draggable to reorder
- [ ] Scoring settings show threshold ranges
