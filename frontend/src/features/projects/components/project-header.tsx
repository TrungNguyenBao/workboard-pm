import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutGrid, List, Calendar, Search, BarChart2, GanttChart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { CommandPalette } from '@/features/search/components/command-palette'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'

interface Project { id: string; name: string; color: string }

const VIEWS = [
  { key: 'board', label: 'Board', icon: LayoutGrid },
  { key: 'list', label: 'List', icon: List },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'overview', label: 'Overview', icon: BarChart2 },
  { key: 'timeline', label: 'Timeline', icon: GanttChart },
] as const

type View = typeof VIEWS[number]['key']

interface Props {
  activeView: View
  actions?: React.ReactNode
}

export function ProjectHeader({ activeView, actions }: Props) {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  return (
    <header className="flex flex-col border-b border-border bg-white">
      {/* Top row: project name + search/bell */}
      <div className="flex h-11 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          {project?.color && (
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          )}
          <h1 className="text-sm font-semibold text-neutral-900">{project?.name ?? '…'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(true)} title="Search (⌘K)">
            <Search className="h-4 w-4" />
          </Button>
          <NotificationBell />
          <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-0.5 px-4 pb-0">
        {VIEWS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => navigate(`/projects/${projectId}/${key}`)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              activeView === key
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-200',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}
