# PRD -- HỆ THỐNG QUẢN LÝ HÀNH CHÍNH NHÂN SỰ (HCNS)

## 1. Tổng quan sản phẩm

### 1.1 Tên sản phẩm

Hệ thống Quản lý Hành chính -- Nhân sự nội bộ (Internal HR & Admin
Management System)

### 1.2 Mục tiêu sản phẩm

-   Chuẩn hóa 100% quy trình HCNS
-   Số hóa toàn bộ hồ sơ và biểu mẫu
-   Giảm 40--60% thao tác thủ công
-   Kiểm soát tuân thủ pháp lý
-   Sẵn sàng tích hợp ERP & AI Agent

------------------------------------------------------------------------

# 2. Phạm vi hệ thống

Hệ thống bao gồm 3 nhóm chính: 1. HR Core 2. Hành chính 3. Tuân thủ &
Quản trị

------------------------------------------------------------------------

# 3. Vai trò người dùng

  Vai trò        Quyền
  -------------- ----------------------------------
  HR Admin       Quản lý hồ sơ, tuyển dụng, lương
  HR Manager     Phê duyệt, báo cáo
  Line Manager   Đánh giá, phê duyệt
  Nhân viên      Self-service
  Kế toán        Truy xuất dữ liệu lương
  CEO            Dashboard chiến lược

------------------------------------------------------------------------

# 4. Functional Requirements

## I. HR CORE

### 4.1 Quản lý cơ cấu tổ chức

-   Org chart
-   Phòng ban
-   Vị trí & định biên
-   Headcount tracking

### 4.2 Tuyển dụng

-   Recruitment request form
-   Pipeline ứng viên
-   Lịch phỏng vấn
-   Offer management
-   Onboarding checklist

### 4.3 Hồ sơ nhân sự

-   Thông tin cá nhân
-   Hợp đồng
-   Lịch sử lương
-   Phân quyền & audit log

### 4.4 Chấm công & C&B

-   Chấm công
-   Tính lương tự động
-   BHXH, thuế
-   Phiếu lương

### 4.5 Performance

-   KPI/OKR setup
-   Review định kỳ
-   360 feedback

### 4.6 Đào tạo

-   Kế hoạch đào tạo
-   Quản lý ngân sách
-   Career path

### 4.7 Offboarding

-   Form xin nghỉ
-   Bàn giao
-   Exit interview

------------------------------------------------------------------------

## II. HÀNH CHÍNH

### 4.8 Quản lý tài sản

-   Gán tài sản
-   Theo dõi bảo trì
-   Kiểm kê

### 4.9 Mua sắm nội bộ

-   Đề xuất
-   Phê duyệt
-   Thanh toán

### 4.10 Quản lý văn bản

-   Soạn thảo
-   Trình ký
-   Lưu trữ

------------------------------------------------------------------------

## III. TUÂN THỦ

### 4.11 Chính sách & nội quy

-   Version control
-   Thông báo nội bộ

### 4.12 Pháp lý lao động

-   Hợp đồng
-   Theo dõi thời hạn
-   Báo cáo lao động

------------------------------------------------------------------------

# 5. FORM & TEMPLATE ENGINE

## 5.1 Mục tiêu

-   Chuẩn hóa biểu mẫu
-   Dynamic form builder
-   Gắn workflow tự động
-   Version control
-   E-signature
-   AI readable

## 5.2 Danh sách Form

### Tuyển dụng

-   Recruitment Request Form
-   Interview Evaluation Form
-   Offer Proposal Form

### Nhân sự

-   Employee Information Form
-   Leave Request Form
-   Overtime Request Form
-   Salary Advance Form

### Performance

-   KPI Setup Form
-   Performance Review Form

### Offboarding

-   Resignation Form
-   Handover Form
-   Exit Interview Form

### Hành chính

-   Purchase Request Form
-   Asset Allocation Form

------------------------------------------------------------------------

# 6. Workflow Engine

Trạng thái chung: Draft → Submitted → Approved → Rejected → Completed

-   SLA theo từng bước
-   Approval log
-   Notification tự động

------------------------------------------------------------------------

# 7. Non-Functional Requirements

-   RBAC bảo mật
-   Audit log đầy đủ
-   Response \< 2s
-   API mở
-   Microservice-ready

------------------------------------------------------------------------

# 8. AI Agent Integration

-   Nhắc hợp đồng sắp hết hạn
-   Phân tích tăng ca bất thường
-   Dự báo nhu cầu tuyển dụng
-   Phân tích lý do nghỉ việc

------------------------------------------------------------------------

# 9. Database (Core Tables)

-   employees
-   departments
-   forms
-   form_fields
-   form_submissions
-   workflow_instances
-   approval_logs
-   assets
-   payroll

------------------------------------------------------------------------

# 10. KPI thành công

-   100% quy trình số hóa
-   Giảm 60% Excel rời rạc
-   100% phê duyệt online
-   Giảm 30% sai sót tính lương

------------------------------------------------------------------------

# 11. Roadmap

Phase 1: - Hồ sơ nhân sự - Form engine cơ bản - Tuyển dụng

Phase 2: - Payroll & Performance - Asset management

Phase 3: - AI Agent layer - Advanced analytics

------------------------------------------------------------------------

Tài liệu này là nền tảng để triển khai hệ thống HCNS nội bộ hoặc phát
triển thành SaaS.
