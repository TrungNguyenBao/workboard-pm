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
const PmsDashboardPage = lazy(() => import('@/modules/pms/features/dashboard/pages/pms-dashboard'))
const MyTasksPage = lazy(() => import('@/modules/pms/features/dashboard/pages/my-tasks'))
const BoardPage = lazy(() => import('@/modules/pms/features/projects/pages/board'))
const ListPage = lazy(() => import('@/modules/pms/features/projects/pages/list'))
const CalendarPage = lazy(() => import('@/modules/pms/features/projects/pages/calendar'))
const OverviewPage = lazy(() => import('@/modules/pms/features/projects/pages/overview'))
const TimelinePage = lazy(() => import('@/modules/pms/features/projects/pages/timeline'))
const GoalsPage = lazy(() => import('@/modules/pms/features/goals/pages/goals-list'))
const BacklogPage = lazy(() => import('@/modules/pms/features/projects/pages/backlog'))
const SprintsPage = lazy(() => import('@/modules/pms/features/projects/pages/sprints'))

// Lazy-loaded pages — WMS module
const WmsDashboardPage = lazy(() => import('@/modules/wms/features/dashboard/pages/wms-dashboard'))
const WmsProductsPage = lazy(() => import('@/modules/wms/features/products/pages/products-list'))
const WmsWarehousesPage = lazy(() => import('@/modules/wms/features/warehouses/pages/warehouses-list'))
const WmsDevicesPage = lazy(() => import('@/modules/wms/features/devices/pages/devices-list'))
const WmsInventoryPage = lazy(() => import('@/modules/wms/features/inventory/pages/inventory-list'))
const WmsSuppliersPage = lazy(() => import('@/modules/wms/features/suppliers/pages/suppliers-list'))

// Lazy-loaded pages — HRM module
const HrmDashboardPage = lazy(() => import('@/modules/hrm/features/dashboard/pages/hrm-dashboard'))
const HrmEmployeesPage = lazy(() => import('@/modules/hrm/features/employees/pages/employees-list'))
const HrmEmployeeDetailPage = lazy(() => import('@/modules/hrm/features/employees/pages/employee-detail'))
const HrmDepartmentsPage = lazy(() => import('@/modules/hrm/features/departments/pages/departments-list'))
const HrmLeavePage = lazy(() => import('@/modules/hrm/features/leave/pages/leave-requests-list'))
const HrmPayrollPage = lazy(() => import('@/modules/hrm/features/payroll/pages/payroll-list'))
const HrmPositionsPage = lazy(() => import('@/modules/hrm/features/positions/pages/positions-list'))
const HrmAttendancePage = lazy(() => import('@/modules/hrm/features/attendance/pages/attendance-list'))
const HrmInsurancePage = lazy(() => import('@/modules/hrm/features/payroll/pages/insurance-list'))
const HrmRecruitmentListPage = lazy(() => import('@/modules/hrm/features/recruitment/pages/recruitment-list'))
const HrmRecruitmentDetailPage = lazy(() => import('@/modules/hrm/features/recruitment/pages/recruitment-detail'))
const HrmOnboardingListPage = lazy(() => import('@/modules/hrm/features/onboarding/pages/onboarding-list'))

// Lazy-loaded pages — HRM performance
const HrmKpiListPage = lazy(() => import('@/modules/hrm/features/performance/pages/kpi-list'))
const HrmReviewsListPage = lazy(() => import('@/modules/hrm/features/performance/pages/reviews-list'))

// Lazy-loaded pages — HRM training
const HrmTrainingListPage = lazy(() => import('@/modules/hrm/features/training/pages/training-list'))

// Lazy-loaded pages — HRM offboarding
const HrmOffboardingListPage = lazy(() => import('@/modules/hrm/features/offboarding/pages/offboarding-list'))
const HrmOffboardingDetailPage = lazy(() => import('@/modules/hrm/features/offboarding/pages/offboarding-detail'))

// Lazy-loaded pages — HRM assets & procurement
const HrmAssetsPage = lazy(() => import('@/modules/hrm/features/assets/pages/assets-list'))
const HrmProcurementPage = lazy(() => import('@/modules/hrm/features/procurement/pages/procurement-list'))

