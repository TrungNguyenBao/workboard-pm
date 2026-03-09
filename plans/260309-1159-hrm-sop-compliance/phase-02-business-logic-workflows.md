# Phase 2: Business Logic — Per-SOP Workflow Wiring

## Context Links
- Phase 1 (prerequisite): `phase-01-foundation-rbac-approval-employee.md`
- Gap analysis: `plans/reports/gap-analysis-260309-1140-hrm-sop-compliance.md`
- Transition helper: `backend/app/modules/hrm/services/status_transitions.py` (created in Phase 1)
- VN tax utilities: `backend/app/modules/hrm/services/vn_tax.py`
- Attendance service: `backend/app/modules/hrm/services/attendance_record.py`
- Leave request service: `backend/app/modules/hrm/services/leave_request.py`

## Overview
- **Priority:** P1
- **Status:** COMPLETE
- **Effort:** 14h
- **Description:** Wire approval state machines, auto-calculations, and validations into existing CRUD services. Add OvertimeRequest and AttendanceCorrection models. Connect payroll to attendance + vn_tax.

## Completion Summary (2026-03-09)
All Phase 2 deliverables successfully implemented:
- OT multiplier constants added to `vn_tax.py` (1.5x weekday, 2.0x weekend, 3.0x holiday)
- `OvertimeRequest` model/service/schema/router created with PENDING→APPROVED|REJECTED workflow
- `AttendanceCorrection` model/service/schema/router created with full approval logic
- Approval state machines wired into: recruitment (4-stage), offer (3-stage), payroll (3-stage), leave, resignation (5-stage), training (4-stage), purchase_request (threshold-based)
- Payroll auto-calculation integrated with contract + attendance data + vn_tax breakdown
- Leave request balance validation and auto-calc business days implemented
- Headcount validation on recruitment submission
- Migration 0020 applied successfully
- All routers registered and endpoints wired

## Key Insights
- All services exist as plain CRUD. Changes are additive — add transition validation and business logic to existing functions.
- Payroll has insurance fields but `create_payroll_record()` does zero calculation.
- `get_monthly_summary()` already aggregates attendance data — reuse for payroll auto-calc.
- Leave balance check exists in `get_employee_detail()` — extract and reuse in approval.

## Requirements

### Functional
1. Recruitment requests: DRAFT -> SUBMITTED -> HR_APPROVED -> CEO_APPROVED | REJECTED
2. Offers: DRAFT -> HR_APPROVED -> SENT -> ACCEPTED | REJECTED (HR gate before send)
3. Payroll: DRAFT -> REVIEWED -> APPROVED -> PAID (dual: HR_MANAGER reviews, HR_ADMIN approves)
4. Training: PLANNED -> APPROVED -> IN_PROGRESS -> COMPLETED
5. Purchase requests: threshold-based approval (< 5M: line_manager, < 20M: hr_admin, >= 20M: ceo)
6. Resignation: PENDING -> APPROVED -> HANDOVER -> EXIT_INTERVIEW -> COMPLETED
7. Leave: validate balance before approval, auto-calculate days from date range
8. Payroll auto-calc: base_salary + allowances + OT - insurance - PIT
9. Overtime request model with PENDING -> APPROVED | REJECTED workflow
10. Attendance correction model with PENDING -> APPROVED | REJECTED workflow
11. Headcount validation on recruitment request submission

### Non-Functional
- All status transitions log `reviewed_by_id` and `reviewed_at` timestamps
- No breaking changes to existing API contracts — new fields are additive

## Architecture

### Transition Maps (defined in each service file)

```python
# recruitment_request.py
RECRUITMENT_TRANSITIONS = {
    "draft": ["submitted"],
    "submitted": ["hr_approved", "rejected"],
    "hr_approved": ["ceo_approved", "rejected"],
    "ceo_approved": [], "rejected": [], "open": ["submitted"],  # legacy compat
}

# offer.py
OFFER_TRANSITIONS = {
    "draft": ["hr_approved"],
    "hr_approved": ["sent", "rejected"],
    "sent": ["accepted", "rejected"],
    "accepted": [], "rejected": [],
}

# payroll_record.py
PAYROLL_TRANSITIONS = {
    "draft": ["reviewed"],
    "reviewed": ["approved"],
    "approved": ["paid"],
    "paid": [],
}

# training_program.py
TRAINING_TRANSITIONS = {
    "planned": ["approved", "cancelled"],
    "approved": ["in_progress", "cancelled"],
    "in_progress": ["completed"],
    "completed": [], "cancelled": [],
}

# purchase_request.py
PURCHASE_TRANSITIONS = {
    "draft": ["submitted"],
    "submitted": ["approved", "rejected"],
    "approved": [], "rejected": [],
}

# resignation.py
RESIGNATION_TRANSITIONS = {
    "pending": ["approved", "rejected"],
    "approved": ["handover"],
    "handover": ["exit_interview"],
    "exit_interview": ["completed"],
    "completed": [], "rejected": [],
}
```

