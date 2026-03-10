# PRD – HỆ THỐNG QUẢN LÝ HÀNH CHÍNH NHÂN SỰ (HCNS)

## 1. Tổng quan sản phẩm

### 1.1 Tên sản phẩm

Hệ thống Quản lý Hành chính Nhân sự (Internal HR & Admin Management System)

### 1.2 Mục tiêu sản phẩm

- Chuẩn hóa 100% quy trình HCNS
- Số hóa toàn bộ hồ sơ và biểu mẫu
- Giảm 40-60% thao tác thủ công
- Kiểm soát tuân thủ pháp lý
- Sẵn sàng tích hợp ERP & AI Agent

### 1.3 Implementation Status

**FULLY IMPLEMENTED** - All core HR functions and 32 data models are production-ready.

---

# 2. Phạm vi hệ thống

Hệ thống bao gồm 3 nhóm chính:

1. **HR Core** - Employee lifecycle, recruitment, leave, attendance, payroll, performance
2. **Administration** - Asset management, procurement, documents
3. **Compliance & Governance** - Policies, legal compliance, labor reporting

---

# 3. Vai trò người dùng

| Vai trò       | Quyền                                                |
| ------------- | ---------------------------------------------------- |
| HR Admin      | Full access (employees, recruitment, payroll, etc.)  |
| HR Manager    | Approval workflows, team reports, analytics          |
| Line Manager  | Team reviews, leave approval, KPI assignments        |
| Employee      | Self-service (leave requests, profile view, etc.)    |
| Accountant    | Payroll records, salary history, insurance data      |
| CEO/Director  | Strategic dashboard, org charts, analytics           |

---

# 4. Core Data Models (32 Implemented)

## 4.1 Employee

**Mô tả**: Employee master record with personal info.

| Field               | Type      | Description                              |
| ------------------- | --------- | ---------------------------------------- |
| id                  | UUID      | Employee ID                              |
| user_id             | UUID      | Associated user account                  |
| name                | String    | Tên nhân viên                            |
| email               | String    | Email cá nhân/công ty                    |
| department_id       | UUID      | Department assignment                    |
| position            | String    | Chức vụ                                  |
| hire_date           | Date      | Ngày vào làm                             |
| date_of_birth       | Date      | Ngày sinh                                |
| address             | String    | Địa chỉ hiện tại                         |
| national_id         | String    | Số CMND/CCCD                             |
| bank_account_number | String    | Số tài khoản ngân hàng                   |
| bank_name           | String    | Tên ngân hàng                            |
| phone               | String    | Số điện thoại                            |
| employee_status     | Enum      | active, inactive, probation              |
| workspace_id        | UUID      | Workspace ID                             |

---

## 4.2 Department

**Mô tả**: Hierarchical department structure.

| Field                | Type      | Description              |
| -------------------- | --------- | ------------------------ |
| id                   | UUID      | Department ID            |
| name                 | String    | Tên phòng ban             |
| code                 | String    | Mã phòng ban              |
| description          | Text      | Mô tả chức năng           |
| parent_department_id | UUID      | Parent department (tree)  |
| manager_id           | UUID      | Department head           |
| workspace_id         | UUID      | Workspace ID             |

---

## 4.3 Position

**Mô tả**: Job positions and headcount management.

| Field            | Type      | Description          |
| ---------------- | --------- | -------------------- |
| id               | UUID      | Position ID          |
| title            | String    | Tên vị trí           |
| department_id    | UUID      | Home department      |
| headcount_limit  | Integer   | Định biên             |
| description      | Text      | Mô tả công việc       |
| is_active        | Boolean   | Đang tuyển hay không  |
| workspace_id     | UUID      | Workspace ID         |

---

## 4.4 Contract

**Mô tả**: Employment contracts with salary info.

