# Phase 2: Vietnamese Translation — All Sections

## Priority: High | Status: Pending

## Overview
Translate all user guide content into Vietnamese and inject as `class="lang-vi"` divs alongside existing EN content. Use natural, professional Vietnamese appropriate for enterprise software documentation.

## Translation Sections

### 1. Getting Started → Bắt Đầu
- Welcome / giới thiệu A-ERP (4 module: PMS, WMS, HRM, CRM)
- Tạo tài khoản: /register — Họ tên, Email, Mật khẩu
- Đăng nhập: /login → chuyển đến Công việc của tôi
- Cài đặt lần đầu: tạo không gian làm việc
- Điều hướng: thanh bên, thanh trên, chuyển module
- Ngôn ngữ: Tiếng Anh / Tiếng Việt

### 2. Workspace & Admin → Không gian làm việc & Quản trị
- Quản lý không gian làm việc: chuyển đổi, đổi tên, tạo mới
- Trang thành viên (/members) [Admin]
- Vai trò trong không gian làm việc: Quản trị viên, Thành viên, Khách
- Vai trò trong dự án: Chủ sở hữu, Biên tập viên, Người bình luận, Người xem
- Permission matrix tables (translated headers + values)

### 3. PMS Module → Quản lý Dự án (PMS)
- Bảng điều khiển PMS
- Công việc của tôi
- Tạo dự án
- Chế độ xem Bảng Kanban
- Chế độ xem Danh sách
- Chế độ xem Lịch
- Chế độ xem Dòng thời gian
- Tổng quan dự án
- Chi tiết công việc (ngăn kéo)
- Mục tiêu
- Cài đặt dự án [Admin/Chủ sở hữu]

### 4. WMS Module → Quản lý Kho hàng (WMS)
- Bảng điều khiển WMS
- Sản phẩm, Kho hàng, Hàng tồn kho, Thiết bị, Nhà cung cấp

### 5. HRM Module → Quản lý Nhân sự (HRM)
**Nhân sự cốt lõi:**
- Bảng điều khiển HRM, Nhân viên, Phòng ban, Vị trí

**Thời gian & Chuyên cần:**
- Quản lý nghỉ phép, Chấm công

**Thù lao:**
- Bảng lương, Bảo hiểm

**Quản lý tài năng:**
- Tuyển dụng (pipeline ứng viên), Hội nhập, KPI, Đánh giá, Đào tạo

**Nghỉ việc & Tài sản:**
- Bàn giao, Tài sản công ty, Mua sắm

### 6. CRM Module → Quản lý Khách hàng (CRM)
- Bảng điều khiển CRM
- Liên hệ, Thương vụ (pipeline giai đoạn)

### 7. Settings → Cài đặt & Tùy chọn
- Hồ sơ người dùng, Thông báo, Bảng tìm kiếm (Ctrl+K), Chế độ tối

### 8. Keyboard Shortcuts → Phím tắt
- Translated table with Vietnamese descriptions

### 9. Tips → Mẹo & Thực hành tốt nhất

## Translation Guidelines
- Professional Vietnamese, not literal word-for-word
- Keep technical terms (Kanban, KPI, SSE, FTS) in English
- UI labels match app's existing VI translations (react-i18next in `frontend/src/locales/vi/`)
- Route paths (`/pms/dashboard`, etc.) stay in English
- Keyboard shortcuts stay in English (`Ctrl+K`, etc.)

## Reference: Existing App Translations
Check `frontend/src/locales/vi/` for established Vietnamese terminology used in the app.

## Related Files
- Modify: `docs/user-guide.html` (add lang-vi divs to every content section)

## Success Criteria
- All sections have complete VI translation (no placeholder text)
- Toggling EN→VI shows full Vietnamese content throughout
- Translation is natural and professional
- Technical terms handled consistently
