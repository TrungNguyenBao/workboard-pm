import type { GuideConfig } from './guide-toc'

export const SOP_HRM_CONFIG: GuideConfig = {
  id: 'sop-hrm',
  file: 'sop-hrm-guide.html',
  labelEn: 'HRM SOP Guide',
  labelVi: 'Hướng Dẫn SOP HRM',
  icon: 'Users',
  sections: [
    {
      labelEn: 'Introduction',
      labelVi: 'Giới thiệu',
      items: [
        { id: 'hrm-tong-quan', hash: 'tong-quan', labelEn: 'System Overview', labelVi: 'Tổng quan hệ thống' },
        { id: 'hrm-vai-tro', hash: 'vai-tro', labelEn: 'Roles & Responsibilities', labelVi: 'Vai trò & Trách nhiệm' },
      ],
    },
    {
      labelEn: 'Org & Records',
      labelVi: 'Tổ chức & Hồ sơ',
      items: [
        { id: 'hrm-sop01', hash: 'sop01', labelEn: 'SOP 01 — Org Chart', labelVi: 'SOP 01 — Sơ đồ Tổ chức' },
        { id: 'hrm-sop02', hash: 'sop02', labelEn: 'SOP 02 — Employee Records', labelVi: 'SOP 02 — Hồ sơ Nhân sự' },
      ],
    },
    {
      labelEn: 'Recruitment',
      labelVi: 'Tuyển dụng',
      items: [
        { id: 'hrm-sop03', hash: 'sop03', labelEn: 'SOP 03 — Recruitment Request', labelVi: 'SOP 03 — Yêu cầu Tuyển dụng' },
        { id: 'hrm-sop04', hash: 'sop04', labelEn: 'SOP 04 — Candidate Pipeline', labelVi: 'SOP 04 — Pipeline Ứng viên' },
        { id: 'hrm-sop05', hash: 'sop05', labelEn: 'SOP 05 — Offer & Onboarding', labelVi: 'SOP 05 — Offer & Onboarding' },
      ],
    },
    {
      labelEn: 'Attendance & Payroll',
      labelVi: 'Chấm công & Lương',
      items: [
        { id: 'hrm-sop06', hash: 'sop06', labelEn: 'SOP 06 — Attendance & Leave', labelVi: 'SOP 06 — Chấm công & Nghỉ phép' },
        { id: 'hrm-sop07', hash: 'sop07', labelEn: 'SOP 07 — Payroll', labelVi: 'SOP 07 — Tính & Chi lương' },
      ],
    },
    {
      labelEn: 'Performance & Training',
      labelVi: 'Đánh giá & Đào tạo',
      items: [
        { id: 'hrm-sop08', hash: 'sop08', labelEn: 'SOP 08 — KPI/OKR & Review', labelVi: 'SOP 08 — KPI/OKR & Đánh giá' },
        { id: 'hrm-sop09', hash: 'sop09', labelEn: 'SOP 09 — Training & Development', labelVi: 'SOP 09 — Đào tạo & Phát triển' },
      ],
    },
    {
      labelEn: 'Admin',
      labelVi: 'Hành chính',
      items: [
        { id: 'hrm-sop10', hash: 'sop10', labelEn: 'SOP 10 — Assets & Procurement', labelVi: 'SOP 10 — Tài sản & Mua sắm' },
      ],
    },
    {
      labelEn: 'Offboarding',
      labelVi: 'Thôi việc',
      items: [
        { id: 'hrm-sop11', hash: 'sop11', labelEn: 'SOP 11 — Offboarding Process', labelVi: 'SOP 11 — Quy trình Thôi việc' },
      ],
    },
    {
      labelEn: 'Reference',
      labelVi: 'Tham chiếu',
      items: [
        { id: 'hrm-kpi', hash: 'kpi', labelEn: 'Operational KPIs', labelVi: 'KPI vận hành' },
        { id: 'hrm-role-summary', hash: 'role-summary', labelEn: 'Summary by Role', labelVi: 'Tổng hợp theo Vai trò' },
        { id: 'hrm-nguyen-tac-vang', hash: 'nguyen-tac-vang', labelEn: 'Golden Principles', labelVi: 'Nguyên tắc vàng' },
      ],
    },
  ],
}
