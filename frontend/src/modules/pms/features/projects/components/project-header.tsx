import { useNavigate, useParams } from 'react-router-dom'
import { LayoutGrid, List, Calendar, BarChart2, GanttChart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'

interface Project { id: string; name: string; color: string }

type View = 'board' | 'list' | 'calendar' | 'overview' | 'timeline'

interface Props {
  activeView: View
  actions?: React.ReactNode
}

export function ProjectHeader({ activeView, actions }: Props) {
  const { t } = useTranslation('pms')
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const VIEWS = [
    { key: 'board' as const, label: t('project.views.board'), icon: LayoutGrid },
    { key: 'list' as const, label: t('project.views.list'), icon: List },
    { key: 'calendar' as const, label: t('project.views.calendar'), icon: Calendar },
    { key: 'overview' as const, label: t('project.views.overview'), icon: BarChart2 },
    { key: 'timeline' as const, label: t('project.views.timeline'), icon: GanttChart },
  ]

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/pms/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  })

  return (
    <header className="flex flex-col border-b border-border bg-background">
      <div className="flex h-11 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          {project?.color && (
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          )}
          <h1 className="text-sm font-semibold text-foreground">{project?.name ?? '…'}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="flex items-center gap-0.5 px-4 pb-0">
        {VIEWS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => navigate(`/pms/projects/${projectId}/${key}`)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              activeView === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
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
