import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { SkeletonTable } from '@/shared/components/ui/skeleton-table'
import { EmptyState } from '@/shared/components/ui/empty-state'

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  keyFn: (row: T) => string
  onRowClick?: (row: T) => void
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  enableSorting?: boolean
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyFn,
  onRowClick,
  isLoading,
  emptyTitle = 'No data',
  emptyDescription,
  enableSorting = false,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
  })

  if (isLoading) return <SkeletonTable columns={columns.length} />

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={cn('flex-1 overflow-auto', className)}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                const canSort = enableSorting && header.column.getCanSort()
                return (
                  <th
                    key={header.id}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    className={cn(
                      'px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide',
                      canSort && 'cursor-pointer select-none hover:text-foreground',
                      (header.column.columnDef.meta as { className?: string } | undefined)?.className,
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && !sorted && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      {canSort && sorted === 'asc' && <ArrowUp className="h-3 w-3" />}
                      {canSort && sorted === 'desc' && <ArrowDown className="h-3 w-3" />}
                    </span>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr
              key={keyFn(row.original)}
              onClick={() => onRowClick?.(row.original)}
              className={cn(
                'group border-b border-border transition-colors text-sm',
                'hover:bg-muted/50',
                rowIndex % 2 === 1 && 'bg-muted/20',
                onRowClick && 'cursor-pointer',
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'px-4 py-2.5 text-foreground',
                    (cell.column.columnDef.meta as { className?: string } | undefined)?.className,
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
