import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { AppShell } from '@/shared/components/shell/app-shell'

// Lazy-loaded pages — auth (shared)
const LoginPage = lazy(() => import('@/features/auth/pages/login'))
const RegisterPage = lazy(() => import('@/features/auth/pages/register'))

// Lazy-loaded pages — shared
const SettingsPage = lazy(() => import('@/features/settings/pages/settings'))
const MembersPage = lazy(() => import('@/features/workspaces/pages/members'))

// Lazy-loaded pages — PMS module
const MyTasksPage = lazy(() => import('@/modules/pms/features/dashboard/pages/my-tasks'))
const BoardPage = lazy(() => import('@/modules/pms/features/projects/pages/board'))
const ListPage = lazy(() => import('@/modules/pms/features/projects/pages/list'))
const CalendarPage = lazy(() => import('@/modules/pms/features/projects/pages/calendar'))
const OverviewPage = lazy(() => import('@/modules/pms/features/projects/pages/overview'))
const TimelinePage = lazy(() => import('@/modules/pms/features/projects/pages/timeline'))
const GoalsPage = lazy(() => import('@/modules/pms/features/goals/pages/goals-list'))

// Lazy-loaded pages — WMS module
const WmsProductsPage = lazy(() => import('@/modules/wms/features/products/pages/products-list'))
const WmsWarehousesPage = lazy(() => import('@/modules/wms/features/warehouses/pages/warehouses-list'))
const WmsDevicesPage = lazy(() => import('@/modules/wms/features/devices/pages/devices-list'))
const WmsInventoryPage = lazy(() => import('@/modules/wms/features/inventory/pages/inventory-list'))
const WmsSuppliersPage = lazy(() => import('@/modules/wms/features/suppliers/pages/suppliers-list'))

// Lazy-loaded pages — HRM module
const HrmEmployeesPage = lazy(() => import('@/modules/hrm/features/employees/pages/employees-list'))
const HrmEmployeeDetailPage = lazy(() => import('@/modules/hrm/features/employees/pages/employee-detail'))
const HrmDepartmentsPage = lazy(() => import('@/modules/hrm/features/departments/pages/departments-list'))
const HrmLeavePage = lazy(() => import('@/modules/hrm/features/leave/pages/leave-requests-list'))
const HrmPayrollPage = lazy(() => import('@/modules/hrm/features/payroll/pages/payroll-list'))
const HrmPositionsPage = lazy(() => import('@/modules/hrm/features/positions/pages/positions-list'))

// Lazy-loaded pages — CRM module
const CrmContactsPage = lazy(() => import('@/modules/crm/features/contacts/pages/contacts-list'))
const CrmDealsPage = lazy(() => import('@/modules/crm/features/deals/pages/deals-list'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
        <Routes>
          <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />

          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Navigate to="/pms/my-tasks" replace />} />

            {/* Shared routes */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/members" element={<MembersPage />} />

            {/* PMS module */}
            <Route path="/pms/my-tasks" element={<MyTasksPage />} />
            <Route path="/pms/goals" element={<GoalsPage />} />
            <Route path="/pms/projects/:projectId/board" element={<BoardPage />} />
            <Route path="/pms/projects/:projectId/list" element={<ListPage />} />
            <Route path="/pms/projects/:projectId/calendar" element={<CalendarPage />} />
            <Route path="/pms/projects/:projectId/overview" element={<OverviewPage />} />
            <Route path="/pms/projects/:projectId/timeline" element={<TimelinePage />} />

            {/* WMS module */}
            <Route path="/wms" element={<Navigate to="/wms/products" replace />} />
            <Route path="/wms/products" element={<WmsProductsPage />} />
            <Route path="/wms/warehouses" element={<WmsWarehousesPage />} />
            <Route path="/wms/devices" element={<WmsDevicesPage />} />
            <Route path="/wms/inventory" element={<WmsInventoryPage />} />
            <Route path="/wms/suppliers" element={<WmsSuppliersPage />} />

            {/* HRM module */}
            <Route path="/hrm" element={<Navigate to="/hrm/employees" replace />} />
            <Route path="/hrm/employees/:employeeId" element={<HrmEmployeeDetailPage />} />
            <Route path="/hrm/employees" element={<HrmEmployeesPage />} />
            <Route path="/hrm/departments" element={<HrmDepartmentsPage />} />
            <Route path="/hrm/positions" element={<HrmPositionsPage />} />
            <Route path="/hrm/leave" element={<HrmLeavePage />} />
            <Route path="/hrm/payroll" element={<HrmPayrollPage />} />

            {/* CRM module */}
            <Route path="/crm" element={<Navigate to="/crm/contacts" replace />} />
            <Route path="/crm/contacts" element={<CrmContactsPage />} />
            <Route path="/crm/deals" element={<CrmDealsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
