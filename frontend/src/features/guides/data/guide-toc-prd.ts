import type { GuideConfig } from './guide-toc'

export const PRD_CONFIG: GuideConfig = {
    id: 'prd',
    file: 'prd-crm.html',
    labelEn: 'Product Requirements (PRD)',
    labelVi: 'Yêu Cầu Sản Phẩm (PRD)',
    icon: 'ClipboardList',
    sections: [
        {
            labelEn: 'Core Modules',
            labelVi: 'Các Module Chính',
            items: [
                { id: 'prd-crm', hash: '', labelEn: 'CRM Module', labelVi: 'Module CRM', file: 'prd-crm.html' },
                { id: 'prd-hrm', hash: '', labelEn: 'HRM Module', labelVi: 'Module HRM', file: 'prd-hrm.html' },
            ],
        },
    ],
}
