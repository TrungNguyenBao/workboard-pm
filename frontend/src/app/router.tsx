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

// Lazy-loaded pages — WMS module (placeholder)
const WmsHomePage = lazy(() => import('@/modules/wms/features/warehouses/pages/warehouses-list'))

// Lazy-loaded pages — HRM module (placeholder)
const HrmHomePage = lazy(() => import('@/modules/hrm/features/employees/pages/employees-list'))

// Lazy-loaded pages — CRM module (placeholder)
const CrmHomePage = lazy(() => import('@/modules/crm/features/contacts/pages/contacts-list'))

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
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>}>
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
            <Route path="/wms" element={<WmsHomePage />} />

            {/* HRM module */}
            <Route path="/hrm" element={<HrmHomePage />} />

            {/* CRM module */}
            <Route path="/crm" element={<CrmHomePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
