import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Deal, DEAL_STAGES, useCreateDeal, useUpdateDeal } from '../hooks/use-deals'
import { useContacts } from '../../contacts/hooks/use-contacts'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  deal?: Deal | null
}

export function DealFormDialog({ open, onOpenChange, workspaceId, deal }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DealFormContent workspaceId={workspaceId} deal={deal} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

// Inner component holds state -- unmounts on close, resetting form
function DealFormContent({ workspaceId, deal, onOpenChange }: Omit<Props, 'open'>) {
  const { t } = useTranslation('crm')
  const createDeal = useCreateDeal(workspaceId)
  const updateDeal = useUpdateDeal(workspaceId)
  const { data: contactsData } = useContacts(workspaceId, { page_size: 100 })
  const isEdit = !!deal

  const [title, setTitle] = useState(deal?.title ?? '')
  const [value, setValue] = useState(deal?.value?.toString() ?? '0')
  const [stage, setStage] = useState(deal?.stage ?? 'lead')
  // Use 'none' sentinel to avoid Radix Select empty-string issues
  const [contactId, setContactId] = useState(deal?.contact_id ?? 'none')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const payload = {
        title: title.trim(),
        value: parseFloat(value) || 0,
        stage,
        contact_id: contactId === 'none' ? null : contactId,
      }
      if (isEdit) {
        await updateDeal.mutateAsync({ dealId: deal.id, ...payload })
        toast({ title: 'Deal updated', variant: 'success' })
      } else {
        await createDeal.mutateAsync(payload)
        toast({ title: 'Deal created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save deal', variant: 'error' })
    }
  }

  const pending = createDeal.isPending || updateDeal.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit deal' : t('deals.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="deal-title">{t('deals.titleLabel')} *</Label>
          <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="deal-value">{t('deals.value')}</Label>
            <Input id="deal-value" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('deals.stage')}</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('deals.contact')}</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger><SelectValue placeholder="No contact" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No contact</SelectItem>
              {(contactsData?.items ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? t('common:common.loading') : isEdit ? t('common:common.save') : t('deals.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
