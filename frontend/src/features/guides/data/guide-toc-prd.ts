import type { GuideConfig } from './guide-toc'

export const PRD_CONFIG: GuideConfig = {
    id: 'prd',
    file: 'prd-pms.html',
    labelEn: 'Product Requirements (PRD)',
    labelVi: 'Yêu Cầu Sản Phẩm (PRD)',
    icon: 'ClipboardList',
    sections: [
        {
            labelEn: 'PMS — Overview',
            labelVi: 'PMS — Tổng Quan',
            items: [
                { id: 'pms-overview', hash: 'overview', labelEn: 'Product Overview', labelVi: 'Tổng Quan Sản Phẩm', file: 'prd-pms.html' },
                { id: 'pms-scope', hash: 'scope', labelEn: 'System Scope', labelVi: 'Phạm Vi Hệ Thống', file: 'prd-pms.html' },
                { id: 'pms-roles', hash: 'roles', labelEn: 'User Roles', labelVi: 'Vai Trò Người Dùng', file: 'prd-pms.html' },
            ],
        },
        {
            labelEn: 'PMS — Data & API',
            labelVi: 'PMS — Dữ Liệu & API',
            items: [
                { id: 'pms-data-models', hash: 'data-models', labelEn: 'Data Models (16)', labelVi: 'Mô Hình Dữ Liệu (16)', file: 'prd-pms.html' },
                { id: 'pms-api-endpoints', hash: 'api-endpoints', labelEn: 'API Endpoints', labelVi: 'API Endpoints', file: 'prd-pms.html' },
                { id: 'pms-frontend-pages', hash: 'frontend-pages', labelEn: 'Frontend Pages (15+)', labelVi: 'Trang Giao Diện (15+)', file: 'prd-pms.html' },
            ],
        },
        {
            labelEn: 'PMS — Features & Workflows',
            labelVi: 'PMS — Tính Năng & Quy Trình',
            items: [
                { id: 'pms-key-features', hash: 'key-features', labelEn: 'Key Features', labelVi: 'Tính Năng Chính', file: 'prd-pms.html' },
                { id: 'pms-task-lifecycle', hash: 'task-lifecycle', labelEn: 'Task Lifecycle', labelVi: 'Vòng Đời Task', file: 'prd-pms.html' },
                { id: 'pms-sprint-workflow', hash: 'sprint-workflow', labelEn: 'Sprint Workflow', labelVi: 'Quy Trình Sprint', file: 'prd-pms.html' },
                { id: 'pms-permissions', hash: 'permissions', labelEn: 'Role-Based Permissions', labelVi: 'Phân Quyền Theo Vai Trò', file: 'prd-pms.html' },
                { id: 'pms-success-metrics', hash: 'success-metrics', labelEn: 'Success Metrics', labelVi: 'Chỉ Số Thành Công', file: 'prd-pms.html' },
                { id: 'pms-future', hash: 'future', labelEn: 'Future Enhancements', labelVi: 'Phát Triển Tương Lai', file: 'prd-pms.html' },
            ],
        },
        {
            labelEn: 'CRM — Overview',
            labelVi: 'CRM — Tổng Quan',
            items: [
                { id: 'crm-overview', hash: 'overview', labelEn: 'Product Overview', labelVi: 'Tổng Quan Sản Phẩm', file: 'prd-crm.html' },
                { id: 'crm-stakeholders', hash: 'stakeholders', labelEn: 'Stakeholders', labelVi: 'Các Bên Liên Quan', file: 'prd-crm.html' },
                { id: 'crm-scope', hash: 'scope', labelEn: 'System Scope', labelVi: 'Phạm Vi Hệ Thống', file: 'prd-crm.html' },
            ],
        },
        {
            labelEn: 'CRM — Data & API',
            labelVi: 'CRM — Dữ Liệu & API',
            items: [
                { id: 'crm-data-models', hash: 'data-models', labelEn: 'Core Data Models', labelVi: 'Mô Hình Dữ Liệu', file: 'prd-crm.html' },
                { id: 'crm-api-endpoints', hash: 'api-endpoints', labelEn: 'API Endpoints', labelVi: 'API Endpoints', file: 'prd-crm.html' },
                { id: 'crm-frontend-pages', hash: 'frontend-pages', labelEn: 'Frontend Pages', labelVi: 'Trang Giao Diện', file: 'prd-crm.html' },
            ],
        },
        {
            labelEn: 'CRM — Features',
            labelVi: 'CRM — Tính Năng',
            items: [
                { id: 'crm-lead-scoring', hash: 'lead-scoring', labelEn: 'Lead Scoring & Distribution', labelVi: 'Chấm Điểm & Phân Phối Lead', file: 'prd-crm.html' },
                { id: 'crm-key-features', hash: 'key-features', labelEn: 'Key Features', labelVi: 'Tính Năng Chính', file: 'prd-crm.html' },
                { id: 'crm-data-quality', hash: 'data-quality', labelEn: 'Data Quality & Governance', labelVi: 'Chất Lượng Dữ Liệu', file: 'prd-crm.html' },
                { id: 'crm-future', hash: 'future', labelEn: 'Future Enhancements', labelVi: 'Phát Triển Tương Lai', file: 'prd-crm.html' },
                { id: 'crm-success-metrics', hash: 'success-metrics', labelEn: 'Success Metrics', labelVi: 'Chỉ Số Thành Công', file: 'prd-crm.html' },
            ],
        },
        {
            labelEn: 'HRM — Overview',
            labelVi: 'HRM — Tổng Quan',
            items: [
                { id: 'hrm-overview', hash: 'overview', labelEn: 'Product Overview', labelVi: 'Tổng Quan Sản Phẩm', file: 'prd-hrm.html' },
                { id: 'hrm-scope', hash: 'scope', labelEn: 'System Scope', labelVi: 'Phạm Vi Hệ Thống', file: 'prd-hrm.html' },
                { id: 'hrm-roles', hash: 'roles', labelEn: 'User Roles', labelVi: 'Vai Trò Người Dùng', file: 'prd-hrm.html' },
            ],
        },
        {
            labelEn: 'HRM — Data & API',
            labelVi: 'HRM — Dữ Liệu & API',
            items: [
                { id: 'hrm-data-models', hash: 'data-models', labelEn: 'Data Models (32)', labelVi: 'Mô Hình Dữ Liệu (32)', file: 'prd-hrm.html' },
                { id: 'hrm-api-endpoints', hash: 'api-endpoints', labelEn: 'API Endpoints', labelVi: 'API Endpoints', file: 'prd-hrm.html' },
                { id: 'hrm-frontend-pages', hash: 'frontend-pages', labelEn: 'Frontend Pages (23+)', labelVi: 'Trang Giao Diện (23+)', file: 'prd-hrm.html' },
            ],
        },
        {
            labelEn: 'HRM — Features & Workflows',
            labelVi: 'HRM — Tính Năng & Quy Trình',
            items: [
                { id: 'hrm-key-features', hash: 'key-features', labelEn: 'Key Features', labelVi: 'Tính Năng Chính', file: 'prd-hrm.html' },
                { id: 'hrm-candidate-pipeline', hash: 'candidate-pipeline', labelEn: 'Candidate Pipeline', labelVi: 'Quy Trình Ứng Viên', file: 'prd-hrm.html' },
                { id: 'hrm-employee-status', hash: 'employee-status', labelEn: 'Employee Status Flow', labelVi: 'Luồng Trạng Thái NV', file: 'prd-hrm.html' },
                { id: 'hrm-permissions', hash: 'permissions', labelEn: 'Role-Based Permissions', labelVi: 'Phân Quyền Theo Vai Trò', file: 'prd-hrm.html' },
                { id: 'hrm-success-metrics', hash: 'success-metrics', labelEn: 'Success Metrics', labelVi: 'Chỉ Số Thành Công', file: 'prd-hrm.html' },
                { id: 'hrm-future', hash: 'future', labelEn: 'Future Enhancements', labelVi: 'Phát Triển Tương Lai', file: 'prd-hrm.html' },
            ],
        },
    ],
}
