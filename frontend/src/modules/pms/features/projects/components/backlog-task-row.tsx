import { GripVertical, MoreHorizontal, ArrowRight, Inbox } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'
import type { Task } from '../hooks/use-project-tasks'
import type { Sprint } from '../hooks/use-sprints'

const TYPE_STYLES: Record<string, string> = {
  bug: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  story: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  epic: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  task: 'bg-muted text-muted-foreground',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-blue-600 dark:text-blue-400',
}

interface Props {
  task: Task
  sprints: Sprint[]
  onOpenTask: (task: Task) => void
  onMoveTo: (taskId: string, sprintId: string | null) => void
}

export function BacklogTaskRow({ task, sprints, onOpenTask, onMoveTo }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const availableSprints = sprints.filter((s) => s.status !== 'completed' && s.id !== task.sprint_id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-3 py-1.5 border-b border-border/50 hover:bg-muted/50 cursor-pointer',
        isDragging && 'opacity-40',
      )}
      onClick={() => onOpenTask(task)}
    >
      <span {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-50" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-3.5 w-3.5" />
      </span>

      <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>

      <Badge variant="secondary" className={cn('text-[10px] w-14 justify-center shrink-0', TYPE_STYLES[task.task_type] ?? TYPE_STYLES.task)}>
        {task.task_type ?? 'task'}
      </Badge>

      <span className="w-10 text-center text-xs text-muted-foreground shrink-0">
        {task.story_points ?? '--'}
      </span>

      <span className={cn('w-16 text-right text-xs capitalize shrink-0', PRIORITY_COLORS[task.priority] ?? 'text-muted-foreground')}>
        {task.priority !== 'none' ? task.priority : ''}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {availableSprints.map((s) => (
            <DropdownMenuItem key={s.id} onClick={(e) => { e.stopPropagation(); onMoveTo(task.id, s.id) }}>
              <ArrowRight className="h-3.5 w-3.5 mr-2" />
              Move to {s.name}
            </DropdownMenuItem>
          ))}
          {task.sprint_id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveTo(task.id, null) }}>
                <Inbox className="h-3.5 w-3.5 mr-2" />
                Move to Backlog
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
