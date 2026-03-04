import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type KpiTemplate, useCreateKpiTemplate, useUpdateKpiTemplate } from '../hooks/use-kpi-templates'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  template?: KpiTemplate | null
}

export function KpiTemplateFormDialog({ open, onOpenChange, workspaceId, template }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <KpiTemplateFormContent workspaceId={workspaceId} template={template} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function KpiTemplateFormContent({
  workspaceId,
  template,
  onOpenChange,
}: Omit<Props, 'open'>) {
  const isEdit = !!template
  const create = useCreateKpiTemplate(workspaceId)
  const update = useUpdateKpiTemplate(workspaceId)

  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [category, setCategory] = useState(template?.category ?? '')
  const [measurementUnit, setMeasurementUnit] = useState(template?.measurement_unit ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      measurement_unit: measurementUnit.trim() || null,
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ templateId: template!.id, ...payload })
        toast({ title: 'KPI template updated', variant: 'success' })
      } else {
        await create.mutateAsync(payload)
        toast({ title: 'KPI template created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save KPI template', variant: 'error' })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit KPI Template' : 'New KPI Template'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="kt-name">Name *</Label>
          <Input id="kt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Revenue Target" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kt-category">Category</Label>
          <Input id="kt-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. sales, quality" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kt-unit">Measurement Unit</Label>
          <Input id="kt-unit" value={measurementUnit} onChange={(e) => setMeasurementUnit(e.target.value)} placeholder="e.g. %, count, score" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kt-desc">Description</Label>
          <Input id="kt-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
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
