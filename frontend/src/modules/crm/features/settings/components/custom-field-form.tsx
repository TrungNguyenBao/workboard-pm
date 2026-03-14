import { useState } from 'react'
import { X } from 'lucide-react'
import type { CrmCustomField, EntityType } from '../hooks/use-custom-fields'

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'deal', label: 'Deal' },
  { value: 'contact', label: 'Contact' },
  { value: 'account', label: 'Account' },
]

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-select' },
]

interface Props {
  initial?: Partial<CrmCustomField>
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  isPending?: boolean
  isEdit?: boolean
}

export function CustomFieldForm({ initial, onSubmit, onCancel, isPending, isEdit }: Props) {
  const [entityType, setEntityType] = useState<EntityType>((initial?.entity_type as EntityType) ?? 'lead')
  const [fieldName, setFieldName] = useState(initial?.field_name ?? '')
  const [fieldLabel, setFieldLabel] = useState(initial?.field_label ?? '')
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date' | 'select' | 'multi_select'>(initial?.field_type ?? 'text')
  const [isRequired, setIsRequired] = useState(initial?.is_required ?? false)
  const [optionInput, setOptionInput] = useState('')
  const [options, setOptions] = useState<string[]>(initial?.options ?? [])

  const needsOptions = fieldType === 'select' || fieldType === 'multi_select'

  function addOption() {
    const val = optionInput.trim()
    if (val && !options.includes(val)) {
      setOptions([...options, val])
    }
    setOptionInput('')
  }

  function removeOption(opt: string) {
    setOptions(options.filter((o) => o !== opt))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      field_label: fieldLabel,
      field_type: fieldType,
      is_required: isRequired,
      options: needsOptions ? options : null,
    }
    if (!isEdit) {
      payload.entity_type = entityType
      payload.field_name = fieldName
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Entity Type</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Field Name (slug)</label>
            <input
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. budget_range"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            />
          </div>
        </>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Field Label</label>
        <input
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="e.g. Budget Range"
          value={fieldLabel}
          onChange={(e) => setFieldLabel(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Field Type</label>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as 'text' | 'number' | 'date' | 'select' | 'multi_select')}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {needsOptions && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Options</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Add option…"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
            />
            <button type="button" onClick={addOption}
              className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {options.map((opt) => (
              <span key={opt}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {opt}
                <button type="button" onClick={() => removeOption(opt)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
        Required field
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          Cancel
        </button>
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
          {isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
