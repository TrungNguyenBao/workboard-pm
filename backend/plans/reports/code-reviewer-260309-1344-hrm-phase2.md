# Code Review: HRM Phase 2 — Business Logic Workflows

**Date:** 2026-03-09
**Reviewer:** code-reviewer agent
**Score: 6.5 / 10**

---

## Scope

- Files reviewed: 18 (9 new, 9 modified services/routers)
- Focus: state machines, authorization, payroll calc, leave balance, resignation side-effects, purchase thresholds, migration, query safety, error handling

---

## Overall Assessment

The new overtime/attendance-correction layer is clean and follows established patterns correctly. The core state machine helper (`validate_transition`) is solid. The VN tax math in `vn_tax.py` is largely correct and pure. However, there are several **high-severity** issues clustered around: (a) purchase-request approval bypassing the HRM role gate entirely, (b) a type mismatch in headcount validation that always skips the check, (c) a midnight-rollover bug in the attendance correction time calculator, (d) a `calculate_net_salary` internal inconsistency where PIT is calculated on base salary while `assessable` is correctly inflated by allowances. These are correctness and security defects, not style issues.

---

## Critical Issues

### CRIT-1 — Purchase approval uses `require_workspace_role("admin")` instead of `require_hrm_role`

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/routers/purchase_requests.py` lines 116–136

The approve endpoint:
```python
current_user: User = Depends(require_workspace_role("admin")),
```
passes `current_user.id` to `approve_request()` but **never passes `approver_hrm_role`**. The service signature is:
```python
async def approve_request(..., approver_hrm_role: str | None = None) -> PurchaseRequest:
    if approver_hrm_role is not None:  # always None here — gate is skipped
        ...
```
Result: any workspace admin can approve any purchase amount regardless of the VND threshold logic defining `line_manager` / `hr_admin` / `ceo` requirements. The entire threshold-based role check is dead code at runtime.

**Fix:** Replace `require_workspace_role("admin")` with `require_hrm_role("line_manager")` (minimum), resolve the current user's `hrm_role` from membership, and pass it to `approve_request`.

---

### CRIT-2 — Headcount UUID type mismatch silently skips the check

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/services/recruitment_request.py` lines 22–34

```python
# get_headcount_summary returns: {"department_id": str(d.id), ...}
for dept in summary:
    if dept["department_id"] == str(department_id):   # OK if both str
        ...
        return
# Falls through silently if department not found — no validation performed
```

`get_headcount_summary` serializes `department_id` as `str(d.id)` and `department_id` is cast to `str()` in the check, so the comparison works **if the department exists in the summary**. But if a department has zero positions (no rows in `positions` table), it still appears in the loop with `open_positions = 0`. However, if `department_id` references a department that has no entry at all (edge case: empty workspace), the loop exits without raising — silently allowing unlimited headcount requests.

More critically, the function **returns without raising** when the department is found and has available slots, but **also returns without raising** when the department is not found at all. This means a request for a non-existent department passes headcount validation.

**Fix:** After the loop completes without finding the department, raise a 400 (or 404) rather than returning silently.

```python
# After the for loop:
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail=f"Department {department_id} not found in headcount summary",
)
```

---

## High Priority

### HIGH-1 — `_calc_hours` midnight-rollover produces negative hours

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/services/attendance_correction.py` lines 21–27

```python
def _calc_hours(check_in: time | None, check_out: time | None) -> Decimal | None:
    dt_in = datetime.combine(date.today(), check_in)
    dt_out = datetime.combine(date.today(), check_out)
    diff = (dt_out - dt_in).total_seconds() / 3600
    return Decimal(str(round(max(diff, 0), 2)))  # max(diff, 0) floors to 0
```

The `max(diff, 0)` prevents negative values, but a night-shift worker clocking in at 22:00 and out at 06:00 (next day) would produce `diff = -16.0 hours`, silently clamped to 0 and then written to `attendance_records.total_hours`. This corrupts the payroll base data. The function must detect check_out < check_in and add 24 hours to `dt_out`.

---

### HIGH-2 — `calculate_net_salary` double-counts allowances in PIT

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/services/vn_tax.py` lines 105–133

`calculate_net_salary` computes `assessable = gross_salary + other_allowances - total_insurance` correctly, but then calls `calculate_pit(gross_salary, dependents)` — passing `gross_salary` without allowances. This means:
- The `taxable_income` field in the returned dict is computed with allowances included.
- The `pit_amount` field is computed without allowances.
- These two fields are inconsistent: `taxable_income` does not match what PIT was actually calculated from.

In `payroll_record.py` line 69, `calculate_net_salary(base, dependents)` is called without `other_allowances`, so in isolation this doesn't trigger, but the internal inconsistency is a latent bug for any future caller passing allowances.

**Fix:** `calculate_pit` should be called with `assessable` (post-allowance, post-insurance income) rather than `gross_salary`, or `calculate_net_salary` should derive `taxable_income` from the same value used in `calculate_pit`.

---

