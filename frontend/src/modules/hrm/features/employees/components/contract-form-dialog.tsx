import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Contract, useCreateContract, useUpdateContract } from '../hooks/use-contracts'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  employeeId: string
  contract?: Contract | null
}

export function ContractFormDialog({ open, onOpenChange, workspaceId, employeeId, contract }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <ContractFormContent
        workspaceId={workspaceId}
        employeeId={employeeId}
        contract={contract}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  )
}

function ContractFormContent({
  workspaceId,
  employeeId,
  contract,
  onOpenChange,
}: Omit<Props, 'open'>) {
  const createContract = useCreateContract(workspaceId)
  const updateContract = useUpdateContract(workspaceId)
  const isEdit = !!contract

  const [contractType, setContractType] = useState(contract?.contract_type ?? 'probation')
  const [startDate, setStartDate] = useState(contract?.start_date ?? '')
  const [endDate, setEndDate] = useState(contract?.end_date ?? '')
  const [baseSalary, setBaseSalary] = useState(String(contract?.base_salary ?? ''))
  const [fileUrl, setFileUrl] = useState(contract?.file_url ?? '')
  const [notes, setNotes] = useState(contract?.notes ?? '')
  const [contractStatus, setContractStatus] = useState(contract?.status ?? 'active')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !baseSalary) return
    try {
      const payload: Record<string, unknown> = {
        contract_type: contractType,
        start_date: startDate,
        end_date: contractType === 'indefinite' ? null : endDate || null,
        base_salary: parseFloat(baseSalary),
        file_url: fileUrl.trim() || null,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await updateContract.mutateAsync({ contractId: contract.id, ...payload, status: contractStatus })
        toast({ title: 'Contract updated', variant: 'success' })
      } else {
        await createContract.mutateAsync({ ...payload, employee_id: employeeId })
        toast({ title: 'Contract created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save contract', variant: 'error' })
    }
  }

  const pending = createContract.isPending || updateContract.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Contract' : 'New Contract'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Contract Type *</Label>
          <Select value={contractType} onValueChange={setContractType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="probation">Probation</SelectItem>
              <SelectItem value="fixed_term">Fixed Term</SelectItem>
              <SelectItem value="indefinite">Indefinite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-start">Start Date *</Label>
            <Input id="c-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          {contractType !== 'indefinite' && (
            <div className="space-y-1.5">
              <Label htmlFor="c-end">End Date</Label>
              <Input id="c-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-salary">Base Salary *</Label>
          <Input
            id="c-salary"
            type="number"
            min={0}
            step="0.01"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
          />
        </div>
        {isEdit && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={contractStatus} onValueChange={setContractStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="c-file">File URL</Label>
          <Input id="c-file" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-notes">Notes</Label>
          <textarea
            id="c-notes"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !startDate || !baseSalary}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
