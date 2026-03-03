import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/components/ui/toast'
import { type Warehouse, useCreateWarehouse, useUpdateWarehouse } from '../hooks/use-warehouses'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  warehouse?: Warehouse | null
}

export function WarehouseFormDialog({ open, onOpenChange, workspaceId, warehouse }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <WarehouseFormContent workspaceId={workspaceId} warehouse={warehouse} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function WarehouseFormContent({ workspaceId, warehouse, onOpenChange }: Omit<Props, 'open'>) {
  const { t } = useTranslation('wms')
  const createWarehouse = useCreateWarehouse(workspaceId)
  const updateWarehouse = useUpdateWarehouse(workspaceId)
  const isEdit = !!warehouse

  const [name, setName] = useState(warehouse?.name ?? '')
  const [location, setLocation] = useState(warehouse?.location ?? '')
  const [address, setAddress] = useState(warehouse?.address ?? '')
  const [managerName, setManagerName] = useState(warehouse?.manager_name ?? '')
  const [description, setDescription] = useState(warehouse?.description ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        location: location.trim() || null,
        address: address.trim() || null,
        manager_name: managerName.trim() || null,
        description: description.trim() || null,
      }
      if (isEdit) {
        await updateWarehouse.mutateAsync({ warehouseId: warehouse.id, ...payload })
        toast({ title: 'Warehouse updated', variant: 'success' })
      } else {
        await createWarehouse.mutateAsync(payload)
        toast({ title: 'Warehouse created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save warehouse', variant: 'error' })
    }
  }

  const pending = createWarehouse.isPending || updateWarehouse.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit warehouse' : t('warehouses.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="wh-name">{t('common:common.name')} *</Label>
          <Input id="wh-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="wh-location">Location</Label>
            <Input id="wh-location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-manager">Manager</Label>
            <Input id="wh-manager" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wh-address">Address</Label>
          <Input id="wh-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wh-desc">{t('common:common.description')}</Label>
          <Input id="wh-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? t('products.saving') : isEdit ? t('products.saveChanges') : t('warehouses.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
