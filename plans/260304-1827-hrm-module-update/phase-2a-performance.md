---
phase: 2A
title: "Performance Management"
status: pending
priority: P2
effort: 5h
depends_on: [1B]
---

# Phase 2A — Performance Management

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Depends on: Phase 1B (employee detail page for linking reviews)
- 4 new entities: kpi_templates, kpi_assignments, performance_reviews, review_feedback

## Overview
KPI-based performance tracking with periodic reviews and 360-degree feedback. KPI templates define measurable goals; assignments link templates to employees for a period. Reviews aggregate scores; feedback supports self/manager/peer/subordinate perspectives.

---

## Entity Schemas

### KpiTemplate (NEW)
```python
id: UUID PK
name: String(255)                    # Required
description: String(500)             # Nullable
category: String(100)                # e.g. sales, delivery, quality
measurement_unit: String(50)         # e.g. count, percentage, currency
workspace_id: UUID FK(workspaces.id) # Required, indexed
# + TimestampMixin
```

### KpiAssignment (NEW)
```python
id: UUID PK
template_id: UUID FK(kpi_templates.id)   # Required, indexed
employee_id: UUID FK(employees.id, CASCADE) # Required, indexed
period: String(7)                        # YYYY-MM or YYYY-QN
target_value: Numeric(12,2)              # Required
actual_value: Numeric(12,2)              # Nullable (filled during review)
weight: Numeric(3,2)                     # Default 1.00 (0.00-1.00)
status: String(20)                       # pending / in_progress / completed
workspace_id: UUID FK(workspaces.id)     # Required, indexed
# + TimestampMixin
```

### PerformanceReview (NEW)
```python
id: UUID PK
employee_id: UUID FK(employees.id, CASCADE) # Required, indexed
reviewer_id: UUID FK(employees.id)           # Required
period: String(7)                            # YYYY-MM or YYYY-QN
overall_score: Numeric(3,1)                  # Nullable (1.0-5.0)
status: String(20)                           # draft / submitted / approved
comments: Text                               # Nullable
workspace_id: UUID FK(workspaces.id)         # Required, indexed
# + TimestampMixin
```

### ReviewFeedback (NEW)
```python
id: UUID PK
review_id: UUID FK(performance_reviews.id, CASCADE) # Required, indexed
from_employee_id: UUID FK(employees.id)              # Required
relationship: String(20)                             # self / manager / peer / subordinate
scores: JSONB                                        # { "category": score } flexible
comments: Text                                       # Nullable
workspace_id: UUID FK(workspaces.id)                 # Required, indexed
# + TimestampMixin
```

---

## Backend Implementation

### 1. Models (4 files)
**Create:**
- `backend/app/modules/hrm/models/kpi_template.py`
- `backend/app/modules/hrm/models/kpi_assignment.py`
- `backend/app/modules/hrm/models/performance_review.py`
- `backend/app/modules/hrm/models/review_feedback.py`

### 2. Register models
**Modify:** `backend/app/modules/hrm/models/__init__.py`
- Add 4 imports

### 3. Schemas (4 files)
**Create:**
- `backend/app/modules/hrm/schemas/kpi_template.py`
  - Create/Update/Response
- `backend/app/modules/hrm/schemas/kpi_assignment.py`
  - Create: template_id, employee_id, period, target_value, weight?
  - Update: target_value?, actual_value?, weight?, status?
  - Response: all fields
- `backend/app/modules/hrm/schemas/performance_review.py`
  - Create: employee_id, reviewer_id, period
  - Update: overall_score?, status?, comments?
  - Response: all fields
- `backend/app/modules/hrm/schemas/review_feedback.py`
  - Create: review_id, from_employee_id, relationship(validated), scores, comments?
  - Response: all fields

### 4. Services (4 files)
**Create:**
- `backend/app/modules/hrm/services/kpi_template.py` — standard CRUD
- `backend/app/modules/hrm/services/kpi_assignment.py`
  - Standard CRUD + filter by employee_id, period, status
  - `complete_kpi(db, assignment_id, workspace_id, actual_value)` — set actual_value + status=completed
- `backend/app/modules/hrm/services/performance_review.py`
  - Standard CRUD + filter by employee_id, period, status
  - `submit_review(db, review_id, workspace_id)` — draft -> submitted
  - `approve_review(db, review_id, workspace_id)` — submitted -> approved
