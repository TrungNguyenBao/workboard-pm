import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Account, useCreateAccount, useUpdateAccount } from '../hooks/use-accounts'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  account?: Account | null
}

export function AccountFormDialog({ open, onOpenChange, workspaceId, account }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <AccountFormContent workspaceId={workspaceId} account={account} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function AccountFormContent({ workspaceId, account, onOpenChange }: Omit<Props, 'open'>) {
  const createAccount = useCreateAccount(workspaceId)
  const updateAccount = useUpdateAccount(workspaceId)
  const isEdit = !!account

  const [name, setName] = useState(account?.name ?? '')
  const [industry, setIndustry] = useState(account?.industry ?? '')
  const [revenue, setRevenue] = useState(account?.total_revenue?.toString() ?? '0')
  const [status, setStatus] = useState(account?.status ?? 'active')
  const [website, setWebsite] = useState(account?.website ?? '')
  const [address, setAddress] = useState(account?.address ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        industry: industry.trim() || null,
        total_revenue: parseFloat(revenue) || 0,
        status,
        website: website.trim() || null,
        address: address.trim() || null,
      }
      if (isEdit) {
        await updateAccount.mutateAsync({ accountId: account.id, ...payload })
        toast({ title: 'Account updated', variant: 'success' })
      } else {
        await createAccount.mutateAsync(payload)
        toast({ title: 'Account created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save account', variant: 'error' })
    }
  }

  const pending = createAccount.isPending || updateAccount.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit account' : 'New Account'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="acct-name">Name *</Label>
          <Input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="acct-industry">Industry</Label>
            <Input id="acct-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct-revenue">Revenue</Label>
            <Input id="acct-revenue" type="number" min="0" step="0.01" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct-website">Website</Label>
            <Input id="acct-website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acct-address">Address</Label>
          <Input id="acct-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Saving...' : isEdit ? 'Save' : 'New Account'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
