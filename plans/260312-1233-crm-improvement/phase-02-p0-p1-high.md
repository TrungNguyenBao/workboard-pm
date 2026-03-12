# Phase 2: P0 Enhancements + P1 High

**Priority:** P0/P1 High | **Est:** ~15 SP | **Status:** ✅ Complete

---

## Context
- [Phase 1](phase-01-p0-critical-gaps.md) should complete first
- [Audit Report](../reports/crm-audit-260312-1144-consolidated.md)

## Tasks

### 2.1 US-010: Auto Probability on Stage Change (~3 SP)

**Frontend:**
- [x] Auto-suggest probability when stage changes in deal form
- [x] Mapping: Qualified=10%, Needs Analysis=25%, Proposal=50%, Negotiation=75%
- [x] Allow manual override with "suggested" label

### 2.2 US-006: Stale Lead Detection Fix (~3 SP)

**Backend:**
- [x] Fix `get_stale_leads()` to use 30-day activity-based criteria
- [x] Check Activity.lead_id for most recent activity date
- [x] Fallback to contacted_at then created_at
- [x] Add disqualify endpoint with reason

**Frontend:**
- [x] Create stale leads alert widget on dashboard

### 2.3 US-020: Campaign Performance Page (~5 SP)

**Frontend:**
- [x] Create campaign detail page with KPI cards
- [x] Total leads, cost per lead, conversion rate, ROI
- [x] `useCampaignStats` hook

### 2.4 US-016: Follow-ups Due Widget (~2 SP)

**Frontend:**
- [x] Add follow-ups due widget on CRM dashboard
- [x] Show overdue accounts with red indicator

### 2.5 US-012: Stale Deals Dashboard Navigation (~2 SP)

**Frontend:**
- [x] Make stale deals alerts clickable — navigate to filtered deals list
- [x] Add new alert categories: missing deal values, high-value inactive deals

## Success Criteria
- Auto probability updates on stage change
- Stale leads detected using 30-day activity window
- Campaign detail page shows performance metrics
- Follow-ups widget visible on dashboard
- Stale deals alerts are clickable and navigate correctly