### New Models

**OvertimeRequest** (`backend/app/modules/hrm/models/overtime_request.py`):
```python
class OvertimeRequest(Base, TimestampMixin):
    __tablename__ = "overtime_requests"
    id: Mapped[uuid.UUID] (PK)
    employee_id: Mapped[uuid.UUID] (FK employees)
    date: Mapped[date]
    planned_hours: Mapped[Decimal] (Numeric(4,2))
    reason: Mapped[str] (String(500))
    status: Mapped[str] (default="pending")  # pending/approved/rejected
    approved_by_id: Mapped[uuid.UUID | None] (FK users)
    approved_at: Mapped[datetime | None]
    workspace_id: Mapped[uuid.UUID] (FK workspaces)
```

**AttendanceCorrection** (`backend/app/modules/hrm/models/attendance_correction.py`):
```python
class AttendanceCorrection(Base, TimestampMixin):
    __tablename__ = "attendance_corrections"
    id: Mapped[uuid.UUID] (PK)
    attendance_record_id: Mapped[uuid.UUID] (FK attendance_records)
    employee_id: Mapped[uuid.UUID] (FK employees)
    original_check_in: Mapped[time | None]
    original_check_out: Mapped[time | None]
    corrected_check_in: Mapped[time | None]
    corrected_check_out: Mapped[time | None]
    reason: Mapped[str] (String(500))
    status: Mapped[str] (default="pending")  # pending/approved/rejected
    approved_by_id: Mapped[uuid.UUID | None] (FK users)
    approved_at: Mapped[datetime | None]
    workspace_id: Mapped[uuid.UUID] (FK workspaces)
```

### Payroll Auto-Calculation Flow

```
create_payroll_record(employee_id, period)
  1. Fetch employee's active contract -> base_salary
  2. Fetch attendance summary for period -> actual_working_days, overtime_hours
  3. Calculate OT pay: overtime_hours * (base_salary / working_days / 8) * OT_RATE
  4. Sum allowances from contract or payroll input
  5. Call vn_tax.calculate_net_salary(gross, dependents, allowances)
  6. Populate all insurance + tax fields automatically
  7. Set status = "draft"
```

OT rate constants to add in `vn_tax.py`:
```python
OT_RATE_WEEKDAY = 1.5    # 150%
OT_RATE_WEEKEND = 2.0    # 200%
OT_RATE_HOLIDAY = 3.0    # 300%
```

## Related Code Files

### Files to Modify
| File | Change |
|------|--------|
| `services/recruitment_request.py` | Add transition map, `submit_request()`, `approve_hr()`, `approve_ceo()`, headcount validation |
| `services/offer.py` | Add transition map, `approve_offer_hr()` gate before `send_offer()` |
| `services/payroll_record.py` | Add auto-calc logic in `create_payroll_record()`, transition map, `review_payroll()`, `approve_payroll()` |
| `services/leave_request.py` | Add balance validation in `approve_leave_request()`, auto-calc days |
| `services/training_program.py` | Add transition map, `approve_training()` |
| `services/vn_tax.py` | Add OT rate constants and `calculate_ot_pay()` function |
| `services/attendance_record.py` | No change — consumed by payroll |
| `routers/recruitment_requests.py` | Add `/submit`, `/approve-hr`, `/approve-ceo` action endpoints |
| `routers/offers.py` | Add `/approve-hr` endpoint |
| `routers/payroll_records.py` | Add `/review`, `/approve` endpoints, update create to auto-calc |
| `routers/leave_requests.py` | Update approve to use HRM role dep |
| `routers/training_programs.py` | Add `/approve` endpoint |
| `schemas/recruitment_request.py` | Add `salary_range_min/max` to response |
| `schemas/payroll_record.py` | Add `ot_pay` field |
| `models/__init__.py` | Import OvertimeRequest, AttendanceCorrection |
| `models/payroll_record.py` | Add `ot_pay`, `dependents` columns |
| `models/leave_request.py` | Ensure `days` is computed if null |