| Field             | Type      | Description                |
| ----------------- | --------- | -------------------------- |
| id                | UUID      | Contract ID                |
| employee_id       | UUID      | Associated employee        |
| contract_type     | Enum      | probation, fixed_term, indefinite |
| start_date        | Date      | Ngày bắt đầu               |
| end_date          | Date      | Ngày kết thúc              |
| base_salary       | Float     | Lương cơ bản (VND)         |
| allowances        | JSONB     | Phụ cấp chi tiết (JSON)    |
| status            | Enum      | active, expired, terminated |
| file_url          | String    | Scanned contract document  |
| notes             | Text      | Ghi chú                    |

---

## 4.5 LeaveRequest

**Mô tả**: Leave/vacation requests with approval workflow.

| Field        | Type      | Description                   |
| ------------ | --------- | ----------------------------- |
| id           | UUID      | Leave Request ID              |
| employee_id  | UUID      | Requesting employee           |
| leave_type_id| UUID      | Type of leave (annual, sick)  |
| start_date   | Date      | Ngày bắt đầu nghỉ             |
| end_date     | Date      | Ngày kết thúc nghỉ            |
| days         | Integer   | Số ngày nghỉ                  |
| status       | Enum      | pending, approved, rejected   |
| reviewed_by_id | UUID    | Approver (manager)            |

---

## 4.6 LeaveType

**Mô tả**: Leave types (annual, sick, unpaid, maternity).

| Field             | Type      | Description               |
| ----------------- | --------- | ------------------------- |
| id                | UUID      | Leave Type ID             |
| name              | String    | Tên loại nghỉ             |
| description       | Text      | Mô tả chính sách           |
| max_days_per_year | Integer   | Tối đa ngày/năm           |

---

## 4.7 AttendanceRecord

**Mô tả**: Daily attendance tracking.

| Field         | Type      | Description                                      |
| ------------- | --------- | ------------------------------------------------ |
| id            | UUID      | Attendance Record ID                             |
| employee_id   | UUID      | Employee                                         |
| date          | Date      | Ngày công                                        |
| check_in      | Time      | Giờ vào                                          |
| check_out     | Time      | Giờ ra                                           |
| status        | Enum      | present, absent, late, half_day, holiday, leave |
| total_hours   | Float     | Tổng giờ làm                                     |
| overtime_hours| Float     | Giờ tăng ca                                      |

---

## 4.8 AttendanceCorrection

**Mô tả**: Corrections/disputes on attendance records.

| Field                 | Type      | Description              |
| --------------------- | --------- | ------------------------ |
| id                    | UUID      | Correction ID            |
| attendance_record_id  | UUID      | Associated record        |
| reason                | String    | Lý do chỉnh sửa          |
| requested_by          | UUID      | Employee requesting fix  |
| approved_by           | UUID      | Manager approval         |
| status                | Enum      | pending, approved        |

---

## 4.9 OvertimeRequest

**Mô tả**: Overtime requests and approval.

| Field       | Type      | Description        |
| ----------- | --------- | ------------------ |
| id          | UUID      | Overtime Request ID |
| employee_id | UUID      | Employee           |
| date        | Date      | Ngày tăng ca        |
| hours       | Float     | Số giờ tăng ca      |
| reason      | String    | Lý do tăng ca       |
| status      | Enum      | pending, approved   |

---

## 4.10 RecruitmentRequest

**Mô tả**: Recruitment requisitions.

| Field            | Type      | Description                    |
| ---------------- | --------- | ------------------------------ |
| id               | UUID      | Recruitment Request ID         |
| title            | String    | Vị trí tuyển dụng              |
| department_id    | UUID      | Department requesting          |
| position_id      | UUID      | Associated position            |
| quantity         | Integer   | Số lượng cần tuyển              |
| reason           | String    | Lý do tuyển dụng               |
| requirements     | Text      | Yêu cầu công việc              |
| deadline         | Date      | Hạn chót nhận hồ sơ            |
| status           | Enum      | draft, open, closed, cancelled |
| salary_range_min | Float     | Mức lương tối thiểu (VND)      |
| salary_range_max | Float     | Mức lương tối đa (VND)         |
| requester_id     | UUID      | Person requesting              |

---

## 4.11 Candidate

**Mô tả**: Job applicants and candidates.

