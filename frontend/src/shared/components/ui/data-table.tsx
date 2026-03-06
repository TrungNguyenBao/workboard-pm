import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
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
    <div className="flex-1 overflow-auto">
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
                      'px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide',
                      canSort && 'cursor-pointer select-none hover:text-foreground',
                      (header.column.columnDef.meta as { className?: string } | undefined)?.className,
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && sorted === 'asc' && <ChevronUp className="h-3 w-3" />}
                      {canSort && sorted === 'desc' && <ChevronDown className="h-3 w-3" />}
                    </span>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={keyFn(row.original)}
              onClick={() => onRowClick?.(row.original)}
              className={cn(
                'group border-b border-border transition-colors text-sm hover:bg-muted/30',
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
