---
phase: 7
title: "Frontend Polish — BANT, My Leads, Contact Detail, Bulk Actions, Revenue Chart"
sprint: Sprint 7
priority: P1/P2
effort: 8h
status: pending
user_stories: [US-003, US-004, US-010, US-012, US-009, US-014]
gaps_addressed: [7, 8, 9, 10]
dependencies: [phase-06]
---

# Phase 7: Frontend Polish

## Context
These are UI-level gaps in existing pages. Backend support mostly exists already; these need frontend components and minor backend additions.

---

## 1. BANT Checklist (Gap #7, US-003 AC1)

### Current State
Lead qualification = status transition to "qualified". No structured checklist.

### Desired State
Lead detail page shows BANT checklist:
- **B**udget: Does the lead have budget? (checkbox + notes)
- **A**uthority: Is this person a decision maker? (checkbox + notes)
- **N**eed: Does the lead have a clear need? (checkbox + notes)
- **T**imeline: Is there a defined timeline? (checkbox + notes)

### Implementation
Store BANT data in lead's `custom_field_values` JSONB (from Phase 4) under reserved keys:
```json
{
  "_bant_budget": {"checked": true, "notes": "Approved 500M"},
  "_bant_authority": {"checked": true, "notes": "CTO"},
  "_bant_need": {"checked": false, "notes": ""},
  "_bant_timeline": {"checked": true, "notes": "Q2 2026"}
}
```

**Backend:** Add `PATCH /crm/workspaces/{wid}/leads/{lid}/bant` endpoint that updates BANT keys in custom_field_values.
**Frontend:** BANT checklist component on lead detail.

### Files to Create
- `frontend/src/modules/crm/features/leads/components/lead-bant-checklist.tsx`

### Files to Modify
- `backend/app/modules/crm/routers/leads.py` — add BANT endpoint
- `backend/app/modules/crm/services/lead.py` — add `update_lead_bant()` helper

---

## 2. My Leads Toggle (Gap #9, US-004 AC4)

### Current State
`list_leads()` accepts `owner_id` filter. No dedicated UI toggle.

### Desired State
Leads list page has a "My Leads" toggle button that filters by current user's ID.

### Implementation
Frontend only — pass `owner_id=currentUserId` to API when toggle is on.

### Files to Modify
- `frontend/src/modules/crm/features/leads/pages/leads-list.tsx` — add toggle button + filter param

---

## 3. Contact Detail Page (Gap #10, US-010 AC5)

### Current State
Contact list exists but no dedicated detail page with linked entities.

### Desired State
Contact detail page with tabs:
- **Overview**: contact info, account link
- **Deals**: deals where contact_id = this contact (or via DealContactRole)
- **Activities**: activities linked to this contact
- **Emails**: EmailLog entries for this contact (Phase 4)
- **Tickets**: tickets for this contact's account

### Backend
`GET /crm/workspaces/{wid}/contacts/{cid}/360` — returns:
```json
{
  "contact": {...},
  "deals": [...],
  "activities": [...],
  "emails": [...],
  "tickets": [...]
}
```

### Files to Create
- `frontend/src/modules/crm/features/contacts/pages/contact-detail.tsx`
- `frontend/src/modules/crm/features/contacts/hooks/use-contact-detail.ts`
- `frontend/src/modules/crm/features/contacts/components/contact-deals-tab.tsx`
- `frontend/src/modules/crm/features/contacts/components/contact-emails-tab.tsx`
- `backend/app/modules/crm/services/contact_360.py`

### Files to Modify
- `backend/app/modules/crm/routers/contacts.py` — add 360 endpoint
- `frontend/src/app/router.tsx` — add `/crm/contacts/:contactId` route

---

## 4. Bulk Disqualify (Gap #8, US-003 AC6)

### Current State
Single disqualify via lead status update. No bulk action.

### Desired State
`POST /crm/workspaces/{wid}/leads/bulk-disqualify`
Body: `{"lead_ids": [uuid1, uuid2, ...], "reason": "..."}`
Updates all specified leads to status "disqualified".