| Field                | Type      | Description                           |
| -------------------- | --------- | ------------------------------------- |
| id                   | UUID      | Candidate ID                          |
| recruitment_request_id | UUID    | Associated recruitment request        |
| name                 | String    | Tên ứng viên                          |
| email                | String    | Email liên hệ                         |
| phone                | String    | Số điện thoại                         |
| resume_url           | String    | CV file URL                           |
| status               | Enum      | applied, interviewed, offered, hired, rejected |
| notes                | Text      | Ghi chú kết quả phỏng vấn              |

---

## 4.12 Interview

**Mô tả**: Interview scheduling and feedback.

| Field          | Type      | Description                    |
| -------------- | --------- | ------------------------------ |
| id             | UUID      | Interview ID                   |
| candidate_id   | UUID      | Candidate being interviewed    |
| interviewer_id | UUID      | Primary interviewer            |
| scheduled_at   | DateTime  | Thời gian phỏng vấn             |
| duration_minutes | Integer | Thời lượng (phút)              |
| feedback       | Text      | Đánh giá chi tiết              |
| score          | Float     | Điểm số (0-10)                 |
| status         | Enum      | scheduled, completed, no_show  |
| room           | String    | Phòng họp                      |
| panel_ids      | JSONB     | Multiple interviewers list     |

---

## 4.13 Offer

**Mô tả**: Job offer management.

| Field            | Type      | Description           |
| ---------------- | --------- | --------------------- |
| id               | UUID      | Offer ID              |
| candidate_id     | UUID      | Target candidate      |
| title            | String    | Vị trí được đề nghị    |
| job_description  | Text      | Mô tả công việc        |
| location         | String    | Địa điểm làm việc      |
| salary           | Float     | Mức lương đề nghị (VND)|
| benefits_package | Text      | Chi tiết phúc lợi      |
| status           | Enum      | draft, extended, accepted, rejected |
| expiration_date  | Date      | Hạn chót chấp nhận     |

---

## 4.14 PerformanceReview

**Mô tả**: Periodic performance evaluations.

| Field           | Type      | Description        |
| --------------- | --------- | ------------------ |
| id              | UUID      | Review ID          |
| employee_id     | UUID      | Employee reviewed  |
| reviewer_id     | UUID      | Manager/reviewer   |
| period          | String    | YYYY-MM (e.g., 2024-Q1) |
| overall_score   | Float     | Điểm tổng thể (0-10) |
| status          | Enum      | draft, completed   |
| comments        | Text      | Nhận xét chung      |

---

## 4.15 ReviewFeedback

**Mô tả**: Competency-based feedback within reviews.

| Field                | Type      | Description           |
| -------------------- | --------- | --------------------- |
| id                   | UUID      | Feedback ID           |
| performance_review_id| UUID      | Associated review     |
| competency           | String    | Năng lực đánh giá      |
| score                | Float     | Điểm (0-10)           |
| comments             | Text      | Nhân xét chi tiết      |

---

## 4.16 KpiTemplate

**Mô tả**: KPI metric templates.

| Field        | Type      | Description       |
| ------------ | --------- | ----------------- |
| id           | UUID      | Template ID       |
| name         | String    | Tên KPI           |
| description  | Text      | Định nghĩa        |
| metric_type  | String    | revenue, quality, time, etc. |
| target_value | Float     | Giá trị mục tiêu   |

---

## 4.17 KpiAssignment

**Mô tả**: KPI assignments to employees.

| Field        | Type      | Description          |
| ------------ | --------- | -------------------- |
| id           | UUID      | Assignment ID        |
| employee_id  | UUID      | Assigned employee    |
| kpi_template_id | UUID   | KPI being assigned   |
| period       | String    | YYYY-Q (e.g., 2024-Q1) |
| target_value | Float     | Target for period    |
| actual_value | Float     | Actual achievement   |
| status       | Enum      | open, completed      |

---

## 4.18 TrainingProgram

**Mô tả**: Training programs and courses.

