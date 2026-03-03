import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useCustomFields, useDeleteCustomField } from '../hooks/use-custom-fields'
import { AddFieldDialog } from './add-field-dialog'

const TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  single_select: 'Single select',
  multi_select: 'Multi select',
  checkbox: 'Checkbox',
  url: 'URL',
}

interface Props {
  projectId: string
}

export function FieldConfigPanel({ projectId }: Props) {
  const { t } = useTranslation('pms')
  const [addOpen, setAddOpen] = useState(false)
  const { data: fields = [], isLoading } = useCustomFields(projectId)
  const deleteField = useDeleteCustomField(projectId)

  function handleDelete(fieldId: string, name: string) {
    if (!window.confirm(t('common:common.deleteConfirmFull', { name }))) return
    deleteField.mutate(fieldId)
  }

  if (isLoading) {
    return <p className="text-xs text-neutral-400 py-2">{t('common:common.loading')}</p>
  }

  return (
    <div className="space-y-2">
      {fields.length === 0 ? (
        <p className="text-xs text-neutral-400 py-1">No custom fields yet.</p>
      ) : (
        <div className="space-y-1">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-50 group"
            >
              <span className="flex-1 text-sm text-neutral-800 truncate">{field.name}</span>
              {field.required && (
                <span className="text-xs text-red-500 font-medium flex-shrink-0">Required</span>
              )}
              <Badge variant="secondary" className="text-xs flex-shrink-0 capitalize">
                {TYPE_LABELS[field.field_type] ?? field.field_type}
              </Badge>
              <button
                onClick={() => handleDelete(field.id, field.name)}
                className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-all flex-shrink-0"
                title="Delete field"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setAddOpen(true)}
        className="text-xs gap-1 h-7 px-2"
      >
        <Plus className="h-3.5 w-3.5" />
        {t('customField.addField')}
      </Button>

      <AddFieldDialog projectId={projectId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
