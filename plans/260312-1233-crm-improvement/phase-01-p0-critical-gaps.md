# Phase 1: P0 Critical Gaps

**Priority:** P0 Critical | **Est:** ~31 SP | **Status:** ✅ Complete

---

## Context
- [Audit Report](../reports/crm-audit-260312-1144-consolidated.md)
- [Improvement Plan](../reports/crm-improvement-plan-260312-1144.md)

## Tasks

### 1.1 US-003: Activity-Based Lead Scoring Fix (~5 SP)

**Backend:**
- [x] Add activity-based scoring in `services/activity.py` `create_activity()`
- [x] Scoring rules: email_open +5, click +10, form_submit +15, call +15, demo +20, follow_up +5, meeting +20, note +2
- [x] Cap at 100
- [x] Add `get_score_level()` helper: Cold (0-30), Warm (30-60), Hot (60+)

**Frontend:**
- [x] Add score level badge (Cold/Warm/Hot) on leads list

### 1.2 US-002: Lead Duplicate Detection Fix (~5 SP)

**Backend:**
- [x] Fix `check_lead_duplicates()` to use `func.lower()` for case-insensitive match
- [x] Add merge leads endpoint (`POST /leads/merge`)
- [x] Return duplicates in create response body

**Frontend:**
- [x] Create `lead-duplicate-modal.tsx` — side-by-side comparison
- [x] Actions: Merge, Create Anyway, Cancel

### 1.3 US-005: Lead-to-Deal Conversion (~5 SP)

**Backend:**
- [x] Auto-create Contact from lead info if not exists
- [x] Accept deal title, value, expected_close_date from request body

**Frontend:**
- [x] Replace confirm dialog with conversion form (title, value, close date, auto-create contact)

### 1.4 US-009: Pipeline Kanban Drag-Drop (~8 SP)

**Frontend:**
- [x] Integrate `@dnd-kit/core` + `@dnd-kit/sortable`
- [x] On drop: call PATCH /deals/{id} with new stage
- [x] Column headers: deal count + total value + weighted value
- [x] Owner filter dropdown

### 1.5 US-028: CRM RBAC Audit (~8 SP)

**Backend:**
- [x] Audit all router endpoints for correct RBAC (reads: guest, creates/updates: member, deletes: admin)
- [x] Add `assigned_to` filter on activities list

**Frontend:**
- [x] Add "My Leads" toggle using `owner_id` filter

## Success Criteria
- Lead scoring updates on activity creation
- Duplicate detection shows comparison modal
- Conversion form accepts deal parameters
- Pipeline supports drag-drop between stages
- RBAC consistently enforced across all endpoints
