import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

interface RecurrencePickerProps {
  rule: string | null
  cronExpr: string | null
  endDate: string | null
  onChange: (data: {
    recurrence_rule: string | null
    recurrence_cron_expr?: string | null
    recurrence_end_date?: string | null
  }) => void
}

const RULE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom_cron', label: 'Custom CRON' },
]

export function RecurrencePicker({ rule, cronExpr, endDate, onChange }: RecurrencePickerProps) {
  const currentRule = rule ?? 'none'

  function handleRuleChange(value: string) {
    if (value === 'none') {
      onChange({ recurrence_rule: null, recurrence_cron_expr: null, recurrence_end_date: null })
    } else if (value === 'custom_cron') {
      onChange({ recurrence_rule: 'custom_cron', recurrence_cron_expr: cronExpr ?? '' })
    } else {
      onChange({ recurrence_rule: value, recurrence_cron_expr: null })
    }
  }

  function handleCronChange(expr: string) {
    onChange({ recurrence_rule: 'custom_cron', recurrence_cron_expr: expr || null })
  }

  function handleEndDateChange(date: string) {
    onChange({
      recurrence_rule: rule,
      recurrence_end_date: date ? new Date(date).toISOString() : null,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={currentRule} onValueChange={handleRuleChange}>
        <SelectTrigger className="h-7 w-36 text-xs border-0 bg-muted hover:bg-muted/80">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RULE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentRule === 'custom_cron' && (
        <input
          type="text"
          value={cronExpr ?? ''}
          onChange={(e) => handleCronChange(e.target.value)}
          placeholder="0 9 * * 1-5"
          className="text-xs bg-muted rounded px-2 py-1 border-0 outline-none focus:ring-2 focus:ring-primary/40 w-36 font-mono text-foreground"
        />
      )}

      {currentRule !== 'none' && (
        <input
          type="date"
          value={endDate ? endDate.slice(0, 10) : ''}
          onChange={(e) => handleEndDateChange(e.target.value)}
          className="text-xs bg-muted rounded px-2 py-1 border-0 outline-none text-foreground"
          title="End date (optional)"
        />
      )}
    </div>
  )
}
