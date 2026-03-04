# Phase 2: Frontend Shared Components

## Context Links

- [WMS data table](../../frontend/src/modules/wms/features/shared/components/wms-data-table.tsx)
- [WMS pagination](../../frontend/src/modules/wms/features/shared/components/wms-pagination.tsx)
- [WMS page header](../../frontend/src/modules/wms/features/shared/components/wms-page-header.tsx)

## Overview

- **Priority:** P1 (blocks Phase 3 and 4)
- **Status:** completed
- **Effort:** 1h

Create CRM-specific shared components mirroring WMS pattern. These are module-scoped (not global shared) to allow CRM-specific customization later without affecting WMS.

## Key Insights

- WMS has 3 shared components: data table, pagination, page header
- All are simple, under 65 lines each
- They use shared UI primitives (Button, Input) from `@/shared/components/ui/`
- CRM versions should be near-identical copies with `Crm` prefix
- Lucide icons used: `Search`, `Plus`, `ChevronLeft`, `ChevronRight`
- `cn()` utility from `@/shared/lib/utils` for classname merging

## Requirements

### Functional
- `CrmDataTable<T>` -- generic table with columns, keyFn, onRowClick, emptyMessage
- `CrmPagination` -- prev/next with page info, hidden when total <= pageSize
- `CrmPageHeader` -- title, description, search input, create button, children slot for filters

### Non-functional
- Each file under 65 lines
- Identical API to WMS counterparts for consistency

## Related Code Files

### Files to Create
1. `frontend/src/modules/crm/features/shared/components/crm-data-table.tsx`
2. `frontend/src/modules/crm/features/shared/components/crm-pagination.tsx`
3. `frontend/src/modules/crm/features/shared/components/crm-page-header.tsx`

## Implementation Steps

### Step 1: Create directory structure

```
frontend/src/modules/crm/features/shared/components/
```

### Step 2: Create `crm-data-table.tsx`

Copy WMS data table pattern exactly, rename component to `CrmDataTable`:

```tsx
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

export function CrmDataTable<T>({
  columns, data, keyFn, onRowClick, emptyMessage = 'No data',
}: Props<T>) {
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
                className={cn(
                  'px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide',
                  col.className,
                )}
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
```

### Step 3: Create `crm-pagination.tsx`

Copy WMS pagination pattern exactly, rename to `CrmPagination`:

```tsx
import { Button } from '@/shared/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function CrmPagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-3">
      <span className="text-sm text-neutral-500">
        {total} item{total !== 1 ? 's' : ''} · Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

### Step 4: Create `crm-page-header.tsx`

Copy WMS page header pattern exactly, rename to `CrmPageHeader`:

```tsx
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Plus, Search } from 'lucide-react'

interface Props {
  title: string
  description: string
  searchValue: string
  onSearchChange: (value: string) => void
  onCreateClick: () => void
  createLabel?: string
  children?: React.ReactNode
}

export function CrmPageHeader({
  title, description, searchValue, onSearchChange,
  onCreateClick, createLabel = 'Create', children,
}: Props) {
  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-1.5" />
          {createLabel}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
        {children}
      </div>
    </div>
  )
}
```

## Todo List

- [x] Create `shared/components/` directory under `crm/features/`
- [x] Create `crm-data-table.tsx`
- [x] Create `crm-pagination.tsx`
- [x] Create `crm-page-header.tsx`
- [x] Verify imports compile (run `make dev-frontend` or `npx tsc --noEmit`)

## Success Criteria

- All 3 components exist and compile without errors
- API matches WMS counterparts (same props interface)
- Each file under 65 lines

## Risk Assessment

- **Minimal risk:** Direct copies of battle-tested WMS components
- No shared state, no API calls, pure presentational
