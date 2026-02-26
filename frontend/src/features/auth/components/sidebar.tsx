import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Home, LogOut, Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { cn, generateInitials } from '@/shared/lib/utils'
import { CreateWorkspaceDialog } from '@/features/workspaces/components/create-workspace-dialog'
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog'
import api from '@/shared/lib/api'

interface Workspace { id: string; name: string; slug: string }
interface Project { id: string; name: string; color: string }

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)

  const [wsDialogOpen, setWsDialogOpen] = useState(false)
  const [projDialogOpen, setProjDialogOpen] = useState(false)
  const [wsPickerOpen, setWsPickerOpen] = useState(false)

  // Fetch all workspaces for the switcher
  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then((r) => r.data),
  })

  // Auto-activate first workspace if none set
  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id)
      qc.invalidateQueries({ queryKey: ['projects'] })
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace, qc])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () =>
      api.get(`/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  const noWorkspace = workspaces.length === 0

  function isActive(path: string) {
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <aside className="flex h-screen w-56 flex-col border-r border-border bg-neutral-50">
        {/* Workspace switcher */}
        <div className="relative border-b border-border">
          <button
            className="flex w-full items-center gap-2 px-4 py-3 hover:bg-neutral-100 transition-colors"
            onClick={() => setWsPickerOpen((v) => !v)}
          >
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {activeWorkspace ? activeWorkspace.name[0].toUpperCase() : 'W'}
            </div>
            <span className="text-sm font-semibold text-neutral-900 truncate flex-1 text-left">
              {activeWorkspace?.name ?? 'No workspace'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
          </button>

          {wsPickerOpen && (
            <div className="absolute left-0 right-0 top-full z-50 bg-white border border-border rounded-b-md shadow-popover">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 transition-colors',
                    ws.id === activeWorkspaceId && 'text-primary font-medium',
                  )}
                  onClick={() => {
                    setActiveWorkspace(ws.id)
                    qc.invalidateQueries({ queryKey: ['projects'] })
                    setWsPickerOpen(false)
                  }}
                >
                  <div className="h-5 w-5 rounded bg-primary/80 flex items-center justify-center text-white text-xs font-bold">
                    {ws.name[0].toUpperCase()}
                  </div>
                  {ws.name}
                </button>
              ))}
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50 border-t border-border transition-colors"
                onClick={() => { setWsPickerOpen(false); setWsDialogOpen(true) }}
              >
                <Plus className="h-3.5 w-3.5" />
                New workspace
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {noWorkspace ? (
            <div className="px-2 py-6 text-center">
              <p className="text-xs text-neutral-400 mb-3">No workspace yet</p>
              <Button size="sm" onClick={() => setWsDialogOpen(true)}>
                Create workspace
              </Button>
            </div>
          ) : (
            <>
              <NavItem to="/my-tasks" icon={<Home className="h-4 w-4" />} label="My Tasks" active={isActive('/my-tasks')} />

              <div className="pt-4 pb-1 px-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Projects</span>
              </div>

              {projects.map((p) => (
                <NavItem
                  key={p.id}
                  to={`/projects/${p.id}/board`}
                  icon={<span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />}
                  label={p.name}
                  active={isActive(`/projects/${p.id}`)}
                />
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-neutral-400 hover:text-neutral-700 mt-1"
                onClick={() => setProjDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Project
              </Button>
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3 flex items-center gap-2">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback>{generateInitials(user?.name ?? 'U')}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-neutral-700 flex-1 truncate">{user?.name}</span>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      <CreateWorkspaceDialog
        open={wsDialogOpen}
        onOpenChange={setWsDialogOpen}
      />

      {activeWorkspaceId && (
        <CreateProjectDialog
          open={projDialogOpen}
          onOpenChange={setProjDialogOpen}
          workspaceId={activeWorkspaceId}
        />
      )}
    </>
  )
}

function NavItem({
  to, icon, label, active,
}: {
  to: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  )
}