### Frontend
Leads list: checkbox selection + "Bulk Disqualify" button (appears when >0 selected).

### Files to Modify
- `backend/app/modules/crm/services/lead.py` — add `bulk_disqualify_leads()`
- `backend/app/modules/crm/routers/leads.py` — add bulk endpoint
- `frontend/src/modules/crm/features/leads/pages/leads-list.tsx` — add checkboxes + bulk action bar

---

## 5. Account Revenue Chart (US-012 AC1, AC3)

### Current State
Account 360 view shows contacts/deals/activities/tickets. No revenue chart, no contracts tab (added in Phase 6).

### Desired State
- Revenue breakdown chart: monthly revenue from won deals (bar chart, last 12 months)
- MRR section (if contracts with billing_period exist): `SUM(contract.value / billing_months)`

### Backend
Enhance account 360 endpoint (from Phase 2 health score) to include `revenue_by_month` data.

### Files to Create
- `frontend/src/modules/crm/features/accounts/components/account-revenue-chart.tsx`

### Files to Modify
- `backend/app/modules/crm/services/account.py` — add revenue_by_month to 360 response
- `frontend/src/modules/crm/features/accounts/pages/account-detail.tsx` — add revenue chart

---

## 6. Deal Detail Page Enhancement (US-006 AC6, US-009 AC4)

### Deal Detail Tabs
Consolidate from Phase 1+3+4: Overview, Contacts/Roles, Competitors, Quotations, Activities, Attachments.

### Pipeline Filter Enhancement (US-006 AC6)
Add filters to deals-pipeline: owner, value range, expected close date range.

### Probability Override Flag (US-009 AC4)
When user manually sets probability different from stage default, show "(manual)" badge.
Add `probability_manual: bool, default=False` to Deal model (Phase 2 migration or here).

### Files to Create
- `frontend/src/modules/crm/features/deals/pages/deal-detail.tsx`
- `frontend/src/modules/crm/features/deals/hooks/use-deal-detail.ts`

### Files to Modify
- `frontend/src/modules/crm/features/deals/pages/deals-pipeline.tsx` — add filters
- `frontend/src/modules/crm/features/deals/components/deal-form-dialog.tsx` — manual probability badge
- `backend/app/modules/crm/models/deal.py` — add `probability_manual` bool (if not in Phase 2)
- `frontend/src/app/router.tsx` — add `/crm/deals/:dealId` route

---

## 7. Activity Governance (US-014 AC5)

### Desired State
When deal stage changes without a recent activity (within 7d), show warning in UI.
Backend check: `last_activity_date < now - 7d` when stage change requested.

### Implementation
Add validation in `deal_workflows.validate_stage_change()` or deal update service.
Return warning (not blocking): `{"warning": "No activity in last 7 days"}` in response.

### Files to Modify
- `backend/app/modules/crm/services/deal.py` — add activity recency check on stage change

---

## Migration
`alembic revision -m "add_deal_probability_manual"` (if not already in Phase 2)
- ALTER deals ADD probability_manual BOOLEAN DEFAULT FALSE

## Implementation Steps
1. Backend: BANT endpoint + contact 360 + bulk disqualify + activity governance warning
2. Backend: revenue_by_month in account 360 + deal probability_manual
3. Frontend: BANT checklist on lead detail
4. Frontend: My Leads toggle on leads-list
5. Frontend: contact detail page with 5 tabs
6. Frontend: bulk disqualify UI (checkboxes + action bar)
7. Frontend: account revenue chart
8. Frontend: deal detail page with all tabs consolidated
9. Frontend: pipeline filters (owner, value range, close date)
10. Frontend: probability manual badge

## Success Criteria
- [ ] BANT checklist on lead detail page, persisted to JSONB
- [ ] My Leads toggle filters by current user
- [ ] Contact detail shows linked deals/activities/emails/tickets
- [ ] Bulk disqualify works for multiple selected leads
- [ ] Account revenue chart shows monthly breakdown
- [ ] Deal detail page consolidates all tabs
- [ ] Pipeline filters: owner, value range, close date
- [ ] Stage change without recent activity shows warning
