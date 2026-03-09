# Phase Implementation Report

## Executed Phase
- Phase: phase-02-business-logic-workflows
- Plan: plans/260309-1159-hrm-sop-compliance/
- Status: completed

## Files Modified

| File | Change |
|------|--------|
| `app/modules/hrm/services/vn_tax.py` | Added OT_RATE_* constants + calculate_ot_pay() |
| `app/modules/hrm/models/__init__.py` | Added OvertimeRequest, AttendanceCorrection imports |
| `app/modules/hrm/models/payroll_record.py` | Added ot_pay (Numeric 12,2) + dependents (Integer) columns |
| `app/modules/hrm/schemas/payroll_record.py` | Added ot_pay + dependents to Create/Update/Response |
| `app/modules/hrm/services/recruitment_request.py` | Added RECRUITMENT_TRANSITIONS, headcount validation, submit/approve-hr/approve-ceo/reject functions |
| `app/modules/hrm/services/offer.py` | Added OFFER_TRANSITIONS, approve_offer_hr(); updated send/accept/reject to use validate_transition |
| `app/modules/hrm/services/payroll_record.py` | Added PAYROLL_TRANSITIONS, auto-calc in create (contract+attendance+vn_tax), review_payroll(), approve_payroll() |
| `app/modules/hrm/services/leave_request.py` | Added _calc_days(), _get_used_days(); approve_leave_request() now auto-calcs days + validates balance |
| `app/modules/hrm/services/resignation.py` | Added RESIGNATION_TRANSITIONS, advance_resignation() (sets employee inactive on completion); updated approve/reject to delegate to advance |
| `app/modules/hrm/services/training_program.py` | Added TRAINING_TRANSITIONS, approve_training(), start_training(), complete_training() |
| `app/modules/hrm/services/purchase_request.py` | Added PURCHASE_TRANSITIONS, threshold-based role validation in approve_request(); updated submit/reject to use validate_transition |
| `app/modules/hrm/routers/recruitment_requests.py` | Added /submit, /approve-hr (hr_manager), /approve-ceo (ceo), /reject endpoints |
| `app/modules/hrm/routers/offers.py` | Added /approve-hr (hr_admin) endpoint |
| `app/modules/hrm/routers/payroll_records.py` | Added /review (hr_manager), /approve (hr_admin) endpoints |
| `app/modules/hrm/routers/training_programs.py` | Added /approve (hr_manager), /start, /complete endpoints |
| `app/modules/hrm/routers/resignations.py` | Added /advance (hr_admin) endpoint; fixed /reject to pass current_user.id |
| `app/modules/hrm/router.py` | Registered overtime_requests + attendance_corrections routers |

## Files Created

| File | Purpose |
|------|---------|
| `app/modules/hrm/models/overtime_request.py` | OvertimeRequest SQLAlchemy model |
| `app/modules/hrm/models/attendance_correction.py` | AttendanceCorrection SQLAlchemy model |
| `app/modules/hrm/schemas/overtime_request.py` | OT request Pydantic schemas (Create/Update/Response) |
| `app/modules/hrm/schemas/attendance_correction.py` | Correction Pydantic schemas (Create/Update/Response) |
| `app/modules/hrm/services/overtime_request.py` | OT CRUD + approve/reject (OT_TRANSITIONS state machine) |
| `app/modules/hrm/services/attendance_correction.py` | Correction CRUD + approve (applies corrected times to AttendanceRecord) + reject |
| `app/modules/hrm/routers/overtime_requests.py` | OT endpoints (member create/list/get; line_manager approve/reject) |
| `app/modules/hrm/routers/attendance_corrections.py` | Correction endpoints (member create/list/get; hr_admin approve/reject) |
| `alembic/versions/0020_hrm_phase2_overtime_correction_models.py` | Migration: creates overtime_requests + attendance_corrections tables; adds ot_pay + dependents to payroll_records |

## Tasks Completed

- [x] Add OT rate constants + calculate_ot_pay() to vn_tax.py
- [x] Create OvertimeRequest model, schema, service, router
- [x] Create AttendanceCorrection model, schema, service, router
- [x] Wire recruitment request multi-step approval + headcount validation
- [x] Wire offer HR approval gate (approve_offer_hr before send)
- [x] Wire payroll auto-calculation from contract + attendance + vn_tax
- [x] Add review_payroll() and approve_payroll() with dual approval
- [x] Wire leave balance validation before approval + auto-calc days
- [x] Wire resignation state machine with employee inactive on completion
- [x] Wire training program approval workflow
- [x] Wire purchase request threshold-based approval
- [x] Add all new action endpoints to routers
- [x] Register new routers in hrm/router.py
- [x] Update models/__init__.py with new model imports
- [x] Write migration 0020

## Tests Status
- App import: pass (337 routes registered)
- Transition guard: pass (invalid transition correctly rejected)
- OT calc: pass (calculate_ot_pay returns correct values)
- Schema loading: pass (OvertimeRequestCreate, AttendanceCorrectionCreate)
- Unit tests: deferred to tester agent

## Issues Encountered

1. **Circular import (pre-existing)**: `app.models.__init__` imports from `app.modules.hrm.models.__init__` which triggers a circular dependency when imported via direct model files. Pre-existing before Phase 2 — does not affect FastAPI app startup (app loads fine with 337 routes).

2. **date/time field name shadowing**: Field named `date: date | None` in Pydantic models with `from __future__ import annotations` causes `TypeError: unsupported operand type(s) for |: 'NoneType' and 'NoneType'`. Fixed by aliasing: `from datetime import date as date_type` and using `Optional[date_type]`.

3. **org_tree headcount_summary structure**: `get_headcount_summary()` returns dicts keyed by `department_id` (not `position_id`). Headcount validation simplified to check department-level open positions instead of position-level, matching actual data structure.

## Next Steps
- Tester agent: run `pytest tests/` and write new tests for state machine functions
- Phase 3: Email notifications on state transitions, file upload for contracts/offers, org chart UI