| Field         | Type      | Description              |
| ------------- | --------- | ------------------------ |
| id            | UUID      | Program ID               |
| title         | String    | Tên khóa học              |
| description   | Text      | Nội dung khóa học         |
| category      | String    | Loại (technical, soft)   |
| duration_hours| Integer   | Thời lượng (giờ)          |
| cost          | Float     | Chi phí (VND)             |
| start_date    | Date      | Ngày bắt đầu              |
| end_date      | Date      | Ngày kết thúc             |
| status        | Enum      | draft, active, completed |

---

## 4.19 TrainingEnrollment

**Mô tả**: Employee enrollment in training programs.

| Field              | Type      | Description              |
| ------------------ | --------- | ------------------------ |
| id                 | UUID      | Enrollment ID            |
| employee_id        | UUID      | Enrolled employee        |
| training_program_id| UUID      | Training program         |
| enrollment_date    | Date      | Ngày ghi danh             |
| completion_date    | Date      | Ngày hoàn thành           |
| status             | Enum      | enrolled, in_progress, completed, dropped |
| certificate_url    | String    | Certificate file URL     |

---

## 4.20 PayrollRecord

**Mô tả**: Monthly payroll records.

| Field         | Type      | Description          |
| ------------- | --------- | -------------------- |
| id            | UUID      | Payroll Record ID    |
| employee_id   | UUID      | Employee             |
| period        | String    | YYYY-MM              |
| gross_salary  | Float     | Lương bruto (VND)    |
| deductions    | Float     | Tổng khấu trừ (VND)  |
| net_salary    | Float     | Lương ròng (VND)     |
| status        | Enum      | draft, approved, paid |

---

## 4.21 SalaryHistory

**Mô tả**: Track salary changes over time.

| Field           | Type      | Description           |
| --------------- | --------- | --------------------- |
| id              | UUID      | History Entry ID      |
| employee_id     | UUID      | Employee              |
| effective_date  | Date      | Ngày hiệu lực         |
| salary          | Float     | New salary (VND)      |
| reason          | String    | Lý do thay đổi (raise, promotion) |
| approved_by     | UUID      | Approver              |

---

## 4.22 InsuranceRecord

**Mô tả**: Employee insurance (health, social, unemployment).

| Field           | Type      | Description              |
| --------------- | --------- | ------------------------ |
| id              | UUID      | Insurance Record ID      |
| employee_id     | UUID      | Employee                 |
| insurance_type  | String    | health, social, unemployment |
| policy_number   | String    | Mã chứng chỉ bảo hiểm    |
| provider        | String    | Nhà cung cấp             |
| coverage_amount | Float     | Mức bảo hiểm (VND)       |
| start_date      | Date      | Ngày bắt đầu             |
| end_date        | Date      | Ngày kết thúc            |
| status          | Enum      | active, expired          |

---

## 4.23 Asset

**Mô tả**: Company assets (laptops, phones, etc.).

| Field          | Type      | Description          |
| -------------- | --------- | -------------------- |
| id             | UUID      | Asset ID             |
| name           | String    | Tên tài sản           |
| asset_type     | String    | laptop, phone, etc.  |
| serial_number  | String    | Mã serial/model       |
| purchase_date  | Date      | Ngày mua              |
| cost           | Float     | Giá mua (VND)         |
| status         | Enum      | available, assigned, retired |

---

## 4.24 AssetAssignment

**Mô tả**: Track asset assignments to employees.

| Field         | Type      | Description          |
| ------------- | --------- | -------------------- |
| id            | UUID      | Assignment ID        |
| asset_id      | UUID      | Asset                |
| employee_id   | UUID      | Assigned to          |
| assignment_date | Date    | Ngày giao             |
| return_date   | Date      | Ngày trả (nếu có)     |
| condition     | String    | Tình trạng khi nhận  |
| notes         | Text      | Ghi chú khác          |

---

## 4.25 OnboardingChecklist

**Mô tả**: Employee onboarding tasks.

| Field           | Type      | Description          |
| --------------- | --------- | -------------------- |
| id              | UUID      | Checklist ID         |
| employee_id     | UUID      | New employee         |
| task_list       | JSONB     | Tasks array (JSON)   |
| completion_date | Date      | Ngày hoàn thành      |
| status          | Enum      | draft, in_progress, completed |

