import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'
import { ModuleSwitcher } from './module-switcher'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useSSE } from '@/features/notifications/hooks/use-sse'
import api from '@/shared/lib/api'

interface Workspace { id: string; name: string }

function WorkspaceBootstrapper({ children }: { children: React.ReactNode }) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      try {
        let { data: workspaces } = await api.get<Workspace[]>('/workspaces')

        // First-time user: seed a demo workspace automatically
        if (workspaces.length === 0) {
          const { data: demo } = await api.post<Workspace>('/workspaces/setup-demo')
          workspaces = [demo]
        }

        if (!activeWorkspaceId || !workspaces.find((w) => w.id === activeWorkspaceId)) {
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

function SSEMount() {
  useSSE()
  return null
}

export function AppShell() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === '?') setShortcutsOpen(true)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <WorkspaceBootstrapper>
      <SSEMount />
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center border-b border-border px-4 py-2">
            <ModuleSwitcher />
          </div>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </WorkspaceBootstrapper>
  )
}
