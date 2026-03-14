import { useState } from 'react'
import { toast } from '@/shared/components/ui/toast'
import { type BantValues, useUpdateLeadBant } from '../hooks/use-leads'

interface BantRow {
  key: keyof BantValues
  label: string
}

const BANT_ROWS: BantRow[] = [
  { key: '_bant_budget', label: 'Budget' },
  { key: '_bant_authority', label: 'Authority' },
  { key: '_bant_need', label: 'Need' },
  { key: '_bant_timeline', label: 'Timeline' },
]

interface Props {
  workspaceId: string
  leadId: string
  initialValues?: BantValues
}

export function LeadBantChecklist({ workspaceId, leadId, initialValues = {} }: Props) {
  const [values, setValues] = useState<BantValues>(initialValues)
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(BANT_ROWS.map((r) => [r.key, Boolean(initialValues[r.key])]))
  )
  const updateBant = useUpdateLeadBant(workspaceId)

  function handleCheck(key: string, on: boolean) {
    setChecked((prev) => ({ ...prev, [key]: on }))
    if (!on) setValues((prev) => ({ ...prev, [key]: '' }))
  }

  async function handleSave() {
    try {
      await updateBant.mutateAsync({ leadId, ...values })
      toast({ title: 'BANT saved', variant: 'success' })
    } catch {
      toast({ title: 'Failed to save BANT', variant: 'error' })
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">BANT Qualification</p>
      {BANT_ROWS.map(({ key, label }) => (
        <div key={key} className="flex items-start gap-3">
          <input
            type="checkbox"
            id={`bant-${key}`}
            checked={checked[key] ?? false}
            onChange={(e) => handleCheck(key, e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <div className="flex-1 space-y-1">
            <label htmlFor={`bant-${key}`} className="text-sm font-medium cursor-pointer">
              {label}
            </label>
            {checked[key] && (
              <input
                type="text"
                value={values[key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Notes on ${label.toLowerCase()}…`}
                className="w-full text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={updateBant.isPending}
        className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {updateBant.isPending ? 'Saving…' : 'Save BANT'}
      </button>
    </div>
  )
}
