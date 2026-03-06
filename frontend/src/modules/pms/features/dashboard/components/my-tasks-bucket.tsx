import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { MyTasksRow } from './my-tasks-row'
import type { Task } from '@/modules/pms/features/projects/hooks/use-project-tasks'

interface Props {
  label: string
  tasks: Task[]
  workspaceId: string
  projectMap: Map<string, string>
  onOpen: (t: Task) => void
  accent?: 'red' | 'amber' | 'neutral'
}

export function MyTasksBucket({ label, tasks, workspaceId, projectMap, onOpen, accent }: Props) {
  if (tasks.length === 0) return null

  const headerCls = accent === 'red'
    ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/40'
    : accent === 'amber'
      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'
      : 'bg-muted/30 border-border'
  const labelCls = accent === 'red'
    ? 'text-red-600'
    : accent === 'amber'
      ? 'text-amber-600'
      : 'text-muted-foreground'
  const badgeVariant = accent === 'red' ? 'danger' : accent === 'amber' ? 'warning' : 'secondary'

  return (
    <section className="mb-6">
      <div className={cn('flex items-center gap-2 px-4 py-2 border-b', headerCls)}>
        <span className={cn('text-xs font-semibold uppercase tracking-wide', labelCls)}>{label}</span>
        <Badge variant={badgeVariant}>{tasks.length}</Badge>
      </div>
      {tasks.map((t) => (
        <MyTasksRow
          key={t.id}
          task={t}
          workspaceId={workspaceId}
          projectName={projectMap.get(t.project_id)}
          onOpen={onOpen}
        />
      ))}
    </section>
  )
}
