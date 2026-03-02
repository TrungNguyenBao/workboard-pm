import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type Product, useCreateProduct, useUpdateProduct } from '../hooks/use-products'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  product?: Product | null
}

export function ProductFormDialog({ open, onOpenChange, workspaceId, product }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <ProductFormContent workspaceId={workspaceId} product={product} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function ProductFormContent({ workspaceId, product, onOpenChange }: Omit<Props, 'open'>) {
  const createProduct = useCreateProduct(workspaceId)
  const updateProduct = useUpdateProduct(workspaceId)
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [category, setCategory] = useState(product?.category ?? 'equipment')
  const [description, setDescription] = useState(product?.description ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'pcs')
  const [isSerialTracked, setIsSerialTracked] = useState(product?.is_serial_tracked ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !sku.trim()) return
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        category,
        description: description.trim() || null,
        unit,
        is_serial_tracked: isSerialTracked,
      }
      if (isEdit) {
        await updateProduct.mutateAsync({ productId: product.id, ...payload })
        toast({ title: 'Product updated', variant: 'success' })
      } else {
        await createProduct.mutateAsync(payload)
        toast({ title: 'Product created', variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: `Failed to ${isEdit ? 'update' : 'create'} product`, variant: 'error' })
    }
  }

  const pending = createProduct.isPending || updateProduct.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit product' : 'New product'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Name *</Label>
            <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-sku">SKU *</Label>
            <Input id="prod-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-unit">Unit</Label>
            <Input id="prod-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-desc">Description</Label>
          <Input id="prod-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isSerialTracked} onChange={(e) => setIsSerialTracked(e.target.checked)} />
          Serial number tracked
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim() || !sku.trim()}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
