import { useState } from 'react'
import { Plus, Pencil, Trash2, Settings2, AlertCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  useCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
  type CrmCustomField,
  type EntityType,
} from '../hooks/use-custom-fields'
import { CustomFieldForm } from '../components/custom-field-form'

const ENTITY_TYPES: EntityType[] = ['lead', 'deal', 'contact', 'account']

export default function CustomFieldsSettingsPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const { data: fields = [], isLoading, isError } = useCustomFields(workspaceId)
  const createField = useCreateCustomField(workspaceId)
  const updateField = useUpdateCustomField(workspaceId)
  const deleteField = useDeleteCustomField(workspaceId)

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<CrmCustomField | null>(null)

  function handleCreate(data: Record<string, unknown>) {
    createField.mutate(data, { onSuccess: () => setShowCreate(false) })
  }

  function handleUpdate(data: Record<string, unknown>) {
    if (!editing) return
    updateField.mutate({ fieldId: editing.id, ...data }, { onSuccess: () => setEditing(null) })
  }

  function handleDelete(fieldId: string) {
    if (!confirm('Delete this custom field? Existing data will be lost.')) return
    deleteField.mutate(fieldId)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" /> Failed to load. Admin access required.
      </div>
    )
  }

  const grouped = ENTITY_TYPES.reduce<Record<string, CrmCustomField[]>>((acc, et) => {
    acc[et] = fields.filter((f) => f.entity_type === et)
    return acc
  }, {} as Record<string, CrmCustomField[]>)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Custom Fields</h2>
            <p className="text-sm text-muted-foreground">Add extra fields to CRM entities</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Field
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">New Custom Field</h3>
          <CustomFieldForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isPending={createField.isPending}
          />
        </div>
      )}

      {editing && (
        <div className="rounded-lg border border-primary/50 bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">Edit: {editing.field_label}</h3>
          <CustomFieldForm
            initial={editing}
            isEdit
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            isPending={updateField.isPending}
          />
        </div>
      )}

      <div className="space-y-6">
        {ENTITY_TYPES.map((et) => (
          <div key={et}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 capitalize">
              {et}
            </h3>
            {grouped[et].length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No custom fields for {et}s</p>
            ) : (
              <div className="space-y-2">
                {grouped[et].map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{field.field_label}</p>
                      <p className="text-xs text-muted-foreground">
                        {field.field_name} · {field.field_type}
                        {field.is_required && ' · required'}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditing(field)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
