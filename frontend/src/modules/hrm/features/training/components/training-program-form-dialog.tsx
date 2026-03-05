import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import {
  type TrainingProgram,
  useCreateTrainingProgram,
  useUpdateTrainingProgram,
} from '../hooks/use-training-programs'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  program?: TrainingProgram | null
}

export function TrainingProgramFormDialog({ open, onOpenChange, workspaceId, program }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <TrainingProgramFormContent workspaceId={workspaceId} program={program} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function TrainingProgramFormContent({ workspaceId, program, onOpenChange }: Omit<Props, 'open'>) {
  const isEdit = !!program
  const create = useCreateTrainingProgram(workspaceId)
  const update = useUpdateTrainingProgram(workspaceId)

  const [name, setName] = useState(program?.name ?? '')
  const [description, setDescription] = useState(program?.description ?? '')
  const [budget, setBudget] = useState(program?.budget != null ? String(program.budget) : '')
  const [startDate, setStartDate] = useState(program?.start_date ?? '')
  const [endDate, setEndDate] = useState(program?.end_date ?? '')
  const [trainer, setTrainer] = useState(program?.trainer ?? '')
  const [status, setStatus] = useState(program?.status ?? 'planned')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      budget: budget ? parseFloat(budget) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      trainer: trainer.trim() || null,
      status,
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ programId: program!.id, ...payload })
        toast({ title: 'Training program updated', variant: 'success' })
      } else {
        await create.mutateAsync(payload)
        toast({ title: 'Training program created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save training program', variant: 'error' })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Training Program' : 'New Training Program'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tp-name">Name *</Label>
          <Input id="tp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leadership Bootcamp" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp-desc">Description</Label>
          <Input id="tp-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tp-budget">Budget</Label>
            <Input id="tp-budget" type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tp-trainer">Trainer</Label>
            <Input id="tp-trainer" value={trainer} onChange={(e) => setTrainer(e.target.value)} placeholder="Name or org" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tp-start">Start Date</Label>
            <Input id="tp-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tp-end">End Date</Label>
            <Input id="tp-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isPending || !name.trim()}>
            {isPending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