### Files to Create
| File | Purpose |
|------|---------|
| `models/overtime_request.py` | OvertimeRequest model |
| `models/attendance_correction.py` | AttendanceCorrection model |
| `schemas/overtime_request.py` | OT request schemas |
| `schemas/attendance_correction.py` | Correction schemas |
| `services/overtime_request.py` | OT request CRUD + approval |
| `services/attendance_correction.py` | Correction CRUD + approval (applies correction on approve) |
| `routers/overtime_requests.py` | OT request endpoints |
| `routers/attendance_corrections.py` | Correction endpoints |

### Router Registration
Add new routers to `backend/app/modules/hrm/router.py`.

## Implementation Steps

### Step 1: Add OT rates to vn_tax.py
```python
OT_RATE_WEEKDAY = Decimal("1.5")
OT_RATE_WEEKEND = Decimal("2.0")
OT_RATE_HOLIDAY = Decimal("3.0")

def calculate_ot_pay(
    base_salary: float, working_days: int, ot_weekday_hours: float = 0,
    ot_weekend_hours: float = 0, ot_holiday_hours: float = 0,
) -> float:
    hourly = base_salary / working_days / 8 if working_days > 0 else 0
    return round(
        hourly * ot_weekday_hours * float(OT_RATE_WEEKDAY)
        + hourly * ot_weekend_hours * float(OT_RATE_WEEKEND)
        + hourly * ot_holiday_hours * float(OT_RATE_HOLIDAY), 2
    )
```

### Step 2: Wire recruitment request approval
In `services/recruitment_request.py`, add:
- `RECRUITMENT_TRANSITIONS` dict
- `submit_recruitment_request()` — validates headcount via `get_headcount_summary()`, transitions draft->submitted
- `approve_recruitment_hr()` — requires hr_manager+, transitions submitted->hr_approved
- `approve_recruitment_ceo()` — requires ceo, transitions hr_approved->ceo_approved
- `reject_recruitment_request()` — any approver can reject from submitted/hr_approved

Headcount validation logic:
```python
from app.modules.hrm.services.org_tree import get_headcount_summary

async def _validate_headcount(db, workspace_id, position_id, quantity):
    summary = await get_headcount_summary(db, workspace_id)
    for dept in summary:
        for pos in dept.get("positions", []):
            if str(pos["id"]) == str(position_id):
                available = pos["headcount_limit"] - pos["filled"]
                if quantity > available:
                    raise HTTPException(400, f"Headcount exceeded: {available} available, {quantity} requested")
                return
```

### Step 3: Wire offer HR approval gate
In `services/offer.py`:
- Add `OFFER_TRANSITIONS`
- Add `approve_offer_hr()` — transitions draft->hr_approved
- Modify `send_offer()` — now requires status=hr_approved (not draft)

### Step 4: Wire payroll auto-calculation
In `services/payroll_record.py`, modify `create_payroll_record()`:
```python
async def create_payroll_record(db, workspace_id, data, auto_calc: bool = True):
    if auto_calc and data.employee_id:
        # 1. Get active contract for base_salary
        contract = await _get_active_contract(db, data.employee_id, workspace_id)
        # 2. Get attendance summary for period
        summary = await get_monthly_summary(db, workspace_id, data.period)
        emp_summary = next((s for s in summary if s.employee_id == data.employee_id), None)
        # 3. Calculate OT pay
        ot_pay = calculate_ot_pay(contract.base_salary, data.working_days or 22, ...)
        # 4. Calculate net via vn_tax
        breakdown = calculate_net_salary(contract.base_salary, data.dependents or 0)
        # 5. Populate all fields from breakdown
```

### Step 5: Wire leave balance validation
In `services/leave_request.py`, before approving:
```python
async def approve_leave_request(db, leave_request_id, workspace_id, reviewer_id):
    lr = await get_leave_request(db, leave_request_id, workspace_id)
    # Auto-calc days if not set
    if lr.days is None or lr.days == 0:
        lr.days = _calculate_business_days(lr.start_date, lr.end_date)
    # Validate balance
    balance = await _get_leave_balance(db, lr.employee_id, lr.leave_type_id, workspace_id)
    if lr.days > balance["remaining"]:
        raise HTTPException(400, f"Insufficient leave balance: {balance['remaining']} remaining")
    ...
```

