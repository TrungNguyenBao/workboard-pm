import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Plus, Layers, AlertCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  usePipelineStages,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  useReorderStages,
  useSeedDefaultStages,
  type PipelineStage,
} from '../hooks/use-pipeline-stages'

interface StageRowProps {
  stage: PipelineStage
  onUpdate: (stageId: string, name: string, probability: number) => void
  onDelete: (stageId: string) => void
}

function SortableStageRow({ stage, onUpdate, onDelete }: StageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [name, setName] = useState(stage.name)
  const [prob, setProb] = useState(String(Math.round(stage.default_probability * 100)))

  function handleBlur() {
    const pctVal = Math.min(100, Math.max(0, Number(prob) || 0))
    onUpdate(stage.id, name.trim() || stage.name, pctVal / 100)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
    >
      <button
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <input
        className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none border-b border-transparent focus:border-primary transition-colors"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleBlur}
      />

      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min={0}
          max={100}
          className="w-16 text-sm text-right bg-transparent outline-none border-b border-transparent focus:border-primary transition-colors text-muted-foreground"
          value={prob}
          onChange={(e) => setProb(e.target.value)}
          onBlur={handleBlur}
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>

      <button
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
        onClick={() => onDelete(stage.id)}
        title="Delete stage"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function PipelineSettingsPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data: stages = [], isLoading, isError } = usePipelineStages(workspaceId)
  const createStage = useCreateStage(workspaceId)
  const updateStage = useUpdateStage(workspaceId)
  const deleteStage = useDeleteStage(workspaceId)
  const reorderStages = useReorderStages(workspaceId)
  const seedStages = useSeedDefaultStages(workspaceId)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(stages, oldIndex, newIndex)
    reorderStages.mutate(reordered.map((s) => s.id))
  }

  function handleUpdate(stageId: string, name: string, default_probability: number) {
    const stage = stages.find((s) => s.id === stageId)
    if (!stage || (stage.name === name && stage.default_probability === default_probability)) return
    updateStage.mutate({ stageId, name, default_probability })
  }

  function handleDelete(stageId: string) {
    if (!confirm('Delete this pipeline stage? This will fail if deals are using it.')) return
    deleteStage.mutate(stageId)
  }

  function handleAddStage() {
    createStage.mutate({ name: 'New Stage', default_probability: 0 })
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Failed to load pipeline stages. Admin access required.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Pipeline Stages</h2>
            <p className="text-sm text-muted-foreground">Drag to reorder, click to rename or set probability</p>
          </div>
        </div>
        {stages.length === 0 && (
          <button
            onClick={() => seedStages.mutate()}
            disabled={seedStages.isPending}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Load defaults
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 px-3 pb-1 text-xs text-muted-foreground font-medium">
          <span className="w-4" />
          <span className="flex-1">Stage Name</span>
          <span className="w-20 text-right">Win Prob.</span>
          <span className="w-4" />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {stages.map((stage) => (
                <SortableStageRow
                  key={stage.id}
                  stage={stage}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <button
        onClick={handleAddStage}
        disabled={createStage.isPending}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Stage
      </button>
    </div>
  )
}
