import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useEmployees } from '../../employees/hooks/use-employees'
import { type InsuranceRecord, useCreateInsurance, useUpdateInsurance } from '../hooks/use-insurance'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  record?: InsuranceRecord | null
}

export function InsuranceFormDialog({ open, onOpenChange, workspaceId, record }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <InsuranceFormContent workspaceId={workspaceId} record={record} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function InsuranceFormContent({ workspaceId, record, onOpenChange }: Omit<Props, 'open'>) {
  const createRecord = useCreateInsurance(workspaceId)
  const updateRecord = useUpdateInsurance(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })
  const isEdit = !!record

  const [employeeId, setEmployeeId] = useState(record?.employee_id ?? '')
  const [insuranceType, setInsuranceType] = useState(record?.insurance_type ?? 'bhxh')
  const [baseSalary, setBaseSalary] = useState(record?.base_salary?.toString() ?? '')
  const [employeeRate, setEmployeeRate] = useState(
    record ? (record.employee_rate * 100).toFixed(2) : ''
  )
  const [employerRate, setEmployerRate] = useState(
    record ? (record.employer_rate * 100).toFixed(2) : ''
  )
  const [effectiveFrom, setEffectiveFrom] = useState(record?.effective_from ?? '')
  const [effectiveTo, setEffectiveTo] = useState(record?.effective_to ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (isEdit) {
        await updateRecord.mutateAsync({
          recordId: record.id,
          base_salary: parseFloat(baseSalary),
          employee_rate: parseFloat(employeeRate) / 100,
          employer_rate: parseFloat(employerRate) / 100,
          effective_to: effectiveTo || null,
        })
        toast({ title: 'Insurance record updated', variant: 'success' })
      } else {
        await createRecord.mutateAsync({
          employee_id: employeeId,
          insurance_type: insuranceType,
          base_salary: parseFloat(baseSalary),
          employee_rate: parseFloat(employeeRate) / 100,
          employer_rate: parseFloat(employerRate) / 100,
          effective_from: effectiveFrom,
          effective_to: effectiveTo || null,
        })
        toast({ title: 'Insurance record created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save insurance record', variant: 'error' })
    }
  }

  const pending = createRecord.isPending || updateRecord.isPending
  const canSubmit = !(!isEdit && (!employeeId || !effectiveFrom)) && !!baseSalary && !!employeeRate && !!employerRate

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit insurance record' : 'New insurance record'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
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
        )}
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>Insurance Type *</Label>
            <Select value={insuranceType} onValueChange={setInsuranceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bhxh">BHXH (Social Insurance)</SelectItem>
                <SelectItem value="bhyt">BHYT (Health Insurance)</SelectItem>
                <SelectItem value="bhtn">BHTN (Unemployment Insurance)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="ins-base-salary">Base Salary (VND) *</Label>
          <Input
            id="ins-base-salary"
            type="number"
            min="0"
            step="1000"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ins-emp-rate">Employee Rate (%) *</Label>
            <Input
              id="ins-emp-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={employeeRate}
              onChange={(e) => setEmployeeRate(e.target.value)}
              placeholder="e.g. 8"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-er-rate">Employer Rate (%) *</Label>
            <Input
              id="ins-er-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={employerRate}
              onChange={(e) => setEmployerRate(e.target.value)}
              placeholder="e.g. 17.5"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="ins-from">Effective From *</Label>
              <Input id="ins-from" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ins-to">Effective To</Label>
            <Input id="ins-to" type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !canSubmit}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
