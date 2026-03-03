import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type PayrollRecord, useCreatePayrollRecord, useUpdatePayrollRecord } from '../hooks/use-payroll'
import { useEmployees } from '../../employees/hooks/use-employees'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  record?: PayrollRecord | null
}

export function PayrollFormDialog({ open, onOpenChange, workspaceId, record }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <PayrollFormContent workspaceId={workspaceId} record={record} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function PayrollFormContent({ workspaceId, record, onOpenChange }: Omit<Props, 'open'>) {
  const { t } = useTranslation('hrm')
  const createRecord = useCreatePayrollRecord(workspaceId)
  const updateRecord = useUpdatePayrollRecord(workspaceId)
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 100 })
  const isEdit = !!record

  const [employeeId, setEmployeeId] = useState(record?.employee_id ?? '')
  const [period, setPeriod] = useState(record?.period ?? '')
  const [gross, setGross] = useState(record?.gross?.toString() ?? '0')
  const [net, setNet] = useState(record?.net?.toString() ?? '0')
  const [status, setStatus] = useState(record?.status ?? 'draft')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && !employeeId) return
    if (!period.match(/^\d{4}-\d{2}$/)) return
    try {
      if (isEdit) {
        await updateRecord.mutateAsync({
          recordId: record.id,
          gross: parseFloat(gross) || 0,
          net: parseFloat(net) || 0,
          status,
        })
        toast({ title: 'Payroll record updated', variant: 'success' })
      } else {
        await createRecord.mutateAsync({
          employee_id: employeeId,
          period,
          gross: parseFloat(gross) || 0,
          net: parseFloat(net) || 0,
        })
        toast({ title: 'Payroll record created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save payroll record', variant: 'error' })
    }
  }

  const pending = createRecord.isPending || updateRecord.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit payroll record' : t('payroll.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div className="space-y-1.5">
            <Label>{t('employees.title')} *</Label>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pr-period">Period * (YYYY-MM)</Label>
            <Input
              id="pr-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-03"
              disabled={isEdit}
            />
          </div>
          {isEdit && (
            <div className="space-y-1.5">
              <Label>{t('common:common.status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pr-gross">Gross</Label>
            <Input id="pr-gross" type="number" min="0" step="0.01" value={gross} onChange={(e) => setGross(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-net">Net</Label>
            <Input id="pr-net" type="number" min="0" step="0.01" value={net} onChange={(e) => setNet(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || (!isEdit && !employeeId) || !period}>
            {pending ? t('common:common.loading') : isEdit ? t('common:common.save') : t('payroll.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