### Step 6: Create OvertimeRequest model + service + router
Standard CRUD + `approve_overtime()` / `reject_overtime()`. On approval, optionally update AttendanceRecord.overtime_hours for that date.

### Step 7: Create AttendanceCorrection model + service + router
CRUD + `approve_correction()`. On approval, apply corrected times to the original AttendanceRecord and recalculate total_hours.

### Step 8: Wire resignation state machine
In `services/resignation.py` (or existing offboarding service):
```python
RESIGNATION_TRANSITIONS = {
    "pending": ["approved", "rejected"],
    "approved": ["handover"],
    "handover": ["exit_interview"],
    "exit_interview": ["completed"],
    "completed": [], "rejected": [],
}

async def advance_resignation(db, resignation_id, workspace_id, target_status, actor_id):
    r = await get_resignation(db, resignation_id, workspace_id)
    validate_transition(r.status, target_status, RESIGNATION_TRANSITIONS, "Resignation")
    r.status = target_status
    if target_status == "completed":
        # Mark employee as inactive
        employee = await get_employee(db, r.employee_id, workspace_id)
        employee.employee_status = "inactive"
    ...
```

### Step 9: Wire training approval
Add `approve_training()`, `start_training()`, `complete_training()` to `services/training_program.py`.

### Step 10: Wire purchase request threshold approval
```python
PURCHASE_THRESHOLDS = [
    (Decimal("5_000_000"), "line_manager"),
    (Decimal("20_000_000"), "hr_admin"),
    (Decimal("999_999_999_999"), "ceo"),
]

async def approve_purchase(db, request_id, workspace_id, approver_id, approver_hrm_role):
    pr = await get_purchase_request(db, request_id, workspace_id)
    required_role = next(role for threshold, role in PURCHASE_THRESHOLDS if pr.estimated_total <= threshold)
    if HRM_ROLE_RANK.get(approver_hrm_role, 0) < HRM_ROLE_RANK.get(required_role, 0):
        raise HTTPException(403, f"Requires {required_role} for this amount")
    ...
```

### Step 11: Add action endpoints to routers
For each service change, add corresponding `POST /resource/{id}/{action}` endpoints using `require_hrm_role()`.

### Step 12: Write migration
`0020_hrm_phase2_overtime_correction_models.py`:
- Create `overtime_requests` table
- Create `attendance_corrections` table
- Add `ot_pay` (Numeric(12,2)) and `dependents` (Integer) to `payroll_records`

## TODO Checklist

- [x] Add OT rate constants + `calculate_ot_pay()` to `vn_tax.py`
- [x] Create OvertimeRequest model, schema, service, router
- [x] Create AttendanceCorrection model, schema, service, router
- [x] Wire recruitment request multi-step approval + headcount validation
- [x] Wire offer HR approval gate (modify `send_offer()` precondition)
- [x] Wire payroll auto-calculation from contract + attendance + vn_tax
- [x] Add `review_payroll()` and `approve_payroll()` with dual approval
- [x] Wire leave balance validation before approval + auto-calc days
- [x] Wire resignation state machine with employee inactive on completion
- [x] Wire training program approval workflow
- [x] Wire purchase request threshold-based approval
- [x] Add all new action endpoints to routers
- [x] Register new routers in `hrm/router.py`
- [x] Update `models/__init__.py` with new model imports
- [x] Write migration `0020`
- [x] Run `make test` — fix any broken tests

## Success Criteria
1. Each entity rejects invalid status transitions with clear error messages
2. Recruitment request validates headcount before submission
3. Payroll auto-populates insurance, tax, OT from attendance + contract data
4. Leave approval blocked when balance insufficient
5. Resignation completion sets employee to inactive
6. Purchase approval enforces amount-based role thresholds
7. OT and correction requests have full approve/reject workflow
8. All new endpoints use `require_hrm_role()` for authorization

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Payroll auto-calc depends on complete attendance data for period | Default to manual input if no attendance records found; log warning |
| Headcount summary API may be slow for large orgs | Only called on submission (not on every page load); N+1 already mitigated by existing service |
| Existing `open` status on recruitment requests | Add `"open": ["submitted"]` transition to handle legacy records |
| Leave `days` field is currently manual input | Auto-calc only if null/0; preserve existing manual values |
