import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { useWorkspaceStore } from '@/stores/workspace.store'
import api from '@/shared/lib/api'

interface Workspace { id: string; name: string }

function WorkspaceBootstrapper({ children }: { children: React.ReactNode }) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      try {
        const { data: workspaces } = await api.get<Workspace[]>('/workspaces')
        if (workspaces.length > 0 && (!activeWorkspaceId || !workspaces.find((w) => w.id === activeWorkspaceId))) {
          setActiveWorkspace(workspaces[0].id)
        }
      } catch {
        // ignore — sidebar will show empty state
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}

export function AppShell() {
  return (
    <WorkspaceBootstrapper>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </WorkspaceBootstrapper>
  )
}
