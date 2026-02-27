import { cn } from '@/shared/lib/utils'
import type { Goal } from '../hooks/use-goals'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  on_track:  { label: 'On Track',  className: 'bg-green-100 text-green-700' },
  at_risk:   { label: 'At Risk',   className: 'bg-yellow-100 text-yellow-700' },
  off_track: { label: 'Off Track', className: 'bg-red-100 text-red-700' },
  achieved:  { label: 'Achieved',  className: 'bg-blue-100 text-blue-700' },
  dropped:   { label: 'Dropped',   className: 'bg-neutral-100 text-neutral-500' },
}

const PROGRESS_COLOR: Record<string, string> = {
  on_track:  '#27AE60',
  at_risk:   '#F2C94C',
  off_track: '#E36857',
  achieved:  '#2F80ED',
  dropped:   '#9CA3AF',
}

interface Props {
  goal: Goal
  onClick: () => void
}

export function GoalCard({ goal, onClick }: Props) {
  const statusCfg = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.on_track
  const progressColor = PROGRESS_COLOR[goal.status] ?? PROGRESS_COLOR.on_track
  const isOverdue =
    goal.due_date && new Date(goal.due_date) < new Date() && goal.status !== 'achieved' && goal.status !== 'dropped'

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col rounded-md border border-border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none w-full overflow-hidden"
    >
      {/* Left color bar */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
        style={{ backgroundColor: goal.color }}
      />

      <div className="pl-2">
        {/* Title + status badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 flex-1">
            {goal.title}
          </p>
          <span className={cn('flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', statusCfg.className)}>
            {statusCfg.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Progress</span>
            <span className="font-medium text-neutral-700">{Math.round(goal.progress_value)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-100">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, goal.progress_value)}%`, backgroundColor: progressColor }}
            />
          </div>
        </div>

        {/* Footer: owner, due date, linked counts */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-neutral-400 min-w-0">
            {goal.owner_name && (
              <span className="truncate max-w-[90px]">{goal.owner_name}</span>
            )}
            {(goal.linked_project_count > 0 || goal.linked_task_count > 0) && (
              <span className="truncate">
                {[
                  goal.linked_project_count > 0 && `${goal.linked_project_count} project${goal.linked_project_count !== 1 ? 's' : ''}`,
                  goal.linked_task_count > 0 && `${goal.linked_task_count} task${goal.linked_task_count !== 1 ? 's' : ''}`,
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          {goal.due_date && (
            <span className={cn('text-xs flex-shrink-0', isOverdue ? 'text-red-500 font-medium' : 'text-neutral-400')}>
              {new Date(goal.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