### HIGH-3 — `reject_resignation` fallback UUID is silent data corruption

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/services/resignation.py` lines 116–119

```python
async def reject_resignation(
    db: AsyncSession, resignation_id: uuid.UUID, workspace_id: uuid.UUID, approver_id: uuid.UUID | None = None
) -> Resignation:
    actor = approver_id or uuid.uuid4()  # fallback — actor must be passed by caller
```

The comment acknowledges this is wrong, but the code generates a random UUID as the `approved_by_id` when none is provided. This will write an unresolvable foreign key value for `approved_by_id` in the database (or fail the FK constraint if the DB enforces it). The router always passes `current_user.id`, so this does not trigger in normal usage, but calling the service directly without `approver_id` is dangerous. The function signature should make `approver_id` required, not optional.

---

### HIGH-4 — Overtime request allows creating a request for another employee without ownership check

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/routers/overtime_requests.py` lines 27–38

The create endpoint only requires `require_workspace_role("member")`. The payload `OvertimeRequestCreate` accepts any `employee_id`. There is no check that `current_user` is the employee or a manager of the employee. A member can file an overtime request on behalf of any other employee. The same applies to `attendance_corrections`.

---

### HIGH-5 — Payroll `approved` → `paid` transition exists in model but not in router

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/services/payroll_record.py` lines 18–23

`PAYROLL_TRANSITIONS` includes `"approved": ["paid"]` but no `mark_paid` function or `/pay` endpoint exists in the router. A payroll record approved via the API can never reach `"paid"` status. If `"paid"` status is used elsewhere (reporting, downstream checks), records will be stuck at `approved`. Either add the endpoint or remove `"paid"` from transitions.

---

## Medium Priority

### MED-1 — `OvertimeRequestUpdate` schema exposes `status` as a free-text field

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/schemas/overtime_request.py` lines 19–30

`OvertimeRequestUpdate.status` accepts any string from the valid set via `OvertimeRequestUpdate`, but the update endpoint for OT requests is not present in the router (only create/list/get/approve/reject/delete). The `status` field in the Update schema has no purpose and could become a security hole if a generic PATCH endpoint is added later without noticing it. Recommend removing `status` from Update schemas for resources that use dedicated action endpoints.

---

### MED-2 — Leave approve/reject uses `require_workspace_role("admin")` instead of HRM role

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/routers/leave_requests.py` lines 72–95

`approve` and `reject` use `require_workspace_role("admin")`. This is inconsistent with other similar approval flows that use `require_hrm_role("line_manager")`. Workspace admins are not necessarily line managers. This may be intentional for MVP simplicity, but it diverges from the module's own RBAC pattern.

---

### MED-3 — Resignation approval uses `require_workspace_role("admin")` instead of HRM role

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/routers/resignations.py` lines 97–121

Same issue as MED-2. The approve/reject endpoints use `require_workspace_role("admin")`. Only the `advance` endpoint correctly uses `require_hrm_role("hr_admin")`. Approving and rejecting a resignation should require an HRM role, not just workspace admin.

---

### MED-4 — No validation that `corrected_check_in` / `corrected_check_out` are actually different from originals

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/schemas/attendance_correction.py`

The schema permits submitting a correction where `corrected_check_in == original_check_in` and `corrected_check_out == original_check_out`. This creates a no-op correction record that wastes an approval workflow step. A pydantic model-level validator should reject identical before/after values.

---

### MED-5 — `_validate_headcount` is only called at `submit` time, not re-validated at `hr_approved` or `ceo_approved`

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/services/recruitment_request.py` lines 105–114

Headcount is checked at submit. Between submit and HR/CEO approval, someone could reduce the department's open positions (e.g., another request gets approved). The approval steps do not re-validate headcount, so stale approvals can exceed the quota.

---

