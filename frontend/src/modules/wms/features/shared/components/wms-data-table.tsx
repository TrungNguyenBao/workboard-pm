import { cn } from '@/shared/lib/utils'

interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyFn: (item: T) => string
  onRowClick?: (item: T) => void
  emptyMessage?: string
}

export function WmsDataTable<T>({ columns, data, keyFn, onRowClick, emptyMessage = 'No data' }: Props<T>) {
  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <p className="text-sm text-neutral-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-neutral-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide', col.className)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyFn(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'border-b border-border hover:bg-neutral-50 transition-colors',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-2.5 text-sm text-neutral-700', col.className)}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
