---
phase: 1C
title: "Recruitment Pipeline"
status: pending
priority: P1
effort: 8h
depends_on: [1A, 1B]
---

# Phase 1C — Recruitment Pipeline

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Depends on: Phase 1A (positions table), Phase 1B (employee detail page)
- 5 new entities: recruitment_requests, candidates, interviews, offers, onboarding_checklists

## Overview
Full recruitment lifecycle: create request -> add candidates -> schedule interviews -> make offers -> onboard hired employees. Linear candidate pipeline: applied -> screening -> interviewing -> offered -> hired/rejected.

---

## Entity Schemas

### RecruitmentRequest (NEW)
```python
id: UUID PK
position_id: UUID FK(positions.id)       # Nullable
department_id: UUID FK(departments.id)    # Required, indexed
title: String(255)                        # Job title
quantity: Integer                         # Default 1
reason: String(500)                       # Required
requirements: Text                        # Nullable
deadline: Date                            # Nullable
status: String(20)                        # draft / open / closed / cancelled
requester_id: UUID FK(users.id)           # Required
workspace_id: UUID FK(workspaces.id)      # Required, indexed
# + TimestampMixin
```

### Candidate (NEW)
```python
id: UUID PK
recruitment_request_id: UUID FK(recruitment_requests.id)  # Required, indexed
name: String(255)                         # Required
email: String(255)                        # Required
phone: String(50)                         # Nullable
resume_url: String(500)                   # Nullable
status: String(20)                        # applied/screening/interviewing/offered/hired/rejected
notes: Text                               # Nullable
workspace_id: UUID FK(workspaces.id)      # Required, indexed
# + TimestampMixin
```

### Interview (NEW)
```python
id: UUID PK
candidate_id: UUID FK(candidates.id, CASCADE)  # Required, indexed
interviewer_id: UUID FK(employees.id)           # Required
scheduled_at: DateTime                          # Required
duration_minutes: Integer                       # Default 60
feedback: Text                                  # Nullable (filled after)
score: Integer                                  # Nullable (1-5)
status: String(20)                              # scheduled / completed / cancelled
workspace_id: UUID FK(workspaces.id)            # Required, indexed
# + TimestampMixin
```

### Offer (NEW)
```python
id: UUID PK
candidate_id: UUID FK(candidates.id)    # Required, indexed
position_title: String(255)             # Required
offered_salary: Numeric(12,2)           # Required
start_date: Date                        # Required
expiry_date: Date                       # Nullable
status: String(20)                      # draft/sent/accepted/rejected/expired
notes: Text                             # Nullable
workspace_id: UUID FK(workspaces.id)    # Required, indexed
# + TimestampMixin
```

### OnboardingChecklist (NEW)
```python
id: UUID PK
employee_id: UUID FK(employees.id, CASCADE)  # Required, indexed
task_name: String(255)                       # Required
category: String(100)                        # e.g. IT setup, HR docs, training
assigned_to_id: UUID FK(employees.id)        # Nullable
due_date: Date                               # Nullable
is_completed: Boolean                        # Default False
completed_at: DateTime                       # Nullable
workspace_id: UUID FK(workspaces.id)         # Required, indexed
# + TimestampMixin
```

---

## Backend Implementation

### 1. Models (5 files)
**Create:**
- `backend/app/modules/hrm/models/recruitment_request.py`
- `backend/app/modules/hrm/models/candidate.py`
- `backend/app/modules/hrm/models/interview.py`
- `backend/app/modules/hrm/models/offer.py`
- `backend/app/modules/hrm/models/onboarding_checklist.py`

Each follows standard pattern: Base + TimestampMixin, UUID PK, relationships.

### 2. Register models
**Modify:** `backend/app/modules/hrm/models/__init__.py`
- Add 5 imports

### 3. Schemas (5 files)
**Create:**
- `backend/app/modules/hrm/schemas/recruitment_request.py`
  - Create/Update/Response + status validation
- `backend/app/modules/hrm/schemas/candidate.py`
  - Create/Update/Response + pipeline status enum
- `backend/app/modules/hrm/schemas/interview.py`
  - Create/Update/Response + score validation (1-5)
- `backend/app/modules/hrm/schemas/offer.py`
  - Create/Update/Response + status enum
- `backend/app/modules/hrm/schemas/onboarding_checklist.py`
  - Create/Update/Response

### 4. Services (5 files)
**Create:**
- `backend/app/modules/hrm/services/recruitment_request.py`
  - Standard CRUD + list with department_id/status filter
- `backend/app/modules/hrm/services/candidate.py`
  - Standard CRUD + filter by recruitment_request_id, status
  - `update_candidate_status(db, candidate_id, workspace_id, new_status)` — pipeline progression
- `backend/app/modules/hrm/services/interview.py`
  - Standard CRUD + filter by candidate_id
  - `complete_interview(db, interview_id, workspace_id, feedback, score)` — action endpoint
- `backend/app/modules/hrm/services/offer.py`
  - Standard CRUD + filter by candidate_id
  - `send_offer(db, offer_id, workspace_id)` — draft -> sent
  - `accept_offer(db, offer_id, workspace_id)` — sent -> accepted
  - `reject_offer(db, offer_id, workspace_id)` — sent -> rejected
- `backend/app/modules/hrm/services/onboarding_checklist.py`
  - Standard CRUD + filter by employee_id
  - `generate_default_checklist(db, workspace_id, employee_id)` — hardcoded defaults:
    - IT setup: email account, laptop, software access
    - HR docs: employment contract, NDA, tax form
    - Training: orientation, safety training

