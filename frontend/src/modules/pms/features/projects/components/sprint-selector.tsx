import { useState, useEffect } from 'react'
import { ChevronDown, Settings } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Badge } from '@/shared/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { useSprints } from '../hooks/use-sprints'
import { SprintManageDialog } from './sprint-manage-dialog'

interface Props {
  projectId: string
  selectedSprintId: string | null
  onSelect: (sprintId: string | null) => void
}

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `${fmt(start)} – ?`
  return ''
}

function progressLabel(completed: number, total: number): string {
  return `${completed}/${total} pts`
}

export function SprintSelector({ projectId, selectedSprintId, onSelect }: Props) {
  const { data: sprints = [] } = useSprints(projectId)
  const [manageOpen, setManageOpen] = useState(false)

  // Auto-select active sprint on first load
  const activeSprint = sprints.find((s) => s.status === 'active')
  useEffect(() => {
    if (selectedSprintId === null && activeSprint) {
      onSelect(activeSprint.id)
    }
  }, [activeSprint?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = sprints.find((s) => s.id === selectedSprintId)
  const label = selected ? selected.name : 'Backlog'

  const nonCompleted = sprints.filter((s) => s.status !== 'completed')
  const completedSprints = sprints.filter((s) => s.status === 'completed')

  return (
    <>
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-background">
        <span className="text-xs font-medium text-muted-foreground">Sprint:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              {label}
              {selected && (
                <span className="text-muted-foreground ml-1">
                  ({progressLabel(selected.completed_points, selected.total_points)})
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuItem onClick={() => onSelect(null)}>
              Backlog
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <TooltipProvider delayDuration={300}>
              {nonCompleted.map((sprint) => (
                <Tooltip key={sprint.id}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem onClick={() => onSelect(sprint.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{sprint.name}</span>
                          <Badge
                            variant={sprint.status === 'active' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {sprint.status}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {formatDateRange(sprint.start_date, sprint.end_date) && (
                            <span>{formatDateRange(sprint.start_date, sprint.end_date)}</span>
                          )}
                          <span>{progressLabel(sprint.completed_points, sprint.total_points)}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  {sprint.goal && (
                    <TooltipContent side="right" className="max-w-48 text-xs">
                      {sprint.goal}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </TooltipProvider>
            {completedSprints.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {completedSprints.slice(0, 5).map((sprint) => (
                  <DropdownMenuItem
                    key={sprint.id}
                    onClick={() => onSelect(sprint.id)}
                    className="opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{sprint.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {sprint.completed_points} pts
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] ml-2">done</Badge>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setManageOpen(true)}>
              <Settings className="h-3.5 w-3.5 mr-2" />
              Manage Sprints
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sprint goal + days remaining inline */}
        {selected?.goal && (
          <span className="text-xs text-muted-foreground italic truncate max-w-64">
            Goal: {selected.goal}
          </span>
        )}
        {selected && <DaysRemainingBadge endDate={selected.end_date} />}
      </div>
      <SprintManageDialog
        projectId={projectId}
        open={manageOpen}
        onOpenChange={setManageOpen}
      />
    </>
  )
}

function DaysRemainingBadge({ endDate }: { endDate: string | null }) {
  if (!endDate) return null
  // eslint-disable-next-line react-hooks/purity -- Date.now() in render is acceptable for date diff display
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
  let text: string
  const variant: 'default' | 'outline' = 'outline'
  let className = 'text-[10px]'

  if (diff > 0) {
    text = `${diff}d left`
  } else if (diff === 0) {
    text = 'Ends today'
    className += ' border-amber-400 text-amber-600'
  } else {
    text = `${Math.abs(diff)}d overdue`
    className += ' border-red-400 text-red-600'
  }

  return <Badge variant={variant} className={className}>{text}</Badge>
}
