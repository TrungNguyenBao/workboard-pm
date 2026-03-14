import { useCustomFields, type EntityType } from '../hooks/use-custom-fields'

interface Props {
  workspaceId: string
  entityType: EntityType
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
}

export function DynamicCustomFields({ workspaceId, entityType, values, onChange }: Props) {
  const { data: fields = [], isLoading } = useCustomFields(workspaceId, entityType)

  if (isLoading) return <div className="h-4 bg-muted animate-pulse rounded" />
  if (!fields.length) return null

  function set(key: string, value: unknown) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Custom Fields
      </p>
      {fields.map((field) => {
        const val = values[field.field_name]

        if (field.field_type === 'text') {
          return (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {field.field_label}{field.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={(val as string) ?? ''}
                onChange={(e) => set(field.field_name, e.target.value)}
                required={field.is_required}
              />
            </div>
          )
        }

        if (field.field_type === 'number') {
          return (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {field.field_label}{field.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={(val as number) ?? ''}
                onChange={(e) => set(field.field_name, e.target.valueAsNumber)}
                required={field.is_required}
              />
            </div>
          )
        }

        if (field.field_type === 'date') {
          return (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {field.field_label}{field.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={(val as string) ?? ''}
                onChange={(e) => set(field.field_name, e.target.value)}
                required={field.is_required}
              />
            </div>
          )
        }

        if (field.field_type === 'select') {
          return (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {field.field_label}{field.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={(val as string) ?? ''}
                onChange={(e) => set(field.field_name, e.target.value)}
                required={field.is_required}
              >
                <option value="">— Select —</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )
        }

        if (field.field_type === 'multi_select') {
          const selected = (val as string[]) ?? []
          return (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {field.field_label}{field.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {(field.options ?? []).map((opt) => {
                  const checked = selected.includes(opt)
                  return (
                    <label key={opt}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors ${
                        checked ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      }`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selected.filter((s) => s !== opt)
                            : [...selected, opt]
                          set(field.field_name, next)
                        }}
                      />
                      {opt}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
