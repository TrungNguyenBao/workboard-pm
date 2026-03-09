# Planner Report: HRM SOP Compliance

**Date:** 2026-03-09 | **Plan:** `plans/260309-1159-hrm-sop-compliance/`

## Summary

Created 3-phase implementation plan to bring 11 HRM SOPs from CRUD shells to full compliance.

### Phase 1 — Foundation (10h, P1)
- `hrm_role` column on WorkspaceMembership (hr_admin/hr_manager/line_manager/ceo)
- `require_hrm_role()` FastAPI dependency (workspace admins bypass)
- Employee model: +7 columns (DOB, address, national_id, bank_account_number, bank_name, phone, employee_status)
- Department: +code column
- Offer: +contract_type, +benefits (JSONB)
- RecruitmentRequest: +salary_range_min/max, default status -> draft
- Shared `validate_transition()` helper for inline status dicts

### Phase 2 — Business Logic (14h, P1)
- 6 transition maps wired into existing services (recruitment, offer, payroll, training, purchase, resignation)
- Payroll auto-calc: contract base_salary + attendance OT + vn_tax.py -> populate all fields
- OT rate constants (150%/200%/300%) added to vn_tax.py
- 2 new models: OvertimeRequest, AttendanceCorrection (both with approve/reject)
- Headcount validation on recruitment submission
- Leave balance validation before approval + auto-calc days
- Resignation completion -> employee.employee_status = "inactive"
- Threshold-based purchase approval (<5M/line_manager, <20M/hr_admin, >=20M/ceo)

### Phase 3 — Integration & UX (8h, P2)
- Email via ARQ worker + SMTP (graceful skip if unconfigured)
- HrmDocument model for file uploads (local disk, S3-ready path)
- DnD candidate pipeline (reuse @dnd-kit from PMS board)
- Visual org chart (CSS flexbox tree, no extra library)
- Interview model: +room, +panel_ids (JSONB)

## Key Architecture Decisions
1. Inline status dicts per service (not generic ApprovalRequest table) — matches CRM pattern, KISS
2. HR roles as column on existing WorkspaceMembership — avoids new table/JOINs
3. Workspace admins bypass HR role checks — consistent with existing RBAC hierarchy
4. OT rates as constants in vn_tax.py — extend existing pure-function module
5. Email via ARQ — existing worker infrastructure, no new dependencies

## File Counts
- **Phase 1:** 2 new files, 10 modified, 1 migration
- **Phase 2:** 8 new files, ~14 modified, 1 migration
- **Phase 3:** 8 new backend + 6 new frontend files, ~7 modified, 1 migration

## Unresolved Questions
1. SMTP provider for production (SendGrid, AWS SES, or self-hosted)? Affects `.env` config. Plan assumes generic SMTP.
2. File storage: local disk vs S3/MinIO from day 1? Plan uses local with S3-ready path structure.
3. Should existing `open` recruitment requests be migrated to `draft` via data migration? Plan keeps `open` valid with transition to `submitted`.
