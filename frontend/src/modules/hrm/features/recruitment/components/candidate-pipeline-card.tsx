import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/lib/utils'
import type { Candidate } from '../hooks/use-candidates'

interface CandidatePipelineCardProps {
  candidate: Candidate
  onSelect?: (id: string) => void
}

/** Draggable candidate card for the recruitment pipeline board */
export function CandidatePipelineCard({ candidate, onSelect }: CandidatePipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    data: { candidate },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card rounded-md border border-border p-3 shadow-sm cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-shadow select-none',
      )}
    >
      <p className="text-sm font-medium text-foreground truncate">{candidate.name}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{candidate.email}</p>
      {candidate.phone && (
        <p className="text-xs text-muted-foreground mt-0.5">{candidate.phone}</p>
      )}
      {onSelect && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onSelect(candidate.id) }}
          className="mt-2 text-xs text-primary hover:underline"
        >
          View details →
        </button>
      )}
    </div>
  )
}