---

## 4.26 Resignation

**Mô tả**: Employee resignations and offboarding initiation.

| Field            | Type      | Description          |
| ---------------- | --------- | -------------------- |
| id               | UUID      | Resignation ID       |
| employee_id      | UUID      | Resigning employee   |
| resignation_date | Date      | Ngày xin nghỉ        |
| effective_date   | Date      | Ngày cuối cùng        |
| reason           | Text      | Lý do từ chức        |
| status           | Enum      | pending, approved, completed |

---

## 4.27 Handover

**Mô tả**: Task handover during offboarding.

| Field                | Type      | Description          |
| -------------------- | --------- | -------------------- |
| id                   | UUID      | Handover ID          |
| resigning_employee_id| UUID      | Employee leaving     |
| new_employee_id      | UUID      | New owner            |
| task_list            | Text      | Tasks to handover    |
| completion_date      | Date      | Ngày hoàn thành      |

---

## 4.28 ExitInterview

**Mô tả**: Exit interview feedback.

| Field             | Type      | Description        |
| ----------------- | --------- | ------------------ |
| id                | UUID      | Interview ID       |
| employee_id       | UUID      | Departing employee |
| interviewer_id    | UUID      | HR conducting      |
| date              | Date      | Ngày phỏng vấn     |
| feedback          | Text      | Nhận xét chi tiết  |
| overall_satisfaction | Float  | Đánh giá (0-10)   |

---

## 4.29 HrmDocument

**Mô tả**: HR documents and file storage.

| Field           | Type      | Description          |
| --------------- | --------- | -------------------- |
| id              | UUID      | Document ID          |
| employee_id     | UUID      | Associated employee  |
| document_type   | String    | CV, contract, etc.   |
| file_url        | String    | S3/Cloud storage URL |
| upload_date     | DateTime  | Ngày tải lên         |

---

## 4.30 PurchaseRequest

**Mô tả**: Internal purchase requisitions.

| Field          | Type      | Description           |
| -------------- | --------- | --------------------- |
| id             | UUID      | Request ID            |
| requester_id   | UUID      | Employee requesting   |
| title          | String    | Tiêu đề yêu cầu       |
| description    | Text      | Chi tiết yêu cầu      |
| total_amount   | Float     | Tổng tiền (VND)       |
| status         | Enum      | draft, submitted, approved, completed |

---

## 4.31 PurchaseItem

**Mô tả**: Line items within purchase requests.

| Field              | Type      | Description       |
| ------------------ | --------- | ----------------- |
| id                 | UUID      | Item ID           |
| purchase_request_id| UUID      | Parent request    |
| item_name          | String    | Tên mặt hàng       |
| quantity           | Integer   | Số lượng           |
| unit_price         | Float     | Đơn giá (VND)      |
| status             | Enum      | pending, approved  |

---

## 4.32 WorkspaceSettings (HRM-specific)

**Mô tả**: HR configuration per workspace.

| Field                    | Type      | Description              |
| ------------------------ | --------- | ------------------------ |
| id                       | UUID      | Setting ID               |
| workspace_id             | UUID      | Workspace               |
| vacation_days_per_year   | Integer   | Annual leave policy      |
| sick_leave_days_per_year | Integer   | Sick leave policy        |
| standard_work_hours      | Float     | Daily hours (e.g., 8)    |
| currency                 | String    | VND                      |

---

# 5. API Endpoints

## Employee Management

```
GET    /api/v1/hrm/employees                 # List employees
POST   /api/v1/hrm/employees                 # Create employee
GET    /api/v1/hrm/employees/{id}            # Get detail
PUT    /api/v1/hrm/employees/{id}            # Update employee
DELETE /api/v1/hrm/employees/{id}            # Delete employee
GET    /api/v1/hrm/employees/{id}/detail     # Full profile with contracts
```

## Department Management

```
GET    /api/v1/hrm/departments               # List departments
POST   /api/v1/hrm/departments               # Create department
GET    /api/v1/hrm/departments/{id}          # Get detail
PUT    /api/v1/hrm/departments/{id}          # Update department
DELETE /api/v1/hrm/departments/{id}          # Delete department
GET    /api/v1/hrm/departments/tree          # Hierarchical org chart
GET    /api/v1/hrm/departments/{id}/headcount # Headcount stats
```

