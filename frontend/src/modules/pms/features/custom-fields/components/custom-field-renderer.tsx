import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import type { CustomFieldDefinition } from '../hooks/use-custom-fields'

interface Props {
  definition: CustomFieldDefinition
  value: unknown
  onChange: (value: unknown) => void
}

function inputClass(extra = '') {
  return `text-sm bg-neutral-50 border border-border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/40 w-full ${extra}`
}

function TextRenderer({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [local, setLocal] = useState(String(value ?? ''))
  return (
    <input
      type="text"
      className={inputClass()}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local || null)}
    />
  )
}

function NumberRenderer({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [local, setLocal] = useState(value != null ? String(value) : '')
  return (
    <input
      type="number"
      className={inputClass('w-32')}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local !== '' ? Number(local) : null)}
    />
  )
}

function UrlRenderer({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [local, setLocal] = useState(String(value ?? ''))
  return (
    <div className="flex items-center gap-1.5 w-full">
      <input
        type="url"
        className={inputClass('flex-1')}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local || null)}
        placeholder="https://…"
      />
      {local && (
        <a href={local} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 flex-shrink-0">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}

function MultiSelectRenderer({ definition, value, onChange }: Props) {
  const selected: string[] = Array.isArray(value) ? (value as string[]) : []
  const options = definition.options ?? []

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    onChange(next.length ? next : null)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity border"
            style={{
              backgroundColor: active ? opt.color + '33' : 'transparent',
              color: opt.color,
              borderColor: opt.color + '66',
              opacity: active ? 1 : 0.5,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function CustomFieldRenderer({ definition, value, onChange }: Props) {
  const { field_type, options } = definition

  if (field_type === 'text') return <TextRenderer value={value} onChange={onChange} />

  if (field_type === 'number') return <NumberRenderer value={value} onChange={onChange} />

  if (field_type === 'url') return <UrlRenderer value={value} onChange={onChange} />

  if (field_type === 'date') {
    return (
      <input
        type="date"
        className={inputClass('w-40')}
        defaultValue={value ? String(value).slice(0, 10) : ''}
        onChange={(e) => onChange(e.target.value || null)}
      />
    )
  }

  if (field_type === 'checkbox') {
    return (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    )
  }

  if (field_type === 'single_select') {
    const opts = options ?? []
    return (
      <Select value={String(value ?? '')} onValueChange={(v) => onChange(v || null)}>
        <SelectTrigger className="h-7 text-xs w-40 border-0 bg-neutral-100 hover:bg-neutral-200">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">— None —</SelectItem>
          {opts.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (field_type === 'multi_select') {
    return <MultiSelectRenderer definition={definition} value={value} onChange={onChange} />
  }

  return null
}
