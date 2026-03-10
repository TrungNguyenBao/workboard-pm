import type { GuideConfig } from './guide-toc'

export const SOP_CRM_CONFIG: GuideConfig = {
  id: 'sop-crm',
  file: 'sop-crm-guide.html',
  labelEn: 'CRM SOP Guide',
  labelVi: 'Hướng Dẫn SOP CRM',
  icon: 'TrendingUp',
  sections: [
    {
      labelEn: 'Introduction',
      labelVi: 'Giới thiệu',
      items: [
        { id: 'crm-tong-quan', hash: 'tong-quan', labelEn: 'System Overview', labelVi: 'Tổng quan hệ thống' },
        { id: 'crm-vai-tro', hash: 'vai-tro', labelEn: 'Roles & Responsibilities', labelVi: 'Vai trò & Trách nhiệm' },
      ],
    },
    {
      labelEn: 'Lead Management',
      labelVi: 'Quản lý Lead',
      items: [
        { id: 'crm-sop01', hash: 'sop01', labelEn: 'SOP 01 — Create Lead', labelVi: 'SOP 01 — Tạo Lead' },
        { id: 'crm-sop02', hash: 'sop02', labelEn: 'SOP 02 — Qualify Lead', labelVi: 'SOP 02 — Đánh giá Lead' },
        { id: 'crm-sop03', hash: 'sop03', labelEn: 'SOP 03 — Distribute Lead', labelVi: 'SOP 03 — Phân bổ Lead' },
      ],
    },
    {
      labelEn: 'Pipeline & Sales',
      labelVi: 'Pipeline & Bán hàng',
      items: [
        { id: 'crm-sop04', hash: 'sop04', labelEn: 'SOP 04 — Create Opportunity', labelVi: 'SOP 04 — Tạo Opportunity' },
        { id: 'crm-sop05', hash: 'sop05', labelEn: 'SOP 05 — Pipeline Management', labelVi: 'SOP 05 — Quản lý Pipeline' },
        { id: 'crm-sop06', hash: 'sop06', labelEn: 'SOP 06 — Activity Logging', labelVi: 'SOP 06 — Ghi nhận Activity' },
        { id: 'crm-sop07', hash: 'sop07', labelEn: 'SOP 07 — Deal Closing', labelVi: 'SOP 07 — Đóng Deal' },
      ],
    },
    {
      labelEn: 'Customer & Support',
      labelVi: 'Khách hàng & Hỗ trợ',
      items: [
        { id: 'crm-sop08', hash: 'sop08', labelEn: 'SOP 08 — Customer Creation', labelVi: 'SOP 08 — Tạo Khách hàng' },
        { id: 'crm-sop09', hash: 'sop09', labelEn: 'SOP 09 — Customer Support', labelVi: 'SOP 09 — Hỗ trợ Khách hàng' },
        { id: 'crm-sop10', hash: 'sop10', labelEn: 'SOP 10 — Customer Retention', labelVi: 'SOP 10 — Giữ chân Khách hàng' },
      ],
    },
    {
      labelEn: 'Marketing & Data',
      labelVi: 'Marketing & Dữ liệu',
      items: [
        { id: 'crm-sop11', hash: 'sop11', labelEn: 'SOP 11 — Campaign Management', labelVi: 'SOP 11 — Quản lý Campaign' },
        { id: 'crm-sop12', hash: 'sop12', labelEn: 'SOP 12 — Data Quality', labelVi: 'SOP 12 — Chất lượng Dữ liệu' },
      ],
    },
    {
      labelEn: 'Reference',
      labelVi: 'Tham chiếu',
      items: [
        { id: 'crm-sop13', hash: 'sop13', labelEn: 'SOP 13 — CRM Reporting', labelVi: 'SOP 13 — Báo cáo CRM' },
        { id: 'crm-sop14', hash: 'sop14', labelEn: 'SOP 14 — KPI Dashboard', labelVi: 'SOP 14 — KPI Dashboard' },
        { id: 'crm-sop15', hash: 'sop15', labelEn: 'SOP 15 — Governance Rules', labelVi: 'SOP 15 — Quy tắc Quản trị' },
      ],
    },
  ],
}
