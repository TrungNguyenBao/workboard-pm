import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { AppShell } from '@/features/auth/components/app-shell'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/features/auth/pages/login'))
const RegisterPage = lazy(() => import('@/features/auth/pages/register'))
const MyTasksPage = lazy(() => import('@/features/dashboard/pages/my-tasks'))
const BoardPage = lazy(() => import('@/features/projects/pages/board'))
const ListPage = lazy(() => import('@/features/projects/pages/list'))
const CalendarPage = lazy(() => import('@/features/projects/pages/calendar'))
const OverviewPage = lazy(() => import('@/features/projects/pages/overview'))
const TimelinePage = lazy(() => import('@/features/projects/pages/timeline'))
const SettingsPage = lazy(() => import('@/features/settings/pages/settings'))
const MembersPage = lazy(() => import('@/features/workspaces/pages/members'))
const GoalsPage = lazy(() => import('@/features/goals/pages/goals-list'))

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
            <Route index element={<Navigate to="/my-tasks" replace />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/projects/:projectId/board" element={<BoardPage />} />
            <Route path="/projects/:projectId/list" element={<ListPage />} />
            <Route path="/projects/:projectId/calendar" element={<CalendarPage />} />
            <Route path="/projects/:projectId/overview" element={<OverviewPage />} />
            <Route path="/projects/:projectId/timeline" element={<TimelinePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
