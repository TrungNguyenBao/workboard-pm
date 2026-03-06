---
phase: 2B
title: "Training & Development"
status: pending
priority: P2
effort: 3h
depends_on: []
---

# Phase 2B — Training & Development

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Independent — no dependencies on other phases
- 2 new entities: training_programs, training_enrollments

## Overview
Training catalog with program management and employee enrollment tracking. Programs have budget, schedule, trainer info. Enrollments track status, completion, and feedback.

---

## Entity Schemas

### TrainingProgram (NEW)
```python
id: UUID PK
name: String(255)                    # Required
description: Text                    # Nullable
budget: Numeric(12,2)               # Nullable
start_date: Date                     # Nullable
end_date: Date                       # Nullable
trainer: String(255)                 # Nullable (trainer name/org)
status: String(20)                   # draft / active / completed / cancelled
workspace_id: UUID FK(workspaces.id) # Required, indexed
# + TimestampMixin
```

### TrainingEnrollment (NEW)
```python
id: UUID PK
program_id: UUID FK(training_programs.id, CASCADE) # Required, indexed
employee_id: UUID FK(employees.id, CASCADE)         # Required, indexed
status: String(20)                                  # enrolled / in_progress / completed / dropped
completion_date: Date                               # Nullable
score: Numeric(5,2)                                 # Nullable (0-100)
feedback: Text                                      # Nullable
workspace_id: UUID FK(workspaces.id)                # Required, indexed
# + TimestampMixin
# UNIQUE constraint: (program_id, employee_id)
```

---

## Backend Implementation

### 1. Models
**Create:**
- `backend/app/modules/hrm/models/training_program.py`
- `backend/app/modules/hrm/models/training_enrollment.py`
  - UniqueConstraint("program_id", "employee_id", name="uq_enrollment_program_employee")

### 2. Register models
**Modify:** `backend/app/modules/hrm/models/__init__.py`

### 3. Schemas
**Create:**
- `backend/app/modules/hrm/schemas/training_program.py`
  - Create: name, description?, budget?, start_date?, end_date?, trainer?, status?
  - Update: all optional
  - Response: all fields
- `backend/app/modules/hrm/schemas/training_enrollment.py`
  - Create: program_id, employee_id
  - Update: status?, completion_date?, score?(0-100), feedback?
  - Response: all fields

### 4. Services
**Create:**
- `backend/app/modules/hrm/services/training_program.py`
  - Standard CRUD + filter by status, search by name
- `backend/app/modules/hrm/services/training_enrollment.py`
  - Standard CRUD + filter by program_id, employee_id, status
  - `complete_enrollment(db, enrollment_id, workspace_id, score?, feedback?)` — set status=completed, completion_date=today

### 5. Routers
**Create:**
- `backend/app/modules/hrm/routers/training_programs.py`
  - CRUD at `/workspaces/{workspace_id}/training-programs`
- `backend/app/modules/hrm/routers/training_enrollments.py`
  - CRUD at `/workspaces/{workspace_id}/training-enrollments`
  - POST `/{id}/complete` (member)

### 6. Register routers
**Modify:** `backend/app/modules/hrm/router.py`

### 7. Migration
**Create:** `backend/alembic/versions/0013_add_training_tables.py`

---

## Frontend Implementation

### 8. Hooks
**Create:**
- `frontend/src/modules/hrm/features/training/hooks/use-training-programs.ts`
- `frontend/src/modules/hrm/features/training/hooks/use-training-enrollments.ts`

### 9. Components
**Create:**
- `frontend/src/modules/hrm/features/training/components/training-program-form-dialog.tsx`
  - Fields: name, description, budget, start_date, end_date, trainer, status
- `frontend/src/modules/hrm/features/training/components/enrollment-form-dialog.tsx`
  - Fields: program (select), employee (select)
- `frontend/src/modules/hrm/features/training/components/enrollment-completion-dialog.tsx`
  - Fields: score, feedback

### 10. Pages
**Create:**
- `frontend/src/modules/hrm/features/training/pages/training-list.tsx`
  - Two sections/tabs: Programs catalog + Enrollments
  - Programs: name, status, dates, budget, enrollment count
  - Enrollments: employee, program, status, score
  - Click program to see enrolled employees

### 11. Routes + Sidebar
**Modify:** `frontend/src/app/router.tsx`
- Route: `/hrm/training`

**Modify:** `frontend/src/shared/components/shell/sidebar.tsx`
- NavItem: Training (GraduationCap or BookOpen icon)

---

## Files Summary

### Create (backend: 7, frontend: 6)
- 2 models, 2 schemas, 2 services, 2 routers, 1 migration
- 2 hooks, 3 components, 1 page

### Modify
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/components/shell/sidebar.tsx`

---

## TODO
- [ ] Create TrainingProgram model
- [ ] Create TrainingEnrollment model (with unique constraint)
- [ ] Register models
- [ ] Create schemas
- [ ] Create services
- [ ] Create routers
- [ ] Register routers
- [ ] Create migration
- [ ] Create hooks
- [ ] Create form dialogs
- [ ] Create training list page
- [ ] Add route and sidebar

## Success Criteria
- Training program CRUD working
- Enrollment with unique (program_id, employee_id) enforced
- Complete enrollment action sets date + status
- Training page shows catalog and enrollments

## Risk Assessment
- Smallest sub-phase, low risk
- Unique constraint prevents double-enrollment
