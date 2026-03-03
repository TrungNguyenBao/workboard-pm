import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

export type PriorityFilter = 'all' | 'high' | 'medium' | 'low' | 'none'
export type StatusFilter = 'all' | 'incomplete' | 'completed'

interface Props {
  priority: PriorityFilter
  status: StatusFilter
  onPriority: (p: PriorityFilter) => void
  onStatus: (s: StatusFilter) => void
}

export function FilterBar({ priority, status, onPriority, onStatus }: Props) {
  const { t } = useTranslation('pms')
  const isFiltered = priority !== 'all' || status !== 'all'

  const PRIORITIES: { value: PriorityFilter; label: string; color: string }[] = [
    { value: 'all', label: t('filter.all'), color: '' },
    { value: 'high', label: t('filter.high'), color: 'text-red-600 bg-red-50' },
    { value: 'medium', label: t('filter.medium'), color: 'text-yellow-600 bg-yellow-50' },
    { value: 'low', label: t('filter.low'), color: 'text-neutral-600 bg-neutral-100' },
  ]

  const STATUSES: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('filter.all') },
    { value: 'incomplete', label: t('filter.active') },
    { value: 'completed', label: t('filter.done') },
  ]

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-white text-xs">
      <span className="text-neutral-400 font-medium">{t('filter.label')}</span>

      <div className="flex items-center gap-1">
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            onClick={() => onPriority(p.value)}
            className={cn(
              'rounded-full px-2.5 py-0.5 font-medium transition-colors',
              priority === p.value
                ? p.color || 'bg-primary text-white'
                : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-3.5 w-px bg-border" />

      <div className="flex items-center gap-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatus(s.value)}
            className={cn(
              'rounded-full px-2.5 py-0.5 font-medium transition-colors',
              status === s.value
                ? 'bg-primary text-white'
                : 'text-neutral-500 hover:bg-neutral-100',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isFiltered && (
        <>
          <div className="h-3.5 w-px bg-border" />
          <button
            onClick={() => { onPriority('all'); onStatus('all') }}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            {t('filter.clear')}
          </button>
        </>
      )}
    </div>
  )
}
