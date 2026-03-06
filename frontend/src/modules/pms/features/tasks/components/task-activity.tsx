import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { formatRelativeTime, generateInitials } from '@/shared/lib/utils'
import api from '@/shared/lib/api'

interface ActivityEntry {
  id: string
  entity_type: string
  entity_id: string
  action: string
  changes: Record<string, string> | null
  actor_name: string
  actor_avatar_url: string | null
  created_at: string
}

function describeAction(entry: ActivityEntry): string {
  const { action, changes } = entry
  if (action === 'created') return 'created this task'
  if (action === 'deleted') return 'deleted this task'
  if (action === 'commented') return 'commented'
  if (action === 'completed') return 'marked as complete'
  if (action === 'updated' && changes) {
    if (changes.field === 'status') return `changed status to ${changes.new}`
    if (changes.field === 'priority') return `set priority to ${changes.new}`
    if (changes.field === 'assignee_id') return 'changed the assignee'
    if (changes.field === 'due_date') return 'updated the due date'
    if (changes.field === 'title') return 'updated the title'
    return 'updated this task'
  }
  return `${action} this task`
}

interface Props {
  taskId: string
  projectId: string
}

export function TaskActivity({ taskId, projectId }: Props) {
  const { data: entries = [], isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ['activity', 'task', taskId],
    queryFn: () =>
      api.get(`/pms/projects/${projectId}/tasks/${taskId}/activity?limit=20`).then((r) => r.data),
    enabled: !!taskId,
  })

  if (isLoading) {
    return <p className="text-xs text-neutral-400 py-2">Loading…</p>
  }

  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-2 items-start">
          <Avatar className="h-5 w-5 flex-shrink-0 mt-0.5">
            <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
              {generateInitials(entry.actor_name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">{entry.actor_name}</span>{' '}
            {describeAction(entry)}{' '}
            <span className="text-muted-foreground/70">{formatRelativeTime(entry.created_at)}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
