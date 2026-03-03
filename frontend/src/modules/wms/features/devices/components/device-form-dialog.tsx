import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useProducts } from '../../products/hooks/use-products'
import { useWarehouses } from '../../warehouses/hooks/use-warehouses'
import { type Device, useCreateDevice, useUpdateDevice } from '../hooks/use-devices'

const STATUSES = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'in_repair', label: 'In Repair' },
  { value: 'retired', label: 'Retired' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  device?: Device | null
}

export function DeviceFormDialog({ open, onOpenChange, workspaceId, device }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DeviceFormContent workspaceId={workspaceId} device={device} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function DeviceFormContent({ workspaceId, device, onOpenChange }: Omit<Props, 'open'>) {
  const { t } = useTranslation('wms')
  const createDevice = useCreateDevice(workspaceId)
  const updateDevice = useUpdateDevice(workspaceId)
  const isEdit = !!device

  const { data: productsData } = useProducts(workspaceId, { page_size: 100 })
  const { data: warehousesData } = useWarehouses(workspaceId, { page_size: 100 })
  const products = productsData?.items ?? []
  const warehouses = warehousesData?.items ?? []

  const [serialNumber, setSerialNumber] = useState(device?.serial_number ?? '')
  const [productId, setProductId] = useState(device?.product_id ?? '')
  const [warehouseId, setWarehouseId] = useState(device?.warehouse_id ?? '')
  const [status, setStatus] = useState(device?.status ?? 'in_stock')
  const [notes, setNotes] = useState(device?.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!serialNumber.trim() || !productId) return
    try {
      const payload = {
        serial_number: serialNumber.trim(),
        product_id: productId,
        warehouse_id: warehouseId || null,
        status,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await updateDevice.mutateAsync({ deviceId: device.id, ...payload })
        toast({ title: 'Device updated', variant: 'success' })
      } else {
        await createDevice.mutateAsync(payload)
        toast({ title: 'Device created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save device', variant: 'error' })
    }
  }

  const pending = createDevice.isPending || updateDevice.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit device' : t('devices.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="dev-serial">Serial Number *</Label>
          <Input id="dev-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t('products.title')} *</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('warehouses.title')}</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('common:common.status')}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dev-notes">Notes</Label>
          <Input id="dev-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !serialNumber.trim() || !productId}>
            {pending ? t('products.saving') : isEdit ? t('products.saveChanges') : t('devices.new')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
