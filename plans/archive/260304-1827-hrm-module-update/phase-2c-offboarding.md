---
phase: 2C
title: "Offboarding"
status: pending
priority: P2
effort: 4h
depends_on: [1B]
---

# Phase 2C — Offboarding

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Depends on: Phase 1B (employee records)
- 3 new entities: resignations, handover_tasks, exit_interviews

## Overview
Employee offboarding lifecycle: resignation submission -> handover task tracking -> exit interview. Simple status-based workflow without complex approval chains.

---

## Entity Schemas

### Resignation (NEW)
```python
id: UUID PK
employee_id: UUID FK(employees.id, CASCADE) # Required, indexed
resignation_date: Date                      # Required (date submitted)
last_working_day: Date                      # Required
reason: String(500)                         # Required
status: String(20)                          # submitted / approved / rejected / completed
approved_by_id: UUID FK(users.id)           # Nullable
workspace_id: UUID FK(workspaces.id)        # Required, indexed
# + TimestampMixin
```

### HandoverTask (NEW)
```python
id: UUID PK
resignation_id: UUID FK(resignations.id, CASCADE)  # Required, indexed
task_name: String(255)                              # Required
description: String(500)                            # Nullable
from_employee_id: UUID FK(employees.id)             # Required (departing)
to_employee_id: UUID FK(employees.id)               # Nullable (receiving)
status: String(20)                                  # pending / in_progress / completed
due_date: Date                                      # Nullable
workspace_id: UUID FK(workspaces.id)                # Required, indexed
# + TimestampMixin
```

### ExitInterview (NEW)
```python
id: UUID PK
resignation_id: UUID FK(resignations.id, CASCADE) # Required, indexed
interviewer_id: UUID FK(employees.id)              # Required
feedback: JSONB                                    # Structured: { overall_satisfaction, reason_leaving, suggestions, would_recommend }
conducted_at: DateTime                             # Nullable
workspace_id: UUID FK(workspaces.id)               # Required, indexed
# + TimestampMixin
```

---

## Backend Implementation

### 1. Models
**Create:**
- `backend/app/modules/hrm/models/resignation.py`
- `backend/app/modules/hrm/models/handover_task.py`
- `backend/app/modules/hrm/models/exit_interview.py`

### 2. Register models
**Modify:** `backend/app/modules/hrm/models/__init__.py`

### 3. Schemas
**Create:**
- `backend/app/modules/hrm/schemas/resignation.py`
  - Create: employee_id, resignation_date, last_working_day, reason
  - Update: last_working_day?, reason?, status?
  - Response: all fields
- `backend/app/modules/hrm/schemas/handover_task.py`
  - Create: resignation_id, task_name, description?, from_employee_id, to_employee_id?, due_date?
  - Update: task_name?, to_employee_id?, status?, due_date?
  - Response: all fields
- `backend/app/modules/hrm/schemas/exit_interview.py`
  - Create: resignation_id, interviewer_id, feedback?, conducted_at?
  - Update: feedback?, conducted_at?
  - Response: all fields

### 4. Services
**Create:**
- `backend/app/modules/hrm/services/resignation.py`
  - Standard CRUD + filter by employee_id, status
  - `approve_resignation(db, id, workspace_id, approved_by_id)` — submitted -> approved
  - `reject_resignation(db, id, workspace_id)` — submitted -> rejected
  - `complete_resignation(db, id, workspace_id)` — approved -> completed
    - Validate: all handover tasks completed before allowing completion
- `backend/app/modules/hrm/services/handover_task.py`
  - Standard CRUD + filter by resignation_id, status
  - `complete_task(db, id, workspace_id)` — mark completed
- `backend/app/modules/hrm/services/exit_interview.py`
  - Standard CRUD + filter by resignation_id

### 5. Routers
**Create:**
- `backend/app/modules/hrm/routers/resignations.py`
  - CRUD at `/workspaces/{workspace_id}/resignations`
  - POST `/{id}/approve`, `/{id}/reject`, `/{id}/complete` (admin)
- `backend/app/modules/hrm/routers/handover_tasks.py`
  - CRUD at `/workspaces/{workspace_id}/handover-tasks`
  - POST `/{id}/complete` (member)
- `backend/app/modules/hrm/routers/exit_interviews.py`
  - CRUD at `/workspaces/{workspace_id}/exit-interviews`

### 6. Register routers
**Modify:** `backend/app/modules/hrm/router.py`

### 7. Migration
**Create:** `backend/alembic/versions/0014_add_offboarding_tables.py`

---

## Frontend Implementation

### 8. Hooks
**Create:**
- `frontend/src/modules/hrm/features/offboarding/hooks/use-resignations.ts`
- `frontend/src/modules/hrm/features/offboarding/hooks/use-handover-tasks.ts`
- `frontend/src/modules/hrm/features/offboarding/hooks/use-exit-interviews.ts`

### 9. Components
**Create:**
- `frontend/src/modules/hrm/features/offboarding/components/resignation-form-dialog.tsx`
  - Fields: employee (select), resignation_date, last_working_day, reason
- `frontend/src/modules/hrm/features/offboarding/components/handover-task-form-dialog.tsx`
  - Fields: task_name, description, from_employee (prefilled), to_employee (select), due_date
- `frontend/src/modules/hrm/features/offboarding/components/exit-interview-form-dialog.tsx`
  - Fields: interviewer (select), conducted_at (datetime), feedback (structured form: satisfaction 1-5, reason, suggestions, would_recommend boolean)
- `frontend/src/modules/hrm/features/offboarding/components/handover-checklist.tsx`
  - List of handover tasks with status badges, complete action button

### 10. Pages
**Create:**
- `frontend/src/modules/hrm/features/offboarding/pages/offboarding-list.tsx`
  - Table: employee, resignation_date, last_working_day, status
  - Expandable row or click to detail: handover tasks + exit interview
  - Action buttons: approve/reject/complete

### 11. Routes + Sidebar
**Modify:** `frontend/src/app/router.tsx`
- Route: `/hrm/offboarding`

**Modify:** `frontend/src/shared/components/shell/sidebar.tsx`
- NavItem: Offboarding (UserMinus or LogOut icon)

---

## Files Summary

### Create (backend: 10, frontend: 9)
- 3 models, 3 schemas, 3 services, 3 routers, 1 migration
- 3 hooks, 4 components, 1 page

### Modify
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/components/shell/sidebar.tsx`

---

## TODO
- [ ] Create 3 models
- [ ] Register models
- [ ] Create 3 schemas
- [ ] Create 3 services with action endpoints
- [ ] Create 3 routers
- [ ] Register routers
- [ ] Create migration
- [ ] Create 3 hooks
- [ ] Create 4 components
- [ ] Create offboarding list page
- [ ] Add route and sidebar

## Success Criteria
- Resignation workflow: submitted -> approved/rejected -> completed
- Handover tasks tracked per resignation with completion status
- Cannot complete resignation until all handover tasks done
- Exit interview captures structured feedback
- Offboarding page accessible from sidebar

## Risk Assessment
- Handover completion validation before resignation completion — must check in service
- Exit interview feedback JSONB structure should be documented for frontend consistency
