import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type Supplier, useCreateSupplier, useUpdateSupplier } from '../hooks/use-suppliers'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  supplier?: Supplier | null
}

export function SupplierFormDialog({ open, onOpenChange, workspaceId, supplier }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <SupplierFormContent workspaceId={workspaceId} supplier={supplier} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function SupplierFormContent({ workspaceId, supplier, onOpenChange }: Omit<Props, 'open'>) {
  const { t } = useTranslation('wms')
  const createSupplier = useCreateSupplier(workspaceId)
  const updateSupplier = useUpdateSupplier(workspaceId)
  const isEdit = !!supplier

  const [name, setName] = useState(supplier?.name ?? '')
  const [contactEmail, setContactEmail] = useState(supplier?.contact_email ?? '')
  const [phone, setPhone] = useState(supplier?.phone ?? '')
  const [address, setAddress] = useState(supplier?.address ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        contact_email: contactEmail.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      }
      if (isEdit) {
        await updateSupplier.mutateAsync({ supplierId: supplier.id, ...payload })
        toast({ title: 'Supplier updated', variant: 'success' })
      } else {
        await createSupplier.mutateAsync(payload)
        toast({ title: 'Supplier created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save supplier', variant: 'error' })
    }
  }

  const pending = createSupplier.isPending || updateSupplier.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit supplier' : t('suppliers.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sup-name">{t('common:common.name')} *</Label>
          <Input id="sup-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sup-email">{t('common:common.email')}</Label>
            <Input id="sup-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup-phone">{t('common:common.phone')}</Label>
            <Input id="sup-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sup-address">Address</Label>
          <Input id="sup-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? t('products.saving') : isEdit ? t('products.saveChanges') : t('suppliers.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
