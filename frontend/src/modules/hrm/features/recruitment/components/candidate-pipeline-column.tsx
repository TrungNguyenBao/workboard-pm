import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/shared/lib/utils'
import { CandidatePipelineCard } from './candidate-pipeline-card'
import type { Candidate } from '../hooks/use-candidates'

interface CandidatePipelineColumnProps {
  stage: string
  label: string
  candidates: Candidate[]
  onSelectCandidate?: (id: string) => void
}

/** Droppable column representing one recruitment pipeline stage */
export function CandidatePipelineColumn({ stage, label, candidates, onSelectCandidate }: CandidatePipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${stage}`, data: { stage } })

  return (
    <div className="flex w-56 flex-shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        <span className="text-xs text-muted-foreground">{candidates.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[120px] flex-1 space-y-2 rounded-md p-2 transition-colors',
          isOver ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/30',
        )}
      >
        {candidates.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">No candidates</p>
        )}
        {candidates.map((c) => (
          <CandidatePipelineCard key={c.id} candidate={c} onSelect={onSelectCandidate} />
        ))}
      </div>
    </div>
  )
}