// Lazy-loaded pages — CRM module
const CrmDashboardPage = lazy(() => import('@/modules/crm/features/dashboard/pages/crm-dashboard'))
const CrmContactsPage = lazy(() => import('@/modules/crm/features/contacts/pages/contacts-list'))
const CrmDealsPage = lazy(() => import('@/modules/crm/features/deals/pages/deals-list'))
const CrmPipelinePage = lazy(() => import('@/modules/crm/features/deals/pages/deals-pipeline'))
const CrmLeadsPage = lazy(() => import('@/modules/crm/features/leads/pages/leads-list'))
const CrmAccountsListPage = lazy(() => import('@/modules/crm/features/accounts/pages/accounts-list'))
const CrmAccountDetailPage = lazy(() => import('@/modules/crm/features/accounts/pages/account-detail'))
const CrmActivitiesPage = lazy(() => import('@/modules/crm/features/activities/pages/activities-list'))
const CrmCampaignsPage = lazy(() => import('@/modules/crm/features/campaigns/pages/campaigns-list'))
const CrmTicketsPage = lazy(() => import('@/modules/crm/features/tickets/pages/tickets-list'))

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
            <Route path="/pms/dashboard" element={<PmsDashboardPage />} />
            <Route path="/pms/my-tasks" element={<MyTasksPage />} />
            <Route path="/pms/goals" element={<GoalsPage />} />
            <Route path="/pms/projects/:projectId/board" element={<BoardPage />} />
            <Route path="/pms/projects/:projectId/list" element={<ListPage />} />
            <Route path="/pms/projects/:projectId/calendar" element={<CalendarPage />} />
            <Route path="/pms/projects/:projectId/overview" element={<OverviewPage />} />
            <Route path="/pms/projects/:projectId/timeline" element={<TimelinePage />} />
            <Route path="/pms/projects/:projectId/backlog" element={<BacklogPage />} />
            <Route path="/pms/projects/:projectId/sprints" element={<SprintsPage />} />

            {/* WMS module */}
            <Route path="/wms" element={<Navigate to="/wms/dashboard" replace />} />
            <Route path="/wms/dashboard" element={<WmsDashboardPage />} />
            <Route path="/wms/products" element={<WmsProductsPage />} />
            <Route path="/wms/warehouses" element={<WmsWarehousesPage />} />
            <Route path="/wms/devices" element={<WmsDevicesPage />} />
            <Route path="/wms/inventory" element={<WmsInventoryPage />} />
            <Route path="/wms/suppliers" element={<WmsSuppliersPage />} />

            {/* HRM module */}
            <Route path="/hrm" element={<Navigate to="/hrm/dashboard" replace />} />
            <Route path="/hrm/dashboard" element={<HrmDashboardPage />} />
            <Route path="/hrm/employees/:employeeId" element={<HrmEmployeeDetailPage />} />
            <Route path="/hrm/employees" element={<HrmEmployeesPage />} />
            <Route path="/hrm/departments" element={<HrmDepartmentsPage />} />
            <Route path="/hrm/positions" element={<HrmPositionsPage />} />
            <Route path="/hrm/leave" element={<HrmLeavePage />} />
            <Route path="/hrm/payroll" element={<HrmPayrollPage />} />
            <Route path="/hrm/attendance" element={<HrmAttendancePage />} />
            <Route path="/hrm/insurance" element={<HrmInsurancePage />} />
            <Route path="/hrm/recruitment" element={<HrmRecruitmentListPage />} />
            <Route path="/hrm/recruitment/:requestId" element={<HrmRecruitmentDetailPage />} />
            <Route path="/hrm/onboarding" element={<HrmOnboardingListPage />} />
            <Route path="/hrm/performance" element={<HrmKpiListPage />} />
            <Route path="/hrm/reviews" element={<HrmReviewsListPage />} />
            <Route path="/hrm/training" element={<HrmTrainingListPage />} />
            <Route path="/hrm/offboarding" element={<HrmOffboardingListPage />} />
            <Route path="/hrm/offboarding/:resignationId" element={<HrmOffboardingDetailPage />} />
            <Route path="/hrm/assets" element={<HrmAssetsPage />} />
            <Route path="/hrm/procurement" element={<HrmProcurementPage />} />

            {/* CRM module */}
            <Route path="/crm" element={<Navigate to="/crm/dashboard" replace />} />
            <Route path="/crm/dashboard" element={<CrmDashboardPage />} />
            <Route path="/crm/leads" element={<CrmLeadsPage />} />
            <Route path="/crm/contacts" element={<CrmContactsPage />} />
            <Route path="/crm/accounts" element={<CrmAccountsListPage />} />
            <Route path="/crm/accounts/:accountId" element={<CrmAccountDetailPage />} />
            <Route path="/crm/deals" element={<CrmDealsPage />} />
            <Route path="/crm/pipeline" element={<CrmPipelinePage />} />
            <Route path="/crm/activities" element={<CrmActivitiesPage />} />
            <Route path="/crm/campaigns" element={<CrmCampaignsPage />} />
            <Route path="/crm/tickets" element={<CrmTicketsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
