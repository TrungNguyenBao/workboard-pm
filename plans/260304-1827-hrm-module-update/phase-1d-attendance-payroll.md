---
phase: 1D
title: "Attendance & Enhanced C&B"
status: pending
priority: P1
effort: 6h
depends_on: [1B]
---

# Phase 1D — Attendance & Enhanced Compensation & Benefits

## Context
- [Brainstorm Report](../reports/brainstorm-260304-1818-hrm-module-update.md)
- Depends on: Phase 1B (contracts for salary base)
- Existing: `backend/app/modules/hrm/models/payroll_record.py`
- Existing: `backend/app/modules/hrm/schemas/payroll_record.py`
- Existing: `backend/app/modules/hrm/services/payroll_record.py`
- Existing: `frontend/src/modules/hrm/features/payroll/`

## Overview
Add `attendance_records` and `insurance_records` tables. Enhance existing `payroll_records` with structured BHXH/tax fields. Add monthly attendance summary endpoint.

---

## Entity Schemas

### AttendanceRecord (NEW)
```python
id: UUID PK
employee_id: UUID FK(employees.id, CASCADE)  # Required, indexed
date: Date                                   # Required
check_in: Time                               # Nullable
check_out: Time                              # Nullable
status: String(20)                           # present/absent/late/half_day/holiday/leave
total_hours: Numeric(4,2)                    # Nullable, calculated
overtime_hours: Numeric(4,2)                 # Default 0
notes: String(255)                           # Nullable
workspace_id: UUID FK(workspaces.id)         # Required, indexed
# + TimestampMixin
# UNIQUE constraint: (employee_id, date)
```

### InsuranceRecord (NEW)
```python
id: UUID PK
employee_id: UUID FK(employees.id, CASCADE)  # Required, indexed
insurance_type: String(50)                   # bhxh / bhyt / bhtn
base_salary: Numeric(12,2)                   # Insurance base salary
employee_rate: Numeric(5,4)                  # e.g., 0.0800 = 8%
employer_rate: Numeric(5,4)                  # e.g., 0.1750 = 17.5%
effective_from: Date                         # Required
effective_to: Date                           # Nullable
workspace_id: UUID FK(workspaces.id)         # Required, indexed
# + TimestampMixin
```

### PayrollRecord (ALTER existing)
```python
# Add new columns to existing payroll_records
base_salary: Numeric(12,2)                   # Nullable (from contract)
allowances: JSONB                            # Nullable (structured)
bhxh_employee: Numeric(12,2)                 # Default 0
bhxh_employer: Numeric(12,2)                 # Default 0
bhyt_employee: Numeric(12,2)                 # Default 0
bhyt_employer: Numeric(12,2)                 # Default 0
bhtn_employee: Numeric(12,2)                 # Default 0
bhtn_employer: Numeric(12,2)                 # Default 0
taxable_income: Numeric(12,2)                # Default 0
personal_deduction: Numeric(12,2)            # Default 11_000_000
dependent_deduction: Numeric(12,2)           # Default 0
pit_amount: Numeric(12,2)                    # Default 0 (personal income tax)
working_days: Integer                        # Nullable
actual_working_days: Integer                 # Nullable
```

---

## Backend Implementation

### 1. Model: AttendanceRecord
**Create:** `backend/app/modules/hrm/models/attendance_record.py`
- Include `__table_args__` with UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date")
- Relationships: employee, workspace

### 2. Model: InsuranceRecord
**Create:** `backend/app/modules/hrm/models/insurance_record.py`
- Relationships: employee, workspace

### 3. Alter PayrollRecord model
**Modify:** `backend/app/modules/hrm/models/payroll_record.py`
- Add all new columns (all with defaults/nullable so existing data is preserved)
- Keep existing columns (gross, net, deductions, status, period)

### 4. Register models
**Modify:** `backend/app/modules/hrm/models/__init__.py`
- Add AttendanceRecord, InsuranceRecord imports

### 5. Schema: AttendanceRecord
**Create:** `backend/app/modules/hrm/schemas/attendance_record.py`
```
AttendanceRecordCreate: employee_id, date, check_in?, check_out?, status, notes?
AttendanceRecordUpdate: check_in?, check_out?, status?, notes?
AttendanceRecordResponse: all fields + total_hours, overtime_hours + from_attributes
AttendanceMonthlySummary: employee_id, month(str YYYY-MM), present_days, absent_days, late_days, total_hours, overtime_hours
```
- total_hours auto-calculated from check_in/check_out in service

