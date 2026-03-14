import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { useProducts } from '../../products/hooks/use-products'
import { useCreateQuotation } from '../hooks/use-quotations'

interface LineItem {
  product_service_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount_pct: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  dealId: string
}

const calcTotal = (l: LineItem) => l.quantity * l.unit_price * (1 - l.discount_pct / 100)
const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 })

export function QuotationFormDialog({ open, onOpenChange, workspaceId, dealId }: Props) {
  const createQuotation = useCreateQuotation(workspaceId, dealId)
  const { data: productsData } = useProducts(workspaceId, { page_size: 100, is_active: true })
  const products = productsData?.items ?? []

  const [validUntil, setValidUntil] = useState('')
  const [discountPct, setDiscountPct] = useState('0')
  const [taxPct, setTaxPct] = useState('0')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])

  function addLine() {
    setLines((p) => [...p, { product_service_id: null, description: '', quantity: 1, unit_price: 0, discount_pct: 0 }])
  }

  function removeLine(idx: number) { setLines((p) => p.filter((_, i) => i !== idx)) }

  function updateLine(idx: number, field: keyof LineItem, value: string | number | null) {
    setLines((prev) => prev.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [field]: value }
      if (field === 'product_service_id' && value) {
        const prod = products.find((p) => p.id === value)
        if (prod) { updated.description = updated.description || prod.name; updated.unit_price = prod.unit_price }
      }
      return updated
    }))
  }

  const disc = parseFloat(discountPct) || 0
  const tax = parseFloat(taxPct) || 0
  const subtotal = lines.reduce((s, l) => s + calcTotal(l), 0)
  const discAmt = subtotal * disc / 100
  const taxAmt = (subtotal - discAmt) * tax / 100
  const total = subtotal - discAmt + taxAmt

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createQuotation.mutateAsync({
        deal_id: dealId,
        valid_until: validUntil || null,
        discount_pct: disc,
        tax_pct: tax,
        notes: notes.trim() || null,
        lines: lines.map((l, i) => ({ ...l, position: i })),
      })
      toast({ title: 'Quotation created', variant: 'success' })
      onOpenChange(false)
    } catch {
      toast({ title: 'Failed to create quotation', variant: 'error' })
    }
  }

  if (!open) return null

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Discount %</Label>
              <Input type="number" min="0" max="100" step="0.01" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tax %</Label>
              <Input type="number" min="0" max="100" step="0.01" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>+ Add Line</Button>
            </div>
            {lines.length > 0 && (
              <div className="border rounded-md overflow-hidden text-sm">
                <table className="w-full">
                  <thead className="bg-muted text-muted-foreground text-xs">
                    <tr>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2 w-16">Qty</th>
                      <th className="text-right p-2 w-24">Unit Price</th>
                      <th className="text-right p-2 w-16">Disc%</th>
                      <th className="text-right p-2 w-20">Total</th>
                      <th className="w-6" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-1">
                          <Select value={line.product_service_id ?? 'none'} onValueChange={(v) => updateLine(idx, 'product_service_id', v === 'none' ? null : v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1"><Input className="h-8 text-xs" value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} /></td>
                        <td className="p-1"><Input className="h-8 text-xs text-right" type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 1)} /></td>
                        <td className="p-1"><Input className="h-8 text-xs text-right" type="number" min="0" step="0.01" value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)} /></td>
                        <td className="p-1"><Input className="h-8 text-xs text-right" type="number" min="0" max="100" step="0.01" value={line.discount_pct} onChange={(e) => updateLine(idx, 'discount_pct', parseFloat(e.target.value) || 0)} /></td>
                        <td className="p-2 text-right tabular-nums">{fmt(calcTotal(line))}</td>
                        <td className="p-1 text-center"><button type="button" onClick={() => removeLine(idx)} className="text-muted-foreground hover:text-destructive">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <dl className="space-y-1 text-sm w-52">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{fmt(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Discount ({disc}%)</dt><dd>-{fmt(discAmt)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax ({tax}%)</dt><dd>{fmt(taxAmt)}</dd></div>
              <div className="flex justify-between font-semibold border-t pt-1"><dt>Total</dt><dd>{fmt(total)}</dd></div>
            </dl>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createQuotation.isPending}>
              {createQuotation.isPending ? 'Creating...' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
