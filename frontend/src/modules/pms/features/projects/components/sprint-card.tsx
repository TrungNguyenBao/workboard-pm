import { CalendarDays, Target, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import type { Sprint } from '../hooks/use-sprints'

interface Props {
  sprint: Sprint
  onComplete?: (sprintId: string) => void
  variant?: 'active' | 'history'
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-muted text-muted-foreground',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysRemaining(endDate: string | null): { text: string; overdue: boolean } | null {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
  if (diff > 0) return { text: `${diff} day${diff !== 1 ? 's' : ''} left`, overdue: false }
  if (diff === 0) return { text: 'Ends today', overdue: false }
  return { text: `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} overdue`, overdue: true }
}

export function SprintCard({ sprint, onComplete, variant = 'history' }: Props) {
  const progressPct = sprint.total_points > 0
    ? Math.round((sprint.completed_points / sprint.total_points) * 100)
    : 0
  const remaining = variant === 'active' ? daysRemaining(sprint.end_date) : null

  return (
    <div className={cn(
      'border border-border rounded-lg p-4',
      variant === 'active' && 'bg-muted/20',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground">{sprint.name}</h3>
        <Badge variant="secondary" className={cn('text-[10px]', STATUS_COLORS[sprint.status])}>
          {sprint.status}
        </Badge>
        {remaining && (
          <Badge variant="outline" className={cn('text-[10px] ml-auto', remaining.overdue && 'border-red-400 text-red-600')}>
            {remaining.text}
          </Badge>
        )}
      </div>

      {/* Dates + Goal */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}
        </span>
        {sprint.goal && (
          <span className="flex items-center gap-1 italic">
            <Target className="h-3 w-3" />
            {sprint.goal}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-foreground w-10 text-right">{progressPct}%</span>
        <span className="text-xs text-muted-foreground">
          {sprint.completed_points}/{sprint.total_points} pts
        </span>
        <span className="text-xs text-muted-foreground">
          {sprint.task_count} task{sprint.task_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Complete action */}
      {variant === 'active' && onComplete && (
        <div className="mt-3">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onComplete(sprint.id)}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Complete Sprint
          </Button>
        </div>
      )}
    </div>
  )
}
