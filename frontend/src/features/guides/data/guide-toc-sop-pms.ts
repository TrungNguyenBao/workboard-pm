import type { GuideConfig } from './guide-toc'

export const SOP_PMS_CONFIG: GuideConfig = {
  id: 'sop-pms',
  file: 'sop-pms-guide.html',
  labelEn: 'PMS SOP Guide',
  labelVi: 'Hướng Dẫn SOP PMS',
  icon: 'Kanban',
  sections: [
    {
      labelEn: 'Introduction',
      labelVi: 'Giới thiệu',
      items: [
        { id: 'pms-tong-quan', hash: 'tong-quan', labelEn: 'System Overview', labelVi: 'Tổng quan hệ thống' },
        { id: 'pms-vai-tro', hash: 'vai-tro', labelEn: 'Roles & Responsibilities', labelVi: 'Vai trò & Trách nhiệm' },
        { id: 'pms-loai-du-an', hash: 'loai-du-an', labelEn: 'Project Type Matrix', labelVi: 'Ma trận Loại Dự án' },
      ],
    },
    {
      labelEn: 'Setup',
      labelVi: 'Thiết lập',
      items: [
        { id: 'pms-sop01', hash: 'sop01', labelEn: 'SOP 01 — Workspace', labelVi: 'SOP 01 — Workspace' },
        { id: 'pms-sop02', hash: 'sop02', labelEn: 'SOP 02 — Create Project', labelVi: 'SOP 02 — Tạo Dự án' },
      ],
    },
    {
      labelEn: 'Tasks',
      labelVi: 'Công việc',
      items: [
        { id: 'pms-sop03', hash: 'sop03', labelEn: 'SOP 03 — Manage Tasks', labelVi: 'SOP 03 — Quản lý Task' },
        { id: 'pms-sop04', hash: 'sop04', labelEn: 'SOP 04 — Kanban Board', labelVi: 'SOP 04 — Kanban Board' },
      ],
    },
    {
      labelEn: 'Agile / Sprint',
      labelVi: 'Agile / Sprint',
      items: [
        { id: 'pms-sop05', hash: 'sop05', labelEn: 'SOP 05 — Manage Sprints', labelVi: 'SOP 05 — Quản lý Sprint' },
        { id: 'pms-sop06', hash: 'sop06', labelEn: 'SOP 06 — Backlog', labelVi: 'SOP 06 — Backlog' },
      ],
    },
    {
      labelEn: 'Views',
      labelVi: 'Giao diện xem',
      items: [
        { id: 'pms-sop07', hash: 'sop07', labelEn: 'SOP 07 — Calendar & Timeline', labelVi: 'SOP 07 — Calendar & Timeline' },
        { id: 'pms-sop08', hash: 'sop08', labelEn: 'SOP 08 — Goals', labelVi: 'SOP 08 — Goals (Mục tiêu)' },
      ],
    },
    {
      labelEn: 'Analytics',
      labelVi: 'Analytics',
      items: [
        { id: 'pms-sop09', hash: 'sop09', labelEn: 'SOP 09 — Burndown & Velocity', labelVi: 'SOP 09 — Burndown & Velocity' },
      ],
    },
    {
      labelEn: 'Reference',
      labelVi: 'Tham chiếu',
      items: [
        { id: 'pms-kpi', hash: 'kpi', labelEn: 'Operational KPIs', labelVi: 'KPI vận hành' },
        { id: 'pms-role-summary', hash: 'role-summary', labelEn: 'Summary by Role', labelVi: 'Tổng hợp theo Vai trò' },
        { id: 'pms-nguyen-tac-vang', hash: 'nguyen-tac-vang', labelEn: 'Golden Principles', labelVi: 'Nguyên tắc vàng' },
      ],
    },
  ],
}
