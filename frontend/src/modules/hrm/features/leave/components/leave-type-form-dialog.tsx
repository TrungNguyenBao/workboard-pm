import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type LeaveType, useCreateLeaveType, useUpdateLeaveType } from '../hooks/use-leave'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  leaveType?: LeaveType | null
}

export function LeaveTypeFormDialog({ open, onOpenChange, workspaceId, leaveType }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <LeaveTypeFormContent workspaceId={workspaceId} leaveType={leaveType} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function LeaveTypeFormContent({ workspaceId, leaveType, onOpenChange }: Omit<Props, 'open'>) {
  const { t } = useTranslation('hrm')
  const createType = useCreateLeaveType(workspaceId)
  const updateType = useUpdateLeaveType(workspaceId)
  const isEdit = !!leaveType

  const [name, setName] = useState(leaveType?.name ?? '')
  const [daysPerYear, setDaysPerYear] = useState(leaveType?.days_per_year?.toString() ?? '0')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = { name: name.trim(), days_per_year: parseInt(daysPerYear) || 0 }
      if (isEdit) {
        await updateType.mutateAsync({ leaveTypeId: leaveType.id, ...payload })
        toast({ title: 'Leave type updated', variant: 'success' })
      } else {
        await createType.mutateAsync(payload)
        toast({ title: 'Leave type created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save leave type', variant: 'error' })
    }
  }

  const pending = createType.isPending || updateType.isPending

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit leave type' : 'New leave type'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lt-name">{t('common:common.name')} *</Label>
          <Input id="lt-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Annual, Sick" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lt-days">Days per year</Label>
          <Input id="lt-days" type="number" min="0" value={daysPerYear} onChange={(e) => setDaysPerYear(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? t('common:common.loading') : isEdit ? t('common:common.save') : 'Create type'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
