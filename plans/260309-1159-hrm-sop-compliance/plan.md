---
title: "HRM SOP Compliance Implementation"
description: "Add business logic, RBAC, approval workflows, and integrations to bring 11 HRM SOPs from CRUD shells to full compliance"
status: complete
priority: P1
effort: 32h
branch: feat/hrm-sop-compliance
tags: [hrm, sop, rbac, approval-workflows, backend, frontend]
created: 2026-03-09
completed: 2026-03-09
---

# HRM SOP Compliance Implementation

## Context

Gap analysis found 0/11 SOPs fully compliant. All 28 models/routers/services exist as CRUD shells. Need real business logic: RBAC, approval state machines, auto-calculations, notifications.

**Gap Analysis:** `plans/reports/gap-analysis-260309-1140-hrm-sop-compliance.md`

## Phase Overview

| Phase | File | Focus | Effort | Status |
|-------|------|-------|--------|--------|
| 1 | `phase-01-foundation-rbac-approval-employee.md` | HR RBAC + inline status machines + Employee model completion | 10h | complete |
| 2 | `phase-02-business-logic-workflows.md` | Per-SOP workflow wiring (approval gates, auto-calc, validations) | 14h | complete |
| 3 | `phase-03-integration-ux-enhancements.md` | Email notifications, document uploads, drag-drop pipeline, org chart | 8h | complete |

## Dependency Graph

```
Phase 1 (Foundation) ──> Phase 2 (Business Logic) ──> Phase 3 (Integration)
  - HR RBAC deps             - Wires approval into       - Email on transitions
  - Employee model cols        existing services          - Doc uploads
  - Status enum patterns     - Auto-calc payroll          - Pipeline DnD UI
                              - Validations                - Org chart visual
```

## Key Architecture Decisions

1. **Inline status enums per model** (not a generic ApprovalRequest table) -- KISS, matches CRM pattern
2. **HR roles via `hrm_role` column on WorkspaceMembership** -- extends existing RBAC, no new table
3. **Transition maps as plain dicts in services** -- same as CRM `status_flows.py`
4. **OT rates as constants in `vn_tax.py`** -- extend existing module
5. **Email via ARQ worker** -- existing `worker/tasks.py` pattern
6. **No SLA enforcement yet** -- YAGNI for Phase 1-2, add in Phase 3 if needed

## Migration Strategy

Single migration per phase:
- `0019_hrm_phase1_rbac_employee_statuses.py`
- `0020_hrm_phase2_overtime_correction_models.py`
- `0021_hrm_phase3_document_model.py`

## SOPs Covered Per Phase

| SOP | Phase 1 | Phase 2 | Phase 3 |
|-----|---------|---------|---------|
| 01 Org Chart | dept code col | - | visual org chart |
| 02 Employee Records | +5 personal fields, status | - | doc uploads |
| 03 Recruitment | status enum | headcount validation | JD attachments |
| 04 Candidate Pipeline | - | - | DnD pipeline |
| 05 Offer & Onboarding | contract_type, benefits cols | HR approval gate | email on offer |
| 06 Attendance/Leave/OT | - | OT request model, correction model, leave balance check | - |
| 07 Payroll | status enum expansion | auto-calc wiring, OT rates | email payslips |
| 08 Performance | - | self-assessment flow | - |
| 09 Training | status enum | budget approval | - |
| 10 Assets & Procurement | - | threshold-based approval | - |
| 11 Offboarding | - | state machine, employee inactive | - |
