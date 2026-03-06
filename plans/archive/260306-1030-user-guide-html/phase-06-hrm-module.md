# Phase 6: HRM Module Guide

## Priority: High | Status: Pending

## Overview
Comprehensive guide for the largest module — Human Resource Management. Covers 15+ feature areas.

## Content Outline

### 6.1 HRM Dashboard (`/hrm/dashboard`)
- KPI cards: Employees, Departments, Pending Leave, Payroll Records
- Bar chart: Employees by Department

### 6.2 Employees (`/hrm/employees`)
- Searchable table; create/edit via form
- Employee Detail page (4 tabs): Info, Contracts, Salary History, Leave
- Leave balance display (by type: used/total/remaining)

### 6.3 Departments (`/hrm/departments`)
- Table with search; create/edit
- Org chart tree view (if wired up)

### 6.4 Positions (`/hrm/positions`)
- Job positions table; create/edit

### 6.5 Leave Management (`/hrm/leave`)
- Leave types management (create custom types)
- Leave requests: create, view, filter
- Approve/reject workflow (admin/manager)

### 6.6 Payroll (`/hrm/payroll`)
- Payroll records management

### 6.7 Insurance (`/hrm/insurance`)
- Insurance records management

### 6.8 Attendance (`/hrm/attendance`)
- Attendance logging; summary cards

### 6.9 Recruitment (`/hrm/recruitment`)
- Recruitment requests (job openings) with status filter
- Detail page: candidate pipeline
  - Add candidates; move through stages: Screening → Interviewing → Offered → Hired/Rejected
  - Schedule interviews; record feedback with scores
  - Make offers: send, accept, reject

### 6.10 Onboarding (`/hrm/onboarding`)
- Per-employee checklists grouped by category
- "Generate Defaults" creates standard checklist
- Check off items as completed

### 6.11 Performance — KPI Tracking (`/hrm/performance`)
- KPI Templates: create/edit/delete (name, category, unit)
- KPI Assignments: assign to employees with target, period
- Progress tracking (% of target), status filter

### 6.12 Performance Reviews (`/hrm/reviews`)
- Review cycles; create review
- Submit feedback per employee

### 6.13 Training & Development (`/hrm/training`)
- Two tabs: Programs | Enrollments
- Programs: create with trainer, dates, budget
- Enrollments: assign employees, track completion/scores

### 6.14 Offboarding (`/hrm/offboarding`)
- Resignation requests; detail page
- Handover tasks: assign, track, mark complete
- Exit interview: create, record feedback

### 6.15 Assets (`/hrm/assets`)
- Company asset catalog (name, category, serial, value, status)
- Status: available/assigned/maintenance/retired
- Assign asset to employee (when available)

### 6.16 Procurement (`/hrm/procurement`)
- Purchase requests with workflow:
  Draft → Submit → Approve/Reject → Ordered → Completed
- Create/edit drafts; admin approval actions

## Implementation Steps
1. Write HTML for 6.1–6.16
2. Use workflow diagrams (CSS-styled step indicators) for recruitment pipeline and procurement
3. Admin badge on approval workflows (leave, procurement)
4. Group related features: Core HR (2-4), Time & Attendance (5,8), Compensation (6,7), Talent (9-13), Exit (14), Assets (15-16)

## Success Criteria
- All 15+ HRM features documented
- Recruitment pipeline workflow clear
- Approval workflows explained with role requirements
