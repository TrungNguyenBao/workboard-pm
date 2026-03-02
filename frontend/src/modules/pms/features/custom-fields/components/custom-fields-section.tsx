import { Settings } from 'lucide-react'
import { useCustomFields } from '../hooks/use-custom-fields'
import { CustomFieldRenderer } from './custom-field-renderer'

interface Props {
  projectId: string
  taskId: string
  customFields: Record<string, unknown> | null
  onUpdate: (fields: Record<string, unknown>) => void
}

export function CustomFieldsSection({ projectId, taskId: _taskId, customFields, onUpdate }: Props) {
  const { data: definitions = [], isLoading } = useCustomFields(projectId)
  const values = customFields ?? {}

  function handleChange(fieldId: string, value: unknown) {
    const merged = { ...values, [fieldId]: value }
    onUpdate(merged)
  }

  if (isLoading) return null

  if (definitions.length === 0) {
    return (
      <div className="px-6 py-4 border-b border-border">
        <p className="text-xs font-medium text-neutral-500 mb-1">Custom Fields</p>
        <p className="text-xs text-neutral-400 flex items-center gap-1">
          <Settings className="h-3 w-3" />
          No custom fields. Configure in project settings.
        </p>
      </div>
    )
  }

  return (
    <div className="px-6 py-4 border-b border-border">
      <p className="text-xs font-medium text-neutral-500 mb-3">Custom Fields</p>
      <div className="space-y-2.5">
        {definitions.map((def) => (
          <div key={def.id} className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0 text-xs text-neutral-500 truncate" title={def.name}>
              {def.name}
              {def.required && <span className="text-red-400 ml-0.5">*</span>}
            </div>
            <div className="flex-1 min-w-0">
              <CustomFieldRenderer
                definition={def}
                value={values[def.id] ?? null}
                onChange={(val) => handleChange(def.id, val)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
