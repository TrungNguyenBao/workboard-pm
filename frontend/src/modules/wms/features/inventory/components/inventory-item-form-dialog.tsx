import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useProducts } from '../../products/hooks/use-products'
import { useWarehouses } from '../../warehouses/hooks/use-warehouses'
import { type InventoryItem, useCreateInventoryItem, useUpdateInventoryItem } from '../hooks/use-inventory-items'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  item?: InventoryItem | null
}

export function InventoryItemFormDialog({ open, onOpenChange, workspaceId, item }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <InventoryFormContent workspaceId={workspaceId} item={item} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function InventoryFormContent({ workspaceId, item, onOpenChange }: Omit<Props, 'open'>) {
  const createItem = useCreateInventoryItem(workspaceId)
  const updateItem = useUpdateInventoryItem(workspaceId)
  const isEdit = !!item

  const { data: productsData } = useProducts(workspaceId, { page_size: 100 })
  const { data: warehousesData } = useWarehouses(workspaceId, { page_size: 100 })
  const products = productsData?.items ?? []
  const warehouses = warehousesData?.items ?? []

  const [sku, setSku] = useState(item?.sku ?? '')
  const [name, setName] = useState(item?.name ?? '')
  const [quantity, setQuantity] = useState(item?.quantity ?? 0)
  const [unit, setUnit] = useState(item?.unit ?? 'pcs')
  const [warehouseId, setWarehouseId] = useState(item?.warehouse_id ?? '')
  const [productId, setProductId] = useState(item?.product_id ?? '')
  const [minThreshold, setMinThreshold] = useState(item?.min_threshold ?? 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sku.trim() || !name.trim() || !warehouseId) return
    try {
      const payload = {
        sku: sku.trim(),
        name: name.trim(),
        quantity,
        unit,
        warehouse_id: warehouseId,
        product_id: productId || null,
        min_threshold: minThreshold,
      }
      if (isEdit) {
        await updateItem.mutateAsync({ itemId: item.id, ...payload })
        toast({ title: 'Inventory item updated', variant: 'success' })
      } else {
        await createItem.mutateAsync(payload)
        toast({ title: 'Inventory item created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: `Failed to ${isEdit ? 'update' : 'create'} item`, variant: 'error' })
    }
  }

  const pending = createItem.isPending || updateItem.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit inventory item' : 'New inventory item'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="inv-sku">SKU *</Label>
            <Input id="inv-sku" value={sku} onChange={(e) => setSku(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-name">Name *</Label>
            <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="inv-qty">Quantity</Label>
            <Input id="inv-qty" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-unit">Unit</Label>
            <Input id="inv-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-min">Min threshold</Label>
            <Input id="inv-min" type="number" value={minThreshold} onChange={(e) => setMinThreshold(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Warehouse *</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !sku.trim() || !name.trim() || !warehouseId}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create item'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
