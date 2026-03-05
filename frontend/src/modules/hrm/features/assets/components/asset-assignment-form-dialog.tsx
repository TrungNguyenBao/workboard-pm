import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { useCreateAssetAssignment } from '../hooks/use-asset-assignments'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  assetId: string
  assetName: string
}

const CONDITIONS = ['excellent', 'good', 'fair', 'poor']

export function AssetAssignmentFormDialog({ open, onOpenChange, workspaceId, assetId, assetName }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <AssignContent
        workspaceId={workspaceId}
        assetId={assetId}
        assetName={assetName}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  )
}

function AssignContent({ workspaceId, assetId, assetName, onOpenChange }: Omit<Props, 'open'>) {
  const createAssignment = useCreateAssetAssignment(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })

  const [employeeId, setEmployeeId] = useState('')
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
  const [condition, setCondition] = useState('good')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) return
    try {
      await createAssignment.mutateAsync({
        asset_id: assetId,
        employee_id: employeeId,
        assigned_date: assignedDate,
        condition_on_assign: condition,
      })
      toast({ title: 'Asset assigned', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to assign asset', variant: 'error' })
    }
  }

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Assign: {assetName}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="aa-date">Assigned Date *</Label>
            <Input id="aa-date" type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={createAssignment.isPending || !employeeId}>
            {createAssignment.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
