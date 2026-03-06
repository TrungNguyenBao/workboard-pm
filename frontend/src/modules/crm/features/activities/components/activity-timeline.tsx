import { Badge } from '@/shared/components/ui/badge'
import { type Activity, ACTIVITY_TYPES } from '../hooks/use-activities'

interface Props {
  activities: Activity[]
}

const TYPE_COLORS: Record<string, string> = {
  call: 'bg-blue-500',
  email: 'bg-green-500',
  meeting: 'bg-purple-500',
  demo: 'bg-amber-500',
  follow_up: 'bg-rose-500',
}

export function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No activities yet</p>
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${TYPE_COLORS[activity.type] ?? 'bg-muted-foreground'}`} />
            <div className="w-px flex-1 bg-border" />
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {ACTIVITY_TYPES.find((t) => t.value === activity.type)?.label ?? activity.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(activity.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm font-medium mt-0.5">{activity.subject}</p>
            {activity.notes && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
