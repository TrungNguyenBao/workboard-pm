# Phase 5: HRM Module Responsive

## Context
- [HRM pages](../../frontend/src/modules/hrm/features/)
- Depends on Phase 1 (shell) and Phase 2 (shared UI)
- 14 features

## Overview
- **Priority**: High
- **Status**: Completed
- **Description**: Make HRM module pages responsive. Most use PageHeader + DataTable. Focus on dashboard, detail pages, and form-heavy pages.

## Pages to Update

| Page | File | Changes Needed |
|------|------|----------------|
| HRM Dashboard | `hrm/features/dashboard/pages/hrm-dashboard.tsx` | Padding responsive, grid stacking |
| Employees List | `hrm/features/employees/pages/employees-list.tsx` | Phase 2 |
| Employee Detail | `hrm/features/employees/pages/employee-detail.tsx` | Tab layout + info grid stacking |
| Departments | `hrm/features/departments/pages/departments-list.tsx` | Phase 2 |
| Positions | `hrm/features/positions/pages/positions-list.tsx` | Phase 2 |
| Attendance | `hrm/features/attendance/pages/attendance-list.tsx` | Phase 2 |
| Leave Requests | `hrm/features/leave/pages/leave-requests-list.tsx` | Phase 2 |
| Payroll | `hrm/features/payroll/pages/payroll-list.tsx` | Phase 2 |
| Insurance | `hrm/features/payroll/pages/insurance-list.tsx` | Phase 2 |
| Performance Reviews | `hrm/features/performance/pages/reviews-list.tsx` | Phase 2 |
| KPIs | `hrm/features/performance/pages/kpi-list.tsx` | Phase 2 |
| Recruitment List | `hrm/features/recruitment/pages/recruitment-list.tsx` | Phase 2 |
| Recruitment Detail | `hrm/features/recruitment/pages/recruitment-detail.tsx` | Grid stacking |
| Training | `hrm/features/training/pages/training-list.tsx` | Phase 2 |
| Onboarding | `hrm/features/onboarding/pages/onboarding-list.tsx` | Phase 2 |
| Offboarding List | `hrm/features/offboarding/pages/offboarding-list.tsx` | Phase 2 |
| Offboarding Detail | `hrm/features/offboarding/pages/offboarding-detail.tsx` | Grid stacking |
| Assets | `hrm/features/assets/pages/assets-list.tsx` | Phase 2 |
| Procurement | `hrm/features/procurement/pages/procurement-list.tsx` | Phase 2 |

## Implementation Steps

1. **Dashboard**: `p-6` → `p-4 sm:p-6`, metric grids responsive
2. **Employee Detail**: info grid `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`, tab content responsive
3. **Recruitment Detail**: application stages/info stacking
4. **Offboarding Detail**: checklist layout responsive

## Todo List
- [x] Dashboard padding + grids
- [x] Employee detail responsive
- [x] Recruitment detail responsive
- [x] Offboarding detail responsive
- [x] Verify all HRM list pages with Phase 2 changes

## Success Criteria
- All HRM pages usable on 375px viewport
- Detail pages stack properly on mobile
- No content overflow
