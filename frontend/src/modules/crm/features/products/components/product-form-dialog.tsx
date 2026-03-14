import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { type ProductService, PRODUCT_TYPES, useCreateProduct, useUpdateProduct } from '../hooks/use-products'

interface Props {
  open: boolean
  onClose: () => void
  workspaceId: string
  product?: ProductService | null
}

export function ProductFormDialog({ open, onClose, workspaceId, product }: Props) {
  if (!open) return null
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose() }}>
      <ProductFormContent workspaceId={workspaceId} product={product} onClose={onClose} />
    </Dialog>
  )
}

function ProductFormContent({
  workspaceId,
  product,
  onClose,
}: Omit<Props, 'open'>) {
  const isEdit = !!product
  const createProduct = useCreateProduct(workspaceId)
  const updateProduct = useUpdateProduct(workspaceId)

  const [name, setName] = useState(product?.name ?? '')
  const [code, setCode] = useState(product?.code ?? '')
  const [type, setType] = useState<'product' | 'service' | 'bundle'>(product?.type ?? 'product')
  const [category, setCategory] = useState(product?.category ?? '')
  const [unitPrice, setUnitPrice] = useState(product?.unit_price?.toString() ?? '0')
  const [currency, setCurrency] = useState(product?.currency ?? 'VND')
  const [description, setDescription] = useState(product?.description ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        type,
        category: category.trim() || null,
        unit_price: parseFloat(unitPrice) || 0,
        currency,
        description: description.trim() || null,
        is_active: isActive,
      }
      if (isEdit) {
        await updateProduct.mutateAsync({ productId: product.id, ...payload })
        toast({ title: 'Product updated', variant: 'success' })
      } else {
        await createProduct.mutateAsync(payload)
        toast({ title: 'Product created', variant: 'success' })
      }
      onClose()
    } catch {
      toast({ title: 'Failed to save product', variant: 'error' })
    }
  }

  const pending = createProduct.isPending || updateProduct.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Product / Service' : 'New Product / Service'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Name *</Label>
            <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-code">Code *</Label>
            <Input id="prod-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'product' | 'service' | 'bundle')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-category">Category</Label>
            <Input id="prod-category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prod-price">Unit Price</Label>
            <Input id="prod-price" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-currency">Currency</Label>
            <Input id="prod-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="VND" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-desc">Description</Label>
          <textarea
            id="prod-desc"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="prod-active"
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <Label htmlFor="prod-active">Active</Label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim() || !code.trim()}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