### MED-6 — `calculate_ot_pay` always assigns all OT hours as weekday OT

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/services/payroll_record.py` lines 54–67

```python
ot_hours = float(emp_summary.overtime_hours)
ot_pay = calculate_ot_pay(base, working_days, ot_weekday_hours=ot_hours)
```

`attendance_records` only tracks a single `overtime_hours` field with no day-type breakdown. All OT is assumed weekday (1.5x). Weekend (2.0x) and holiday (3.0x) OT is never applied. The function signature supports these parameters but they are never populated. This under-pays weekend/holiday OT under VN law. This is an architectural gap — the attendance model would need `ot_weekend_hours` and `ot_holiday_hours` columns to fix this properly.

---

### MED-7 — `advance_resignation` endpoint accepts `target_status` as a plain query parameter

**File:** `D:/Coding/workboard-pm/backend/app/modules/hrm/routers/resignations.py` lines 123–134

```python
async def advance(
    workspace_id: uuid.UUID,
    resignation_id: uuid.UUID,
    target_status: str,   # query param — no validation
    ...
```

`target_status` is not validated before being passed to `advance_resignation`. While `validate_transition` will catch invalid values, the error message leaks the internal transition map. Prefer an explicit `Enum` or `Literal` type for the query parameter.

---

## Low Priority

### LOW-1 — Missing `workspace_id` index on `overtime_requests` and `attendance_corrections` models vs migration

Both models declare `index=True` on `workspace_id`. The migration creates those indexes. This is correct. No issue.

### LOW-2 — `OvertimeRequest` model has no relationship to `workspace`

Both `OvertimeRequest` and `AttendanceCorrection` models only define `employee` relationship; no `workspace` or `approved_by` relationships. Not blocking, but responses that include workspace or approver name would require additional queries.

### LOW-3 — `payroll_record.py` auto-calc silently swallows all exceptions

```python
except Exception as exc:
    log.warning("Payroll auto-calc failed, falling back to manual: %s", exc)
```

Swallowing all exceptions is risky — a misconfigured DB connection would silently produce a payroll record with all-zero values at `draft` status. Consider only catching `Exception` types that are expected (e.g., `AttributeError` for missing contract fields) and letting infrastructure errors propagate.

---

## Edge Cases Found by Scouting

1. **Attendance correction with no corrected fields** — a correction where all four time fields are `None` passes schema validation and creates a record that, when approved, writes nothing to the attendance record but still fires the approval workflow.
2. **Resignation for already-inactive employee** — `advance_resignation` at `completed` sets `employee_status = "inactive"` even if the employee is already inactive (e.g., a soft-delete scenario). This is a no-op but not guarded.
3. **Concurrent OT requests for same employee/date** — no unique constraint on `(employee_id, date)` in `overtime_requests`. Multiple simultaneous requests for the same date will all persist. This should likely have a unique constraint or a "one pending per day" check.
4. **`_get_used_days` race condition** — between the balance check and the `lr.status = "approved"` commit in `approve_leave_request`, another concurrent request for the same employee/leave_type could be approved simultaneously, exceeding the balance. PostgreSQL row-level locking (`SELECT FOR UPDATE`) would prevent this.

---

## Positive Observations

- `validate_transition` helper is clean, reusable, and used consistently across all state machines.
- VN tax constants are well-documented with references to 2024 law, PIT brackets correctly enumerated.
- `calculate_ot_pay` correctly uses `Decimal` arithmetic for currency safety on the multipliers.
- All new routers correctly use `workspace_id` scoping for tenant isolation.
- `selectinload` in `purchase_request.py` for items correctly avoids N+1 on the list endpoint.
- Migration DDL is complete and matches the ORM model definitions for the new tables.
- The payroll `"reviewed" → "approved"` two-step gate with separate HRM roles (`hr_manager` vs `hr_admin`) is well-designed.
- `_calc_hours` using `max(diff, 0)` is a safe floor even though it doesn't handle midnight rollover.

---

## Recommended Actions (Prioritized)

1. **[CRIT-1]** Fix purchase approval to use `require_hrm_role` and pass `approver_hrm_role` to the service.
2. **[CRIT-2]** Add a fallback `raise HTTPException(404)` after the headcount loop when department is not found.
3. **[HIGH-1]** Fix `_calc_hours` midnight rollover by adding 1 day to `dt_out` when `check_out < check_in`.
4. **[HIGH-2]** Fix `calculate_net_salary` to pass the allowance-adjusted `assessable` value (not raw `gross_salary`) into `calculate_pit`.
5. **[HIGH-3]** Remove the `approver_id: uuid.UUID | None` optional default from `reject_resignation`; make it required.
6. **[HIGH-4]** Add ownership/manager check to OT request and attendance correction create endpoints.
7. **[HIGH-5]** Either add a `POST /pay` endpoint for payroll or remove `"paid"` from `PAYROLL_TRANSITIONS`.
8. **[MED-1/MED-2]** Standardize leave/resignation approve/reject to use `require_hrm_role` consistently.
9. **[MED-4]** Add pydantic validator to `AttendanceCorrectionCreate` to reject no-op corrections.
10. **[Edge-3]** Add `UniqueConstraint("employee_id", "date")` to `overtime_requests` table (migration required).
11. **[Edge-4]** Add `SELECT FOR UPDATE` lock in `approve_leave_request` for the balance check.

---

## Metrics

- Type Coverage: ~90% (SQLAlchemy `Mapped[]` used throughout; `float` used instead of `Decimal` in some payroll calc paths is a minor inconsistency)
- Test Coverage: Not assessed (no new tests provided for the reviewed services)
- Linting Issues: 0 apparent syntax errors; unused import `date, time, Decimal` in `attendance_correction.py` (line 2-3, `Decimal` used in `_calc_hours` return, `date` and `time` used — all OK)

---

## Unresolved Questions

1. Is there a SOP document for resignation approval flow that specifies whether workspace-admin or HRM-role should gate the approve/reject actions? The two routers are inconsistent with each other.
2. Should attendance corrections with `attendance_record_id` pointing to a different `workspace_id` than the correction's `workspace_id` be rejected? There is no cross-workspace check in the correction service.
3. The `PAYROLL_TRANSITIONS` includes `"reviewed": ["approved"]` but `PayrollRecord.status` in the model comments says `"draft, approved, paid"` — is `"reviewed"` an intentional new intermediate status or a mismatch with older model docs?
4. Should OT requests be limited to N hours per day (e.g., VN Labor Law max 4h/day weekday OT)? No such cap exists in `OvertimeRequestCreate.planned_hours` other than `le=24`.
