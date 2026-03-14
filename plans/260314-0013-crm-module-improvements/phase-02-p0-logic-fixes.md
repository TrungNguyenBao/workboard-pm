---
phase: 2
title: "P0 Logic Fixes — Scoring, RBAC, Health Score, Deal Reopen, Stale, Revenue"
sprint: Sprint 2
priority: P0
effort: 8h
status: pending
user_stories: [US-002, US-024, US-012, US-008, US-009, US-014, US-011, US-017]
gaps_addressed: [1, 2, 3, 4, 5, 6, 11, 13]
dependencies: [phase-01]
---

# Phase 2: P0 Logic Fixes

## Context
These are logic refactors to EXISTING code. The gap analysis identified fundamental mismatches between doc requirements and current implementation.

---

## Fix 1: Lead Scoring Refactor (Gap #1, US-002)

### Current State (`lead_workflows.py` L57-70)
```python
# STATIC scoring: source quality + data completeness
def calculate_lead_score(lead: Lead) -> int:
    score = 0
    source_scores = {"website": 15, "ads": 10, "form": 20, "referral": 25, "manual": 5}
    score += source_scores.get(lead.source, 5)
    if lead.email: score += 20
    if lead.phone: score += 15
    # ... total = source + completeness
```

### Desired State
**Dual scoring**: base score (source+completeness, on creation) + interaction score (accumulated on activities).

The interaction scoring already exists in `activity.py` L29-35:
```python
activity_score_map = {
    "email_open": 5, "click": 10, "form_submit": 15, "call": 15,
    "demo": 20, "follow_up": 5, "meeting": 20, "note": 2,
}
lead.score = min((lead.score or 0) + points, 100)
```

### What Needs to Change
1. **Rename** `calculate_lead_score` to `calculate_initial_lead_score` (clarity)
2. **Add** `calculate_interaction_score(db, lead_id)` -- query all activities for lead, sum points. Used for score breakdown display.
3. **Add** `recalculate_lead_score(db, lead)` -- `initial + interaction`, capped at 100. Called when admin requests full recalc.
4. **Update** `get_score_level()` thresholds per doc: cold <=25, warm 26-60, hot >60
5. **Ensure** score level badge (`cold/warm/hot`) updates on activity creation (already happens via score update)
6. **US-002 AC6**: Add 24h uncontacted alert -- in `governance.py`, add check for leads assigned >24h ago with `contacted_at IS NULL`. Fire CrmNotification.

### Files to Modify
- `backend/app/modules/crm/services/lead_workflows.py` — rename + add recalculate + threshold fix
- `backend/app/modules/crm/services/governance.py` — add uncontacted lead alert

---

## Fix 2: RBAC Expansion (Gap #2, US-024)

### Current State
3 workspace roles: `admin`, `member`, `guest`. No CRM entity-level permissions.

### Desired State
5 CRM roles with entity-level permission matrix:

| CRM Role | Map to | Can Access |
|----------|--------|------------|
| Admin | workspace admin | Everything |
| Sales Manager | workspace member | All CRM entities, forecasts |
| Sales | workspace member | Own leads, deals, activities, quotes |
| Marketing | workspace member | Campaigns, read-only leads/reports |
| Support | workspace member | Tickets, read-only contacts/accounts |

### Implementation Approach
1. **Add** `crm_role` column to `WorkspaceMembership` model (or new `CrmRoleAssignment` table). Simpler: add `crm_role: str(20), default="sales"` to WorkspaceMembership.
2. **Create** `backend/app/modules/crm/dependencies/crm_rbac.py`:
   ```python
   CRM_PERMISSIONS = {
       "admin": {"lead", "deal", "contact", "account", "activity", "campaign", "ticket", "forecast", "settings"},
       "sales_manager": {"lead", "deal", "contact", "account", "activity", "campaign", "ticket", "forecast"},
       "sales": {"lead", "deal", "contact", "account", "activity"},
       "marketing": {"campaign", "lead:read", "report:read"},
       "support": {"ticket", "contact:read", "account:read"},
   }

   def require_crm_permission(entity: str, action: str = "write"):
       # Depends on current_user + workspace membership
       # Check crm_role in CRM_PERMISSIONS
   ```
3. **Replace** `require_workspace_role("member")` in CRM routers with `require_crm_permission("deal")` etc.
4. **US-024 AC5**: Marketing blocked from deals -- enforced by permission matrix above.

### Files to Create
- `backend/app/modules/crm/dependencies/crm_rbac.py`

### Files to Modify
- `backend/app/models/workspace.py` — add `crm_role` column to WorkspaceMembership
- All CRM routers — swap `require_workspace_role` for `require_crm_permission`
- Migration: alter `workspace_memberships` add `crm_role VARCHAR(20) DEFAULT 'sales'`

---

## Fix 3: Health Score Weighted Formula (Gap #3, US-012)

### Current State (`account.py` L112-146)
```python
score = 100
score -= min(open_tickets * 10, 30)   # penalty-based
if recent_activities == 0: score -= 30
if account.total_revenue > 10000: score += 10
```

### Desired State (weighted 0-100)
```python
# Revenue 30%: min(total_revenue / revenue_target, 1.0) * 30
# Activity recency 30%: based on days since last activity
#   0-7d = 30, 8-30d = 20, 31-60d = 10, 60d+ = 0
# Ticket health 20%: (1 - open_tickets/max(total_tickets, 1)) * 20
# Pipeline 20%: min(active_deal_count, 3) / 3 * 20
```

