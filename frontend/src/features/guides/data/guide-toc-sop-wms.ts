import type { GuideConfig } from './guide-toc'

export const SOP_WMS_CONFIG: GuideConfig = {
  id: 'sop-wms',
  file: 'sop-wsm-guide.html',
  labelEn: 'WMS SOP Guide',
  labelVi: 'Hướng Dẫn SOP WMS',
  icon: 'Warehouse',
  sections: [
    {
      labelEn: 'Introduction',
      labelVi: 'Giới thiệu',
      items: [
        { id: 'wms-tong-quan', hash: 'tong-quan', labelEn: 'System Overview', labelVi: 'Tổng quan hệ thống' },
        { id: 'wms-vai-tro', hash: 'vai-tro', labelEn: 'Roles & Responsibilities', labelVi: 'Vai trò & Trách nhiệm' },
        { id: 'wms-tinh-nang', hash: 'tinh-nang', labelEn: 'Feature Matrix', labelVi: 'Ma trận Tính năng' },
      ],
    },
    {
      labelEn: 'Setup',
      labelVi: 'Thiết lập',
      items: [
        { id: 'wms-sop01', hash: 'sop01', labelEn: 'SOP 01 — Warehouse Setup', labelVi: 'SOP 01 — Thiết lập Kho hàng' },
        { id: 'wms-sop02', hash: 'sop02', labelEn: 'SOP 02 — Product Catalog', labelVi: 'SOP 02 — Danh mục Sản phẩm' },
        { id: 'wms-sop03', hash: 'sop03', labelEn: 'SOP 03 — Suppliers', labelVi: 'SOP 03 — Nhà cung cấp' },
      ],
    },
    {
      labelEn: 'Inventory',
      labelVi: 'Tồn kho',
      items: [
        { id: 'wms-sop04', hash: 'sop04', labelEn: 'SOP 04 — Inventory Management', labelVi: 'SOP 04 — Quản lý Tồn kho' },
        { id: 'wms-sop05', hash: 'sop05', labelEn: 'SOP 05 — Low Stock Alerts', labelVi: 'SOP 05 — Cảnh báo Tồn thấp' },
      ],
    },
    {
      labelEn: 'Devices',
      labelVi: 'Thiết bị',
      items: [
        { id: 'wms-sop06', hash: 'sop06', labelEn: 'SOP 06 — Serial Device Registration', labelVi: 'SOP 06 — Đăng ký Thiết bị Serial' },
        { id: 'wms-sop07', hash: 'sop07', labelEn: 'SOP 07 — Device Lifecycle', labelVi: 'SOP 07 — Vòng đời Thiết bị' },
      ],
    },
    {
      labelEn: 'Analytics',
      labelVi: 'Analytics',
      items: [
        { id: 'wms-sop08', hash: 'sop08', labelEn: 'SOP 08 — Dashboard & Reports', labelVi: 'SOP 08 — Dashboard & Báo cáo' },
      ],
    },
    {
      labelEn: 'Reference',
      labelVi: 'Tham chiếu',
      items: [
        { id: 'wms-kpi', hash: 'kpi', labelEn: 'Operational KPIs', labelVi: 'KPI vận hành' },
        { id: 'wms-role-summary', hash: 'role-summary', labelEn: 'Summary by Role', labelVi: 'Tổng hợp theo Vai trò' },
        { id: 'wms-nguyen-tac-vang', hash: 'nguyen-tac-vang', labelEn: 'Golden Principles', labelVi: 'Nguyên tắc vàng' },
      ],
    },
  ],
}