- `backend/app/modules/hrm/services/review_feedback.py`
  - CRUD + filter by review_id
  - List all feedback for a review (aggregated view)

### 5. Routers (4 files)
**Create:**
- `backend/app/modules/hrm/routers/kpi_templates.py`
  - CRUD at `/workspaces/{workspace_id}/kpi-templates`
- `backend/app/modules/hrm/routers/kpi_assignments.py`
  - CRUD at `/workspaces/{workspace_id}/kpi-assignments`
  - POST `/{id}/complete` (member)
- `backend/app/modules/hrm/routers/performance_reviews.py`
  - CRUD at `/workspaces/{workspace_id}/performance-reviews`
  - POST `/{id}/submit`, `/{id}/approve` (member/admin)
- `backend/app/modules/hrm/routers/review_feedback.py`
  - CRUD at `/workspaces/{workspace_id}/review-feedback`

### 6. Register routers
**Modify:** `backend/app/modules/hrm/router.py`

### 7. Migration
**Create:** `backend/alembic/versions/0012_add_performance_management_tables.py`

---

## Frontend Implementation

### 8. Hooks (4 files)
**Create:**
- `frontend/src/modules/hrm/features/performance/hooks/use-kpi-templates.ts`
- `frontend/src/modules/hrm/features/performance/hooks/use-kpi-assignments.ts`
- `frontend/src/modules/hrm/features/performance/hooks/use-performance-reviews.ts`
- `frontend/src/modules/hrm/features/performance/hooks/use-review-feedback.ts`

### 9. Components
**Create:**
- `frontend/src/modules/hrm/features/performance/components/kpi-template-form-dialog.tsx`
  - Fields: name, description, category, measurement_unit
- `frontend/src/modules/hrm/features/performance/components/kpi-assignment-form-dialog.tsx`
  - Fields: template (select), employee (select), period, target_value, weight
- `frontend/src/modules/hrm/features/performance/components/review-form-dialog.tsx`
  - Fields: employee (select), reviewer (select), period, overall_score (slider/select), comments
- `frontend/src/modules/hrm/features/performance/components/feedback-form-dialog.tsx`
  - Fields: relationship (select), scores (dynamic per-category inputs), comments
- `frontend/src/modules/hrm/features/performance/components/kpi-progress-bar.tsx`
  - Visual: actual_value / target_value as progress bar with percentage

### 10. Pages
**Create:**
- `frontend/src/modules/hrm/features/performance/pages/kpi-dashboard.tsx`
  - KPI templates list + assignment table per employee/period
  - Filter by period, employee
  - Progress bars for each assignment
- `frontend/src/modules/hrm/features/performance/pages/reviews-list.tsx`
  - Table: employee, reviewer, period, score, status
  - Click to view review detail with feedback

### 11. Routes + Sidebar
**Modify:** `frontend/src/app/router.tsx`
- Routes: `/hrm/performance`, `/hrm/performance/reviews`

**Modify:** `frontend/src/shared/components/shell/sidebar.tsx`
- Add NavItem: Performance (BarChart or Target icon)

---

## Files Summary

### Create (backend: 13, frontend: 11)
- 4 models, 4 schemas, 4 services, 4 routers, 1 migration
- 4 hooks, 5 components, 2 pages

### Modify
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/components/shell/sidebar.tsx`

---

## TODO
- [ ] Create 4 models
- [ ] Register models
- [ ] Create 4 schemas with validation
- [ ] Create 4 services with action endpoints
- [ ] Create 4 routers
- [ ] Register routers
- [ ] Create migration
- [ ] Create 4 hooks
- [ ] Create 5 components
- [ ] Create KPI dashboard page
- [ ] Create reviews list page
- [ ] Add routes and sidebar

## Success Criteria
- KPI templates CRUD working
- KPI assignments tracked per employee/period with actual vs target
- Performance reviews with submit/approve workflow
- 360 feedback collection from multiple relationship types
- KPI dashboard shows progress bars

## Risk Assessment
- scores JSONB is flexible but lacks schema validation — validate keys in service
- Review approval workflow simple (draft -> submitted -> approved); no rejection flow needed initially
