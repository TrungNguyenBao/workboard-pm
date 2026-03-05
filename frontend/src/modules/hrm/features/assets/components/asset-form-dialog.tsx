import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Asset, useCreateAsset, useUpdateAsset } from '../hooks/use-assets'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  asset?: Asset | null
}

const CATEGORIES = ['laptop', 'phone', 'tablet', 'furniture', 'vehicle', 'equipment', 'other']
const STATUSES = ['available', 'assigned', 'maintenance', 'retired']

export function AssetFormDialog({ open, onOpenChange, workspaceId, asset }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <AssetFormContent workspaceId={workspaceId} asset={asset} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function AssetFormContent({ workspaceId, asset, onOpenChange }: Omit<Props, 'open'>) {
  const isEdit = !!asset
  const createAsset = useCreateAsset(workspaceId)
  const updateAsset = useUpdateAsset(workspaceId)

  const [name, setName] = useState(asset?.name ?? '')
  const [category, setCategory] = useState(asset?.category ?? '')
  const [serialNumber, setSerialNumber] = useState(asset?.serial_number ?? '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchase_date ?? '')
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchase_value?.toString() ?? '')
  const [currentValue, setCurrentValue] = useState(asset?.current_value?.toString() ?? '')
  const [assetStatus, setAssetStatus] = useState(asset?.status ?? 'available')
  const [location, setLocation] = useState(asset?.location ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const payload = {
        name: name.trim(),
        category: category || null,
        serial_number: serialNumber || null,
        purchase_date: purchaseDate || null,
        purchase_value: purchaseValue ? parseFloat(purchaseValue) : null,
        current_value: currentValue ? parseFloat(currentValue) : null,
        status: assetStatus,
        location: location || null,
      }
      if (isEdit) {
        await updateAsset.mutateAsync({ assetId: asset.id, ...payload })
        toast({ title: 'Asset updated', variant: 'success' })
      } else {
        await createAsset.mutateAsync(payload)
        toast({ title: 'Asset created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to save asset', variant: 'error' })
    }
  }

  const pending = createAsset.isPending || updateAsset.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Asset' : 'New Asset'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="af-name">Name *</Label>
          <Input id="af-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="MacBook Pro 14" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={assetStatus} onValueChange={setAssetStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="af-serial">Serial Number</Label>
          <Input id="af-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN-12345" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="af-purchase-date">Purchase Date</Label>
            <Input id="af-purchase-date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-location">Location</Label>
            <Input id="af-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Office A" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="af-pval">Purchase Value</Label>
            <Input id="af-pval" type="number" min="0" step="0.01" value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="af-cval">Current Value</Label>
            <Input id="af-cval" type="number" min="0" step="0.01" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
