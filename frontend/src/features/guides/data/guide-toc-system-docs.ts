import type { GuideConfig } from './guide-toc'

export const SYSTEM_DOCS_CONFIG: GuideConfig = {
    id: 'system-docs',
    file: 'system-architecture.html',
    labelEn: 'System Docs',
    labelVi: 'Tài Liệu Hệ Thống',
    icon: 'Terminal',
    sections: [
        {
            labelEn: 'Architecture',
            labelVi: 'Kiến Trúc',
            items: [
                { id: 'arch-overview', hash: 'overview', labelEn: 'High-Level Overview', labelVi: 'Tổng Quan Hệ Thống' },
                { id: 'arch-structure', hash: 'structure', labelEn: 'Directory Structure', labelVi: 'Cấu Trúc Thư Mục' },
                { id: 'arch-layers', hash: 'layers', labelEn: 'Backend Layers', labelVi: 'Các Lớp Backend' },
                { id: 'arch-data-model', hash: 'data-model', labelEn: 'Data Model', labelVi: 'Mô Hình Dữ Liệu' },
            ],
        },
        {
            labelEn: 'Infrastructure',
            labelVi: 'Hạ Tầng',
            items: [
                { id: 'arch-auth', hash: 'auth', labelEn: 'Authentication', labelVi: 'Xác Thực' },
                { id: 'arch-rbac', hash: 'rbac', labelEn: 'RBAC', labelVi: 'Quản Lý Quyền' },
                { id: 'arch-realtime', hash: 'realtime', labelEn: 'Real-time (SSE)', labelVi: 'Thời Gian Thực' },
            ],
        },
        {
            labelEn: 'Development',
            labelVi: 'Phát Triển',
            items: [
                { id: 'tech-stack', hash: '', labelEn: 'Tech Stack', labelVi: 'Công Nghệ Sử Dụng', file: 'tech-stack.html' },
                { id: 'code-standards', hash: '', labelEn: 'Code Standards', labelVi: 'Tiêu Chuẩn Mã Nguồn', file: 'code-standards.html' },
                { id: 'roadmap', hash: '', labelEn: 'Development Roadmap', labelVi: 'Lộ Trình Phát Triển', file: 'development-roadmap.html' },
                { id: 'changelog', hash: '', labelEn: 'Project Changelog', labelVi: 'Lịch Sử Thay Đổi', file: 'project-changelog.html' },
            ],
        },
        {
            labelEn: 'Design',
            labelVi: 'Thiết Kế',
            items: [
                { id: 'design-guide', hash: '', labelEn: 'Design Guidelines', labelVi: 'Hướng Dẫn Thiết Kế', file: 'design-guidelines.html' },
            ],
        },
    ],
}