## Position Management

```
GET    /api/v1/hrm/positions                 # List positions
POST   /api/v1/hrm/positions                 # Create position
GET    /api/v1/hrm/positions/{id}            # Get detail
PUT    /api/v1/hrm/positions/{id}            # Update position
DELETE /api/v1/hrm/positions/{id}            # Delete position
```

## Contract Management

```
GET    /api/v1/hrm/contracts                 # List contracts
POST   /api/v1/hrm/contracts                 # Create contract
GET    /api/v1/hrm/contracts/{id}            # Get detail
PUT    /api/v1/hrm/contracts/{id}            # Update contract
GET    /api/v1/hrm/salary-history            # Salary change history
```

## Leave Management

```
GET    /api/v1/hrm/leave-requests            # List leave requests
POST   /api/v1/hrm/leave-requests            # Create request
GET    /api/v1/hrm/leave-requests/{id}       # Get detail
PUT    /api/v1/hrm/leave-requests/{id}       # Update request
POST   /api/v1/hrm/leave-requests/{id}/approve # Manager approval
POST   /api/v1/hrm/leave-requests/{id}/reject  # Manager rejection
GET    /api/v1/hrm/leave-types               # Leave types list
```

## Attendance Management

```
GET    /api/v1/hrm/attendance-records        # List records
POST   /api/v1/hrm/attendance-records        # Create record
GET    /api/v1/hrm/attendance-records/{id}   # Get detail
PUT    /api/v1/hrm/attendance-records/{id}   # Update record
GET    /api/v1/hrm/attendance-records/summary # Monthly summary
POST   /api/v1/hrm/attendance-corrections    # Request correction
POST   /api/v1/hrm/attendance-corrections/{id}/approve # Approve correction
POST   /api/v1/hrm/attendance-corrections/{id}/reject  # Reject correction
```

## Overtime Management

```
GET    /api/v1/hrm/overtime-requests         # List overtime
POST   /api/v1/hrm/overtime-requests         # Create request
PUT    /api/v1/hrm/overtime-requests/{id}    # Update request
```

## Recruitment Management

```
GET    /api/v1/hrm/recruitment-requests      # List requisitions
POST   /api/v1/hrm/recruitment-requests      # Create request
GET    /api/v1/hrm/recruitment-requests/{id} # Get detail
PUT    /api/v1/hrm/recruitment-requests/{id} # Update request
GET    /api/v1/hrm/candidates                # List candidates
POST   /api/v1/hrm/candidates                # Create candidate
GET    /api/v1/hrm/candidates/{id}           # Get detail
PUT    /api/v1/hrm/candidates/{id}           # Update candidate
POST   /api/v1/hrm/candidates/{id}/move      # Move in pipeline
```

## Interview Management

```
GET    /api/v1/hrm/interviews                # List interviews
POST   /api/v1/hrm/interviews                # Create interview
GET    /api/v1/hrm/interviews/{id}           # Get detail
PUT    /api/v1/hrm/interviews/{id}           # Update interview
```

## Offer Management

```
GET    /api/v1/hrm/offers                    # List offers
POST   /api/v1/hrm/offers                    # Create offer
GET    /api/v1/hrm/offers/{id}               # Get detail
PUT    /api/v1/hrm/offers/{id}               # Update offer
```

## Performance Management

```
GET    /api/v1/hrm/performance-reviews       # List reviews
POST   /api/v1/hrm/performance-reviews       # Create review
GET    /api/v1/hrm/performance-reviews/{id}  # Get detail
PUT    /api/v1/hrm/performance-reviews/{id}  # Update review
GET    /api/v1/hrm/kpi-templates             # List KPI templates
GET    /api/v1/hrm/kpi-assignments           # List KPI assignments
POST   /api/v1/hrm/kpi-assignments           # Assign KPI
PUT    /api/v1/hrm/kpi-assignments/{id}      # Update KPI assignment
```

