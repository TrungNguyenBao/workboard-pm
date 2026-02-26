import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CheckSquare,
  FolderOpen,
  Home,
  LogOut,
  Plus,
  Settings,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { cn, generateInitials } from '@/shared/lib/utils'
import api from '@/shared/lib/api'

interface Project {
  id: string
  name: string
  color: string
  icon?: string
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () =>
      api.get(`/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId,
  })

  function isActive(path: string) {
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-neutral-50">
      {/* Workspace Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">W</div>
        <span className="text-sm font-semibold text-neutral-900 truncate">WorkBoard</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NavItem to="/my-tasks" icon={<Home className="h-4 w-4" />} label="My Tasks" active={isActive('/my-tasks')} />

        <div className="pt-4 pb-1 px-2">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Projects</span>
        </div>

        {projects.map((p) => (
          <NavItem
            key={p.id}
            to={`/projects/${p.id}/board`}
            icon={
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            }
            label={p.name}
            active={isActive(`/projects/${p.id}`)}
          />
        ))}

        {activeWorkspaceId && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-neutral-400 hover:text-neutral-700 mt-1"
            onClick={() => {/* open create project dialog */}}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Project
          </Button>
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
  )
}

function NavItem({
  to,
  icon,
  label,
  active,
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