### 6. Schema: InsuranceRecord
**Create:** `backend/app/modules/hrm/schemas/insurance_record.py`
```
InsuranceRecordCreate: employee_id, insurance_type(validated), base_salary, employee_rate, employer_rate, effective_from, effective_to?
InsuranceRecordUpdate: base_salary?, employee_rate?, employer_rate?, effective_to?
InsuranceRecordResponse: all fields + from_attributes
```
- Validate insurance_type in {"bhxh", "bhyt", "bhtn"}

### 7. Update PayrollRecord schemas
**Modify:** `backend/app/modules/hrm/schemas/payroll_record.py`
- PayrollRecordCreate: add new fields (all optional with defaults)
- PayrollRecordUpdate: add new fields
- PayrollRecordResponse: add new fields

### 8. Service: AttendanceRecord
**Create:** `backend/app/modules/hrm/services/attendance_record.py`
- `create_attendance(db, workspace_id, data)` -> AttendanceRecord
  - Auto-calculate total_hours from check_in/check_out if both provided
  - Enforce unique (employee_id, date)
- `list_attendance(db, workspace_id, employee_id?, date_from?, date_to?, page, page_size)` -> tuple
- `get_attendance(db, record_id, workspace_id)` -> AttendanceRecord
- `update_attendance(db, record_id, workspace_id, data)` -> AttendanceRecord
- `delete_attendance(db, record_id, workspace_id)` -> None
- `get_monthly_summary(db, workspace_id, month: str, employee_id?)` -> list[AttendanceMonthlySummary]
  - Aggregate by employee: COUNT by status, SUM total_hours, SUM overtime_hours

### 9. Service: InsuranceRecord
**Create:** `backend/app/modules/hrm/services/insurance_record.py`
- Standard CRUD + filter by employee_id, insurance_type
- List active records (effective_to IS NULL or >= today)

### 10. Service: Enhanced payroll calculation helper
**Create:** `backend/app/modules/hrm/services/payroll_calculator.py`
- `calculate_payroll(base_salary, allowances, insurance_records, working_days, actual_days, dependents)` -> dict
  - Hardcoded VN PIT brackets:
    - Up to 5M: 5%, 5-10M: 10%, 10-18M: 15%, 18-32M: 20%, 32-52M: 25%, 52-80M: 30%, >80M: 35%
  - Personal deduction: 11,000,000 VND
  - Per dependent: 4,400,000 VND
  - Calculate: gross -> insurance deductions -> taxable income -> PIT -> net
- Pure function, no DB access — called from payroll service

### 11. Routers
**Create:**
- `backend/app/modules/hrm/routers/attendance_records.py`
  - CRUD at `/workspaces/{workspace_id}/attendance-records`
  - GET `/workspaces/{workspace_id}/attendance-records/monthly-summary?month=2026-03&employee_id=...` (member)
- `backend/app/modules/hrm/routers/insurance_records.py`
  - CRUD at `/workspaces/{workspace_id}/insurance-records`

### 12. Register routers
**Modify:** `backend/app/modules/hrm/router.py`
- Add attendance_records, insurance_records routers

### 13. Migration
**Create:** `backend/alembic/versions/0011_add_attendance_insurance_alter_payroll.py`
- Create attendance_records table + unique constraint
- Create insurance_records table
- Alter payroll_records: add new columns

---

## Frontend Implementation

### 14. Hook: Attendance
**Create:** `frontend/src/modules/hrm/features/attendance/hooks/use-attendance.ts`
- `useAttendance(wsId, filters)` — with date_from, date_to, employee_id
- `useAttendanceSummary(wsId, month, employeeId?)` — monthly summary
- CRUD mutations

### 15. Hook: Insurance
**Create:** `frontend/src/modules/hrm/features/payroll/hooks/use-insurance.ts`
- Standard query + mutations

### 16. Update payroll hook
**Modify:** `frontend/src/modules/hrm/features/payroll/hooks/use-payroll.ts`
- Update interfaces with new fields

### 17. Components
**Create:**
- `frontend/src/modules/hrm/features/attendance/components/attendance-form-dialog.tsx`
  - Fields: employee (select), date, check_in (time), check_out (time), status (select), notes