## Training Management

```
GET    /api/v1/hrm/training-programs         # List programs
POST   /api/v1/hrm/training-programs         # Create program
GET    /api/v1/hrm/training-programs/{id}    # Get detail
PUT    /api/v1/hrm/training-programs/{id}    # Update program
GET    /api/v1/hrm/training-enrollments      # List enrollments
POST   /api/v1/hrm/training-enrollments      # Create enrollment
PUT    /api/v1/hrm/training-enrollments/{id} # Update enrollment
```

## Payroll Management

```
GET    /api/v1/hrm/payroll-records           # List payroll records
POST   /api/v1/hrm/payroll-records           # Create payroll
GET    /api/v1/hrm/payroll-records/{id}      # Get detail
PUT    /api/v1/hrm/payroll-records/{id}      # Update payroll
```

## Insurance Management

```
GET    /api/v1/hrm/insurance-records         # List insurance
POST   /api/v1/hrm/insurance-records         # Create record
GET    /api/v1/hrm/insurance-records/{id}    # Get detail
PUT    /api/v1/hrm/insurance-records/{id}    # Update record
```

## Asset Management

```
GET    /api/v1/hrm/assets                    # List assets
POST   /api/v1/hrm/assets                    # Create asset
GET    /api/v1/hrm/assets/{id}               # Get detail
PUT    /api/v1/hrm/assets/{id}               # Update asset
GET    /api/v1/hrm/asset-assignments         # List assignments
POST   /api/v1/hrm/asset-assignments         # Create assignment
PUT    /api/v1/hrm/asset-assignments/{id}    # Update assignment
```

## Onboarding

```
GET    /api/v1/hrm/onboarding-checklists     # List checklists
POST   /api/v1/hrm/onboarding-checklists     # Create checklist
PUT    /api/v1/hrm/onboarding-checklists/{id} # Update checklist
```

## Offboarding

```
GET    /api/v1/hrm/resignations              # List resignations
POST   /api/v1/hrm/resignations              # Create resignation
PUT    /api/v1/hrm/resignations/{id}         # Update resignation
GET    /api/v1/hrm/handovers                 # List handovers
POST   /api/v1/hrm/handovers                 # Create handover
PUT    /api/v1/hrm/handovers/{id}            # Update handover
GET    /api/v1/hrm/exit-interviews           # List exit interviews
POST   /api/v1/hrm/exit-interviews           # Create interview
PUT    /api/v1/hrm/exit-interviews/{id}      # Update interview
```

## Procurement

```
GET    /api/v1/hrm/purchase-requests         # List requests
POST   /api/v1/hrm/purchase-requests         # Create request
GET    /api/v1/hrm/purchase-requests/{id}    # Get detail
PUT    /api/v1/hrm/purchase-requests/{id}    # Update request
```

## Documents

```
GET    /api/v1/hrm/documents                 # List documents
POST   /api/v1/hrm/documents                 # Upload document
GET    /api/v1/hrm/documents/{id}            # Get document
DELETE /api/v1/hrm/documents/{id}            # Delete document
```

---

# 6. Frontend Pages (23+)

| Page                           | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| HRM Dashboard                  | Strategic KPIs, org chart, analytics       |
| Employees List                 | Search, create, view employees             |
| Employee Detail                | Profile, contracts, salary history         |
| Departments List               | Department management                      |
| Departments Org Chart           | Visual organizational hierarchy             |
| Positions List                 | Position and headcount management          |
| Leave Requests List            | Manage and approve leave                   |
| Attendance List                | Daily attendance tracking                  |
| Attendance Summary             | Monthly summary and corrections            |
| Recruitment List               | Manage job requisitions                    |
| Recruitment Detail             | Requisition with linked candidates         |
| Candidate Pipeline             | Kanban: Applied → Interviewed → Offered → Hired |
| Interview Management           | Schedule and record interviews             |
| Offers Management              | Create and track job offers                |
| Performance Reviews            | Create and manage reviews                  |
| KPI Management                 | Assign and track KPIs                      |
| Training List                  | Browse and enroll in training              |
| Payroll List                   | View and manage payroll records            |
| Insurance List                 | Manage insurance records                   |
| Assets List                    | Track company assets                       |
| Assets Assignments             | Manage asset allocations                   |
| Onboarding List                | Track new employee onboarding              |
| Offboarding List               | Manage resignations and exit process       |
| Procurement List               | Purchase requests and approvals            |