### 5. Routers (5 files)
**Create:**
- `backend/app/modules/hrm/routers/recruitment_requests.py`
  - CRUD at `/workspaces/{workspace_id}/recruitment-requests`
- `backend/app/modules/hrm/routers/candidates.py`
  - CRUD at `/workspaces/{workspace_id}/candidates`
  - POST `/{candidate_id}/update-status` — pipeline status update
- `backend/app/modules/hrm/routers/interviews.py`
  - CRUD at `/workspaces/{workspace_id}/interviews`
  - POST `/{interview_id}/complete` — complete with feedback
- `backend/app/modules/hrm/routers/offers.py`
  - CRUD at `/workspaces/{workspace_id}/offers`
  - POST `/{offer_id}/send`, `/{offer_id}/accept`, `/{offer_id}/reject`
- `backend/app/modules/hrm/routers/onboarding_checklists.py`
  - CRUD at `/workspaces/{workspace_id}/onboarding-checklists`
  - POST `/generate/{employee_id}` — generate defaults

### 6. Register routers
**Modify:** `backend/app/modules/hrm/router.py`
- Add 5 router includes

### 7. Migration
**Create:** `backend/alembic/versions/0010_add_recruitment_pipeline_tables.py`
- Create 5 tables with all indexes and FKs

---

## Frontend Implementation

### 8. Hooks (5 files)
**Create:**
- `frontend/src/modules/hrm/features/recruitment/hooks/use-recruitment-requests.ts`
- `frontend/src/modules/hrm/features/recruitment/hooks/use-candidates.ts`
- `frontend/src/modules/hrm/features/recruitment/hooks/use-interviews.ts`
- `frontend/src/modules/hrm/features/recruitment/hooks/use-offers.ts`
- `frontend/src/modules/hrm/features/onboarding/hooks/use-onboarding.ts`

Each follows existing pattern: interface + useQuery + useMutation hooks.

### 9. Components
**Create:**
- `frontend/src/modules/hrm/features/recruitment/components/recruitment-request-form-dialog.tsx`
  - Fields: title, department (select), position (select from 1A), quantity, reason, requirements, deadline
- `frontend/src/modules/hrm/features/recruitment/components/candidate-form-dialog.tsx`
  - Fields: name, email, phone, resume_url, notes
- `frontend/src/modules/hrm/features/recruitment/components/candidate-status-badge.tsx`
  - Color-coded badge per pipeline status
- `frontend/src/modules/hrm/features/recruitment/components/interview-form-dialog.tsx`
  - Fields: interviewer (employee select), scheduled_at (datetime), duration_minutes
- `frontend/src/modules/hrm/features/recruitment/components/interview-feedback-dialog.tsx`
  - Fields: feedback (textarea), score (1-5 select/stars)
- `frontend/src/modules/hrm/features/recruitment/components/offer-form-dialog.tsx`
  - Fields: position_title, offered_salary, start_date, expiry_date, notes
- `frontend/src/modules/hrm/features/onboarding/components/onboarding-checklist-item.tsx`
  - Checkbox + task_name + category + assigned_to + due_date

### 10. Pages
**Create:**
- `frontend/src/modules/hrm/features/recruitment/pages/recruitment-list.tsx`
  - Table: title, department, quantity, status, deadline
  - Click to view candidates
- `frontend/src/modules/hrm/features/recruitment/pages/recruitment-detail.tsx`
  - Shows request info + candidates list + their pipeline status
  - Inline actions: schedule interview, make offer
- `frontend/src/modules/hrm/features/onboarding/pages/onboarding-list.tsx`
  - Group by employee, show checklist items with completion status

### 11. Routes + Sidebar
**Modify:** `frontend/src/app/router.tsx`
- Add lazy imports for recruitment and onboarding pages
- Routes: `/hrm/recruitment`, `/hrm/recruitment/:requestId`, `/hrm/onboarding`

**Modify:** `frontend/src/shared/components/shell/sidebar.tsx`
- Add NavItems: Recruitment (UserPlus icon), Onboarding (ClipboardCheck icon)

---

## Files Summary

### Create (backend: 16 files, frontend: 13 files)
**Backend:**
- 5 model files
- 5 schema files
- 5 service files
- 5 router files
- 1 migration

**Frontend:**
- 5 hook files
- 7 component files
- 3 page files

### Modify
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/components/shell/sidebar.tsx`

---

## TODO
- [ ] Create 5 models (recruitment_request, candidate, interview, offer, onboarding_checklist)
- [ ] Register all models
- [ ] Create 5 schemas
- [ ] Create 5 services with action endpoints
- [ ] Create 5 routers
- [ ] Register all routers
- [ ] Create migration
- [ ] Create 5 frontend hooks
- [ ] Create 7 frontend components
- [ ] Create 3 frontend pages
- [ ] Add routes and sidebar navigation

## Success Criteria
- Full recruitment lifecycle works: request -> candidates -> interviews -> offers
- Candidate pipeline status updates correctly
- Offer accept/reject/send actions work
- Onboarding checklist auto-generates defaults for new employee
- All pages accessible via sidebar

## Risk Assessment
- Largest sub-phase (5 entities); break into smaller commits per entity
- Candidate status pipeline is one-way (no backward movement) — validate transitions
- Interview scheduling stores datetime only (no external calendar integration)
