# Phase 3: P1 Feature Gaps

**Priority:** P1 Medium | **Est:** ~16 SP | **Status:** ✅ Complete

---

## Context
- [Phase 2](phase-02-p0-p1-high.md) should complete first
- [Audit Report](../reports/crm-audit-260312-1144-consolidated.md)

## Tasks

### 3.1 US-026: Data Quality Report Page (~5 SP)

**Frontend:**
- [x] Create data quality report page
- [x] Quality score gauge (0-100)
- [x] Sections: Duplicates, Missing Fields, Stale Records, Ownerless Deals
- [x] Action buttons per section

### 3.2 US-025: Deal Velocity Analytics (~5 SP)

**Backend:**
- [x] Add `deal_velocity_by_stage` to analytics service
- [x] Calculate avg days per stage from deal stage timestamps
- [x] Add velocity endpoint

**Frontend:**
- [x] Deal velocity bar chart component
- [x] Bottleneck highlight (longest stage)

### 3.3 US-023: Ticket KPIs (~3 SP)

**Backend:**
- [x] Add `get_ticket_stats()` — avg resolution time, resolution rate, by priority
- [x] Add stats endpoint to tickets router

**Frontend:**
- [x] Ticket KPI cards component
- [x] Priority distribution display

### 3.4 US-027: Governance Alerts Drill-Down (~3 SP)

**Backend:**
- [x] Add `missing_deal_values` and `high_value_no_activity` counts to governance response

**Frontend:**
- [x] Make each alert category clickable — navigate to filtered list
- [x] Add missing alert categories

## Success Criteria
- Data quality page shows aggregate quality metrics with action buttons
- Deal velocity chart visualizes time spent per stage
- Ticket KPIs show resolution metrics
- Governance alerts drill down to filtered lists
