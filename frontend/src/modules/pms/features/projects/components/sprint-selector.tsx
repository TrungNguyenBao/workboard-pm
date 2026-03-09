import { useState } from 'react'
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
import { useSprints } from '../hooks/use-sprints'
import { SprintManageDialog } from './sprint-manage-dialog'

interface Props {
  projectId: string
  selectedSprintId: string | null
  onSelect: (sprintId: string | null) => void
}

const STATUS_BADGE: Record<string, 'default' | 'secondary'> = {
  planning: 'secondary',
  active: 'default',
  completed: 'secondary',
}

export function SprintSelector({ projectId, selectedSprintId, onSelect }: Props) {
  const { data: sprints = [] } = useSprints(projectId)
  const [manageOpen, setManageOpen] = useState(false)

  const selected = sprints.find((s) => s.id === selectedSprintId)
  const label = selected ? selected.name : 'Backlog'

  const activeSprints = sprints.filter((s) => s.status !== 'completed')
  const completedSprints = sprints.filter((s) => s.status === 'completed')

  return (
    <>
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-background">
        <span className="text-xs font-medium text-muted-foreground">Sprint:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              {label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => onSelect(null)}>
              Backlog
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {activeSprints.map((sprint) => (
              <DropdownMenuItem key={sprint.id} onClick={() => onSelect(sprint.id)}>
                <span className="flex-1 truncate">{sprint.name}</span>
                <Badge variant={STATUS_BADGE[sprint.status] ?? 'secondary'} className="text-[10px] ml-2">
                  {sprint.status}
                </Badge>
              </DropdownMenuItem>
            ))}
            {completedSprints.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {completedSprints.slice(0, 5).map((sprint) => (
                  <DropdownMenuItem
                    key={sprint.id}
                    onClick={() => onSelect(sprint.id)}
                    className="opacity-60"
                  >
                    <span className="flex-1 truncate">{sprint.name}</span>
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
      </div>
      <SprintManageDialog
        projectId={projectId}
        open={manageOpen}
        onOpenChange={setManageOpen}
      />
    </>
  )
}
