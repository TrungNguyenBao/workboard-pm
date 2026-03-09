import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { CandidatePipelineColumn } from './candidate-pipeline-column'
import { CandidatePipelineCard } from './candidate-pipeline-card'
import { useMoveCandidate } from '../hooks/use-move-candidate'
import type { Candidate } from '../hooks/use-candidates'

export const CANDIDATE_STAGES = [
  'applied',
  'screening',
  'assessment',
  'interviewing',
  'offered',
  'hired',
  'rejected',
] as const

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  assessment: 'Assessment',
  interviewing: 'Interviewing',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
}

interface CandidatePipelineBoardProps {
  workspaceId: string
  candidates: Candidate[]
  onSelectCandidate?: (id: string) => void
}

/** DnD kanban board for the recruitment candidate pipeline */
export function CandidatePipelineBoard({ workspaceId, candidates, onSelectCandidate }: CandidatePipelineBoardProps) {
  const moveCandidate = useMoveCandidate(workspaceId)
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function candidatesForStage(stage: string) {
    return candidates.filter((c) => c.status === stage)
  }

  function handleDragStart(e: DragStartEvent) {
    const found = candidates.find((c) => c.id === e.active.id)
    if (found) setActiveCandidate(found)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveCandidate(null)
    const { active, over } = e
    if (!over) return

    const candidate = candidates.find((c) => c.id === active.id)
    if (!candidate) return

    const overId = String(over.id)
    const targetStage = overId.startsWith('column-')
      ? overId.replace('column-', '')
      : candidates.find((c) => c.id === overId)?.status ?? candidate.status

    if (targetStage === candidate.status) return

    moveCandidate.mutate({ candidateId: candidate.id, status: targetStage })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {CANDIDATE_STAGES.map((stage) => (
          <CandidatePipelineColumn
            key={stage}
            stage={stage}
            label={STAGE_LABELS[stage]}
            candidates={candidatesForStage(stage)}
            onSelectCandidate={onSelectCandidate}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCandidate && <CandidatePipelineCard candidate={activeCandidate} />}
      </DragOverlay>
    </DndContext>
  )
}
