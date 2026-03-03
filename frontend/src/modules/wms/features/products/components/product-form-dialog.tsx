import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('wms')
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
        toast({ title: t('products.updated'), variant: 'success' })
      } else {
        await createProduct.mutateAsync(payload)
        toast({ title: t('products.created'), variant: 'success' })
      }
      onOpenChange(false)
    } catch {
      toast({ title: isEdit ? t('products.updateFailed') : t('products.createFailed'), variant: 'error' })
    }
  }

  const pending = createProduct.isPending || updateProduct.isPending

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? t('products.edit') : t('products.new')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">{t('products.name')} *</Label>
            <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-sku">{t('products.sku')} *</Label>
            <Input id="prod-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t('products.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equipment">{t('products.equipment')}</SelectItem>
                <SelectItem value="accessory">{t('products.accessory')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-unit">{t('products.unit')}</Label>
            <Input id="prod-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-desc">{t('common:common.description')}</Label>
          <Input id="prod-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isSerialTracked} onChange={(e) => setIsSerialTracked(e.target.checked)} />
          {t('products.serialTracked')}
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
          <Button type="submit" disabled={pending || !name.trim() || !sku.trim()}>
            {pending ? t('products.saving') : isEdit ? t('products.saveChanges') : t('products.createProduct')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
