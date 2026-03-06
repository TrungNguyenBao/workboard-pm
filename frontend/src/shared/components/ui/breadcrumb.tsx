import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const SEGMENT_LABELS: Record<string, string> = {
  pms: 'Projects',
  wms: 'Warehouse',
  hrm: 'HR',
  crm: 'CRM',
  'my-tasks': 'My Tasks',
  goals: 'Goals',
  projects: 'Projects',
  board: 'Board',
  list: 'List',
  timeline: 'Timeline',
  calendar: 'Calendar',
  overview: 'Overview',
  employees: 'Employees',
  departments: 'Departments',
  leave: 'Leave',
  payroll: 'Payroll',
  contacts: 'Contacts',
  deals: 'Deals',
  products: 'Products',
  warehouses: 'Warehouses',
  devices: 'Devices',
  inventory: 'Inventory',
  suppliers: 'Suppliers',
  settings: 'Settings',
  members: 'Members',
}

const UUID_RE = /^[0-9a-f-]{36}$/

export function Breadcrumb() {
  const { pathname } = useLocation()

  const segments = pathname.split('/').filter(Boolean).filter((s) => !UUID_RE.test(s))
  const labeled = segments.map((seg, i) => ({
    label: SEGMENT_LABELS[seg] ?? seg,
    path: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  if (labeled.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-sm">
      {labeled.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className={cn('text-muted-foreground hover:text-foreground transition-colors')}
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