---

# 7. Key Features Implemented

## Employee Lifecycle

* **Recruitment**: Job requests → Candidates → Interviews → Offers → Hire
* **Onboarding**: Checklist tasks, asset assignment, orientation
* **Active Employment**: Profile, contracts, leave, attendance, training
* **Offboarding**: Resignation request → Handover → Exit interview → Archive

## Leave & Attendance

* Leave request workflow (employee → manager approval)
* Annual/sick/maternity leave types with policy
* Daily attendance tracking (check-in/out, status)
* Monthly attendance summary reports
* Attendance correction workflow
* Overtime request tracking

## Recruitment Pipeline

* Recruitment requisitions (open, in-progress, closed)
* Candidate pipeline (applied → interviewed → offered → hired/rejected)
* Interview scheduling with panel support
* Job offers with salary and benefits
* Candidate notes and evaluation tracking

## Performance Management

* Periodic performance reviews (quarterly/annual)
* Competency-based feedback scoring
* KPI templates and assignments per period
* KPI actual value tracking
* Review completion workflows

## Training & Development

* Training program management (category, cost, duration)
* Employee enrollment in programs
* Completion tracking and certificates
* Career path planning

## Compensation & Benefits

* Contract management (type, salary, allowances, duration)
* Salary history tracking with change reasons
* Payroll record generation (gross, deductions, net)
* Insurance record management (health, social, unemployment)

## Assets & Procurement

* Asset tracking (type, serial number, cost, status)
* Asset assignment to employees with condition notes
* Return and maintenance tracking
* Internal purchase requests with approval
* Purchase items line tracking

## Organizational Structure

* Hierarchical department tree
* Position definitions with headcount limits
* Department headcount tracking
* Manager assignments

## Compliance & Documentation

* Employee documents storage (CV, contracts, etc.)
* Audit log of all changes
* Resignation and offboarding workflow
* Exit interviews and feedback
* Policy acknowledgment tracking

---

# 8. Candidate Pipeline Workflow

```
Recruitment Request Created
    ↓
Job Opening Posted
    ↓
Candidates Applied
    ↓
Candidates Interviewed (interview records + scores)
    ↓
Offers Extended
    ↓
Offer Accepted
    ↓
Employee Created & Onboarded
```

---

# 9. Employee Status Flow

```
Prospective (Offer Pending)
    ↓
Active (Probation / Regular / Contract)
    ↓
Inactive (Left, Retired, Suspended)
```

---

# 10. Role-Based Permissions

| Feature                | HR Admin | HR Manager | Line Mgr | Employee | Accountant |
| ---------------------- | -------- | ---------- | -------- | -------- | ---------- |
| Employee CRUD          | Yes      | No         | No       | No       | No         |
| Approve leave          | Yes      | Yes        | Yes      | No       | No         |
| View payroll           | Yes      | Yes        | No       | Own only | Yes        |
| Recruitment            | Yes      | Yes        | No       | No       | No         |
| Performance reviews    | Yes      | Yes        | Yes      | Own only | No         |
| Training enrollment    | Yes      | Yes        | No       | Yes      | No         |
| Org chart              | Yes      | Yes        | Yes      | Yes      | No         |

---

# 11. Success Metrics

- 100% quy trình số hóa
- Giảm 60% Excel rời rạc
- 100% phê duyệt online
- Giảm 30% sai sót tính lương
- Data completeness > 95%

---

# 12. Future Enhancements

* AI agent for contract expiry alerts
* Anomaly detection for unusual overtime
* Recruitment demand forecasting (ML-based)
* Attrition analysis and predictive models
* Advanced analytics dashboards
* Integration with accounting system
* E-signature on contracts
* Mobile app for employees

---

# End of Document
