export interface NavItemDef {
  to: string
  icon: string
  labelKey: string
}

export interface NavGroupDef {
  label?: string  // i18n key; undefined = no section header
  items: NavItemDef[]
}

export const PMS_NAV: NavGroupDef[] = [
  {
    items: [
      { to: '/pms/dashboard', icon: 'Home', labelKey: 'nav.dashboard' },
      { to: '/pms/my-tasks', icon: 'CheckSquare', labelKey: 'nav.myTasks' },
      { to: '/pms/goals', icon: 'Target', labelKey: 'nav.goals' },
      { to: '/pms/tags', icon: 'Tag', labelKey: 'nav.tags' },
    ],
  },
]

export const HRM_NAV: NavGroupDef[] = [
  {
    items: [
      { to: '/hrm/dashboard', icon: 'Home', labelKey: 'nav.dashboard' },
    ],
  },
  {
    label: 'nav.group.people',
    items: [
      { to: '/hrm/employees', icon: 'Users', labelKey: 'nav.employees' },
      { to: '/hrm/departments', icon: 'Briefcase', labelKey: 'nav.departments' },
      { to: '/hrm/positions', icon: 'Box', labelKey: 'nav.positions' },
    ],
  },
  {
    label: 'nav.group.timePay',
    items: [
      { to: '/hrm/leave', icon: 'Calendar', labelKey: 'nav.leave' },
      { to: '/hrm/payroll', icon: 'DollarSign', labelKey: 'nav.payroll' },
      { to: '/hrm/attendance', icon: 'Clock', labelKey: 'nav.attendance' },
      { to: '/hrm/insurance', icon: 'Shield', labelKey: 'nav.insurance' },
    ],
  },
  {
    label: 'nav.group.talent',
    items: [
      { to: '/hrm/recruitment', icon: 'UserPlus', labelKey: 'nav.recruitment' },
      { to: '/hrm/onboarding', icon: 'ClipboardCheck', labelKey: 'nav.onboarding' },
      { to: '/hrm/performance', icon: 'TrendingUp', labelKey: 'nav.performance' },
      { to: '/hrm/reviews', icon: 'Star', labelKey: 'nav.reviews' },
      { to: '/hrm/training', icon: 'BookOpen', labelKey: 'nav.training' },
      { to: '/hrm/offboarding', icon: 'LogOut', labelKey: 'nav.offboarding' },
    ],
  },
  {
    label: 'nav.group.operations',
    items: [
      { to: '/hrm/assets', icon: 'Package', labelKey: 'nav.assets' },
      { to: '/hrm/procurement', icon: 'ShoppingCart', labelKey: 'nav.procurement' },
    ],
  },
]

export const CRM_NAV: NavGroupDef[] = [
  {
    items: [
      { to: '/crm/dashboard', icon: 'Home', labelKey: 'nav.dashboard' },
    ],
  },
  {
    label: 'nav.group.sales',
    items: [
      { to: '/crm/leads', icon: 'UserCheck', labelKey: 'nav.leads' },
      { to: '/crm/contacts', icon: 'Users', labelKey: 'nav.contacts' },
      { to: '/crm/accounts', icon: 'Building2', labelKey: 'nav.accounts' },
      { to: '/crm/deals', icon: 'DollarSign', labelKey: 'nav.deals' },
      { to: '/crm/pipeline', icon: 'Kanban', labelKey: 'nav.pipeline' },
      { to: '/crm/products', icon: 'Package', labelKey: 'nav.products' },
      { to: '/crm/contracts', icon: 'FileText', labelKey: 'nav.contracts' },
      { to: '/crm/forecasts', icon: 'TrendingUp', labelKey: 'nav.forecasts' },
    ],
  },
  {
    label: 'nav.group.engagement',
    items: [
      { to: '/crm/activities', icon: 'Activity', labelKey: 'nav.activities' },
      { to: '/crm/campaigns', icon: 'Megaphone', labelKey: 'nav.campaigns' },
      { to: '/crm/tickets', icon: 'Ticket', labelKey: 'nav.tickets' },
    ],
  },
  {
    label: 'nav.group.tools',
    items: [
      { to: '/crm/import', icon: 'Upload', labelKey: 'nav.import' },
      { to: '/crm/email-templates', icon: 'Mail', labelKey: 'nav.emailTemplates' },
      { to: '/crm/data-quality', icon: 'ShieldCheck', labelKey: 'nav.dataQuality' },
    ],
  },
  {
    label: 'nav.group.settings',
    items: [
      { to: '/crm/settings/pipeline', icon: 'Settings', labelKey: 'nav.pipelineSettings' },
      { to: '/crm/settings/scoring', icon: 'SlidersHorizontal', labelKey: 'nav.scoringSettings' },
      { to: '/crm/custom-fields', icon: 'ListPlus', labelKey: 'nav.customFields' },
    ],
  },
]

export const WMS_NAV: NavGroupDef[] = [
  {
    items: [
      { to: '/wms/dashboard', icon: 'Home', labelKey: 'nav.dashboard' },
    ],
  },
  {
    label: 'nav.group.catalog',
    items: [
      { to: '/wms/products', icon: 'Package', labelKey: 'nav.products' },
      { to: '/wms/warehouses', icon: 'Warehouse', labelKey: 'nav.warehouses' },
      { to: '/wms/devices', icon: 'Cpu', labelKey: 'nav.devices' },
    ],
  },
  {
    label: 'nav.group.operations',
    items: [
      { to: '/wms/inventory', icon: 'Box', labelKey: 'nav.inventory' },
      { to: '/wms/suppliers', icon: 'Truck', labelKey: 'nav.suppliers' },
    ],
  },
]