`revenue_target` default = 50,000,000 VND (configurable per workspace later).

### Files to Modify
- `backend/app/modules/crm/services/account.py` — rewrite `calculate_health_score()`

---

## Fix 4: Deal Reopen Endpoint (Gap #4, US-008 AC6)

### Current State
`close_deal()` in `deal_workflows.py` L57-58 blocks closed deals:
```python
if deal.stage in ("closed_won", "closed_lost"):
    raise HTTPException(400, "Deal is already closed")
```

### Desired State
New endpoint: `POST /crm/workspaces/{wid}/deals/{did}/reopen`
- Validates deal is `closed_won` or `closed_lost`
- Sets stage back to `negotiation` (or configurable target stage)
- Clears `closed_at`, `loss_reason`
- Resets probability to stage default
- Logs reopen as activity

### Files to Modify
- `backend/app/modules/crm/services/deal_workflows.py` — add `reopen_deal()` function
- `backend/app/modules/crm/routers/workflows.py` — add reopen endpoint

---

## Fix 5: Stale Thresholds (Gap #6, US-009)

### Current State
`deal_workflows.py` `get_stale_deals(days=30)` — single threshold for all.
`lead_workflows.py` `get_stale_leads(days=30)` — single threshold.

### Desired State
- Deals: 60d general, 30d for high-value (value > 500,000,000 VND)
- Leads: keep 30d (matches doc)

### Implementation
```python
async def get_stale_deals(db, workspace_id, general_days=60, high_value_days=30, high_value_threshold=500_000_000):
    general_cutoff = now - timedelta(days=general_days)
    high_value_cutoff = now - timedelta(days=high_value_days)
    # WHERE (value >= threshold AND last_activity < high_value_cutoff)
    #    OR (value < threshold AND last_activity < general_cutoff)
```

### Files to Modify
- `backend/app/modules/crm/services/deal_workflows.py` — refactor `get_stale_deals()`

---

## Fix 6: Revenue Auto-aggregate (Gap #11, US-011 AC3)

### Current State
`account.total_revenue` is set once on deal close won (`deal_workflows.py` L68: `total_revenue=deal.value`). Not aggregated from all won deals.

### Desired State
Add helper `recalculate_account_revenue(db, account_id)` that does:
```python
total = SELECT SUM(value) FROM deals WHERE account_id=X AND stage='closed_won'
account.total_revenue = total or 0
```
Call on: deal close won, deal reopen, deal delete.

### Files to Modify
- `backend/app/modules/crm/services/account.py` — add `recalculate_account_revenue()`
- `backend/app/modules/crm/services/deal_workflows.py` — call after close/reopen

---

## Fix 7: Ticket Reopen Count (Gap #13, US-017 AC3)

### Current State
Ticket model has status transitions including reopen, but no `reopen_count` field.

### Desired State
- Add `reopen_count: int, default=0` to Ticket model
- Add `resolved_at: datetime(tz), nullable` to Ticket model
- On status transition to "open" from "resolved"/"closed": increment `reopen_count`
- On status transition to "resolved": set `resolved_at = now`

### Files to Modify
- `backend/app/modules/crm/models/ticket.py` — add 2 columns
- `backend/app/modules/crm/services/ticket.py` — add side effects on status change

---

## Migration
`alembic revision -m "crm_rbac_ticket_reopen_count"`
- ALTER workspace_memberships ADD crm_role VARCHAR(20) DEFAULT 'sales'
- ALTER tickets ADD reopen_count INT DEFAULT 0, resolved_at TIMESTAMP

## Implementation Steps
1. Add `crm_role` column to WorkspaceMembership + create `crm_rbac.py` dependency
2. Refactor `calculate_lead_score` -> `calculate_initial_lead_score`, add `recalculate_lead_score`
3. Fix `get_score_level` thresholds (cold<=25, warm 26-60, hot>60)
4. Add uncontacted lead alert to governance service
5. Rewrite `calculate_health_score()` with weighted formula
6. Add `reopen_deal()` to deal_workflows + endpoint in workflows router
7. Refactor `get_stale_deals()` with dual thresholds
8. Add `recalculate_account_revenue()` helper
9. Add `reopen_count` + `resolved_at` to Ticket model + service side effects
10. Swap all CRM routers from `require_workspace_role` to `require_crm_permission`
11. Generate migration
12. Integrate CrmNotification triggers: lead assignment, deal stage change, 24h uncontacted

## Success Criteria
- [ ] Lead score = initial (source+completeness) + interaction (activity-based), cap 100
- [ ] Score levels: cold<=25, warm 26-60, hot>60
- [ ] 5 CRM roles enforced: Marketing cannot access deals, Support cannot access campaigns
- [ ] Health score = revenue 30% + recency 30% + ticket 20% + pipeline 20%
- [ ] Deal reopen endpoint works, clears closed_at/loss_reason, logs activity
- [ ] Stale deals: 60d general, 30d for >500M VND
- [ ] Account total_revenue = SUM(won deals)
- [ ] Ticket reopen_count increments on reopen, resolved_at set on resolve
- [ ] CrmNotification created on lead assign + deal stage change + 24h uncontacted
