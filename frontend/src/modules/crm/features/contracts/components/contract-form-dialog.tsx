import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Contract, BILLING_PERIODS, useCreateContract, useUpdateContract } from '../hooks/use-contracts'
import { useAccounts } from '../../accounts/hooks/use-accounts'
import { useDeals } from '../../deals/hooks/use-deals'

interface Props {
  open: boolean
  onClose: () => void
  workspaceId: string
  contract?: Contract | null
}

export function ContractFormDialog({ open, onClose, workspaceId, contract }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <ContractFormContent workspaceId={workspaceId} contract={contract} onClose={onClose} />
    </Dialog>
  )
}

function ContractFormContent({ workspaceId, contract, onClose }: Omit<Props, 'open'>) {
  const isEdit = !!contract
  const createContract = useCreateContract(workspaceId)
  const updateContract = useUpdateContract(workspaceId)
  const { data: accountsData } = useAccounts(workspaceId, { page_size: 100 })
  const { data: dealsData } = useDeals(workspaceId, { page_size: 100 })

  const [title, setTitle] = useState(contract?.title ?? '')
  const [accountId, setAccountId] = useState(contract?.account_id ?? '')
  const [dealId, setDealId] = useState(contract?.deal_id ?? 'none')
  const [startDate, setStartDate] = useState(contract?.start_date ?? '')
  const [endDate, setEndDate] = useState(contract?.end_date ?? '')
  const [value, setValue] = useState(contract?.value?.toString() ?? '0')
  const [billingPeriod, setBillingPeriod] = useState(contract?.billing_period ?? 'monthly')
  const [autoRenewal, setAutoRenewal] = useState(contract?.auto_renewal ?? false)
  const [notes, setNotes] = useState(contract?.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !accountId) return
    try {
      const payload = {
        title: title.trim(),
        account_id: accountId,
        deal_id: dealId === 'none' ? null : dealId,
        start_date: startDate || null,
        end_date: endDate || null,
        value: parseFloat(value) || 0,
        billing_period: billingPeriod || null,
        auto_renewal: autoRenewal,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await updateContract.mutateAsync({ contractId: contract.id, ...payload })
        toast({ title: 'Contract updated', variant: 'success' })
      } else {
        await createContract.mutateAsync(payload)
        toast({ title: 'Contract created', variant: 'success' })
      }
      onClose()
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
          <Label htmlFor="contract-title">Title *</Label>
          <Input id="contract-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Account *</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {(accountsData?.items ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Deal (optional)</Label>
          <Select value={dealId} onValueChange={setDealId}>
            <SelectTrigger><SelectValue placeholder="No deal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No deal</SelectItem>
              {(dealsData?.items ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="contract-start">Start Date</Label>
            <Input id="contract-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contract-end">End Date</Label>
            <Input id="contract-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="contract-value">Value</Label>
            <Input id="contract-value" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Billing Period</Label>
            <Select value={billingPeriod} onValueChange={setBillingPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BILLING_PERIODS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="contract-renewal"
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={autoRenewal}
            onChange={(e) => setAutoRenewal(e.target.checked)}
          />
          <Label htmlFor="contract-renewal">Auto Renewal</Label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contract-notes">Notes</Label>
          <textarea
            id="contract-notes"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending || !title.trim() || !accountId}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
