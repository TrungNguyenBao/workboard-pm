import type { ColumnDef } from '@tanstack/react-table'
import type React from 'react'

/** Simple column definition for backward compatibility with existing module tables */
export interface SimpleColumn<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  className?: string
  enableSorting?: boolean
}

/** Convert SimpleColumn array to TanStack ColumnDef array */
export function toColumnDefs<T>(cols: SimpleColumn<T>[]): ColumnDef<T, unknown>[] {
  return cols.map((col) => ({
    id: col.key,
    header: col.label,
    cell: ({ row }: { row: { original: T } }) => col.render(row.original),
    enableSorting: col.enableSorting ?? false,
    meta: { className: col.className },
  }))
}
