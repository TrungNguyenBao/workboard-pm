import { LayoutGrid, List, Layers } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type ProjectType = 'basic' | 'kanban' | 'agile'

const TYPES = [
  { key: 'basic' as const, label: 'Basic', icon: List, description: 'Simple lists, calendar, timeline' },
  { key: 'kanban' as const, label: 'Kanban', icon: LayoutGrid, description: 'Visual board with columns' },
  { key: 'agile' as const, label: 'Agile', icon: Layers, description: 'Sprints, backlog, story points' },
]

interface Props {
  value: ProjectType
  onChange: (type: ProjectType) => void
}

export function ProjectTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TYPES.map(({ key, label, icon: Icon, description }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
            value === key
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
          <span className="text-[10px] leading-tight">{description}</span>
        </button>
      ))}
    </div>
  )
}
