import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { useCreateKpiAssignment } from '../hooks/use-kpi-assignments'
import { useKpiTemplates } from '../hooks/use-kpi-templates'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function KpiAssignmentFormDialog({ open, onOpenChange, workspaceId }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <KpiAssignmentFormContent workspaceId={workspaceId} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function KpiAssignmentFormContent({ workspaceId, onOpenChange }: Omit<Props, 'open'>) {
  const create = useCreateKpiAssignment(workspaceId)
  const { data: templatesData } = useKpiTemplates(workspaceId, { page_size: 100 })
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })

  const [templateId, setTemplateId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [period, setPeriod] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [weight, setWeight] = useState('1')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!templateId || !employeeId || !period || !targetValue) return
    try {
      await create.mutateAsync({
        template_id: templateId,
        employee_id: employeeId,
        period,
        target_value: parseFloat(targetValue),
        weight: parseInt(weight) || 1,
      })
      toast({ title: 'KPI assignment created', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to create KPI assignment', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New KPI Assignment</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>KPI Template *</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
            <SelectContent>
              {(templatesData?.items ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Employee *</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {(employeesData?.items ?? []).map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="ka-period">Period *</Label>
            <Input id="ka-period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-Q1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ka-target">Target *</Label>
            <Input id="ka-target" type="number" min="0" step="0.01" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ka-weight">Weight</Label>
            <Input id="ka-weight" type="number" min="1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || !templateId || !employeeId || !period || !targetValue}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
