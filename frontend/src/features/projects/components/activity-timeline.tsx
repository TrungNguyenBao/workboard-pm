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
  const { action, entity_type, changes } = entry
  if (action === 'created') return `created a ${entity_type}`
  if (action === 'deleted') return `deleted a ${entity_type}`
  if (action === 'commented') return `commented on a ${entity_type}`
  if (action === 'completed') return `completed a ${entity_type}`
  if (action === 'updated' && changes) {
    const field = changes.field ?? (changes.fields ? 'multiple fields' : 'a field')
    if (changes.field === 'status') return `changed status to ${changes.new}`
    if (changes.field === 'priority') return `set priority to ${changes.new}`
    if (changes.field === 'assignee_id') return `changed the assignee`
    if (changes.field === 'due_date') return `updated the due date`
    return `updated ${field} on a ${entity_type}`
  }
  return `${action} a ${entity_type}`
}

interface Props {
  projectId: string
}

export function ActivityTimeline({ projectId }: Props) {
  const { data: entries = [], isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ['activity', projectId],
    queryFn: () => api.get(`/projects/${projectId}/activity?limit=20`).then((r) => r.data),
    enabled: !!projectId,
  })

  if (isLoading) {
    return <p className="text-xs text-neutral-400 py-4">Loading activity…</p>
  }

  if (entries.length === 0) {
    return <p className="text-xs text-neutral-400 py-4">No recent activity</p>
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-2">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {generateInitials(entry.actor_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-700 leading-relaxed">
              <span className="font-medium">{entry.actor_name}</span>{' '}
              {describeAction(entry)}
            </p>
            <p className="text-xs text-neutral-400">{formatRelativeTime(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