- `frontend/src/modules/hrm/features/attendance/components/attendance-summary-card.tsx`
  - Monthly summary: present/absent/late/overtime counts
- `frontend/src/modules/hrm/features/payroll/components/insurance-form-dialog.tsx`
  - Fields: employee, type (BHXH/BHYT/BHTN), base_salary, rates, effective dates
- `frontend/src/modules/hrm/features/payroll/components/payslip-detail-view.tsx`
  - Detailed breakdown: base salary, allowances, insurance deductions, tax, net

### 18. Pages
**Create:**
- `frontend/src/modules/hrm/features/attendance/pages/attendance-list.tsx`
  - Table view with date range filter, employee filter
  - Monthly summary section at top

**Modify:**
- `frontend/src/modules/hrm/features/payroll/pages/payroll-list.tsx`
  - Add insurance management tab or section
  - Show enhanced payslip details on row click

### 19. Routes + Sidebar
**Modify:** `frontend/src/app/router.tsx`
- Add route: `/hrm/attendance`

**Modify:** `frontend/src/shared/components/shell/sidebar.tsx`
- Add NavItem: Attendance (Clock icon)

---

## Files Summary

### Create
- `backend/app/modules/hrm/models/attendance_record.py`
- `backend/app/modules/hrm/models/insurance_record.py`
- `backend/app/modules/hrm/schemas/attendance_record.py`
- `backend/app/modules/hrm/schemas/insurance_record.py`
- `backend/app/modules/hrm/services/attendance_record.py`
- `backend/app/modules/hrm/services/insurance_record.py`
- `backend/app/modules/hrm/services/payroll_calculator.py`
- `backend/app/modules/hrm/routers/attendance_records.py`
- `backend/app/modules/hrm/routers/insurance_records.py`
- `backend/alembic/versions/0011_add_attendance_insurance_alter_payroll.py`
- `frontend/src/modules/hrm/features/attendance/hooks/use-attendance.ts`
- `frontend/src/modules/hrm/features/attendance/components/attendance-form-dialog.tsx`
- `frontend/src/modules/hrm/features/attendance/components/attendance-summary-card.tsx`
- `frontend/src/modules/hrm/features/attendance/pages/attendance-list.tsx`
- `frontend/src/modules/hrm/features/payroll/hooks/use-insurance.ts`
- `frontend/src/modules/hrm/features/payroll/components/insurance-form-dialog.tsx`
- `frontend/src/modules/hrm/features/payroll/components/payslip-detail-view.tsx`

### Modify
- `backend/app/modules/hrm/models/payroll_record.py`
- `backend/app/modules/hrm/models/__init__.py`
- `backend/app/modules/hrm/schemas/payroll_record.py`
- `backend/app/modules/hrm/router.py`
- `frontend/src/modules/hrm/features/payroll/hooks/use-payroll.ts`
- `frontend/src/modules/hrm/features/payroll/pages/payroll-list.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/components/shell/sidebar.tsx`

---

## TODO
- [ ] Create AttendanceRecord model (with unique constraint)
- [ ] Create InsuranceRecord model
- [ ] Alter PayrollRecord model (add BHXH/tax columns)
- [ ] Register new models
- [ ] Create AttendanceRecord schemas (including monthly summary)
- [ ] Create InsuranceRecord schemas
- [ ] Update PayrollRecord schemas
- [ ] Create attendance service (with auto total_hours calculation)
- [ ] Create insurance service
- [ ] Create payroll calculator (VN tax brackets)
- [ ] Create attendance router (with monthly-summary endpoint)
- [ ] Create insurance router
- [ ] Register routers
- [ ] Create migration
- [ ] Create attendance frontend (hook, components, page)
- [ ] Create insurance frontend (hook, form dialog)
- [ ] Update payroll frontend (enhanced payslip view)
- [ ] Add routes and sidebar

## Success Criteria
- Attendance CRUD with unique (employee_id, date) enforced
- Monthly attendance summary aggregates correctly
- Insurance CRUD with proper rate tracking
- Payroll shows detailed breakdown (salary, insurance, tax, net)
- VN PIT calculated correctly using hardcoded brackets
- Attendance page accessible from sidebar

## Risk Assessment
- Payroll calculation accuracy — must match VN tax law; unit tests essential
- total_hours auto-calc from Time fields may need timezone handling
- Altering payroll_records must preserve existing data (all new columns nullable/with defaults)
