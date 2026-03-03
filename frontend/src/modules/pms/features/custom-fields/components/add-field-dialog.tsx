import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useCreateCustomField } from '../hooks/use-custom-fields'

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'single_select', label: 'Single Select' },
  { value: 'multi_select', label: 'Multi Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
]

const OPTION_COLORS = ['#5E6AD2', '#E36857', '#F2C94C', '#27AE60', '#2F80ED', '#9B51E0', '#56CCF2', '#EC4899']

interface Props {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface OptionRow {
  label: string
  color: string
}

export function AddFieldDialog({ projectId, open, onOpenChange }: Props) {
  const { t } = useTranslation('pms')
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<OptionRow[]>([{ label: '', color: OPTION_COLORS[0] }])
  const createField = useCreateCustomField(projectId)

  const needsOptions = fieldType === 'single_select' || fieldType === 'multi_select'

  function addOption() {
    setOptions((prev) => [...prev, { label: '', color: OPTION_COLORS[prev.length % OPTION_COLORS.length] }])
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateOption(i: number, key: keyof OptionRow, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, [key]: val } : o)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const payload: Record<string, unknown> = {
      name: name.trim(),
      field_type: fieldType,
      description: description.trim() || null,
    }
    if (needsOptions) {
      payload.options = options
        .filter((o) => o.label.trim())
        .map((o, i) => ({ id: crypto.randomUUID(), label: o.label.trim(), color: o.color, position: i }))
    }
    await createField.mutateAsync(payload)
    setName('')
    setFieldType('text')
    setDescription('')
    setOptions([{ label: '', color: OPTION_COLORS[0] }])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('customField.addField')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="field-name">{t('common:common.name')}</Label>
            <Input id="field-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Story points" autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label>Field type</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-desc">Description <span className="text-neutral-400">(optional)</span></Label>
            <Input id="field-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description…" />
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={opt.color}
                    onChange={(e) => updateOption(i, 'color', e.target.value)}
                    className="h-7 w-7 rounded cursor-pointer border border-border"
                    title="Pick color"
                  />
                  <Input
                    value={opt.label}
                    onChange={(e) => updateOption(i, 'label', e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1"
                  />
                  {options.length > 1 && (
                    <button type="button" onClick={() => removeOption(i)} className="text-neutral-300 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addOption} className="text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add option
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common:common.cancel')}</Button>
            <Button type="submit" disabled={!name.trim() || createField.isPending}>
              {createField.isPending ? '…' : t('customField.addField')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
