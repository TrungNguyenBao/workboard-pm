import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { useDepartments } from '../../departments/hooks/use-departments'
import { PositionFormDialog } from '../components/position-form-dialog'
import { type Position, usePositions, useDeletePosition } from '../hooks/use-positions'

const PAGE_SIZE = 20

export default function PositionsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deptFilter, setDeptFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)

  const { data, isLoading } = usePositions(workspaceId, {
    search: search || undefined,
    department_id: deptFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: deptData } = useDepartments(workspaceId, { page_size: 100 })
  const deletePosition = useDeletePosition(workspaceId)

  const deptMap = Object.fromEntries(deptData?.items.map((d) => [d.id, d.name]) ?? [])

  const columns: SimpleColumn<Position>[] = [
    { key: 'title', label: 'Title', render: (p) => <span className="font-medium">{p.title}</span> },
    { key: 'department', label: 'Department', render: (p) => deptMap[p.department_id] ?? '-' },
    { key: 'headcount_limit', label: 'Headcount limit', render: (p) => p.headcount_limit === 0 ? 'Unlimited' : p.headcount_limit },
    { key: 'is_active', label: 'Status', render: (p) => (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        p.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
      }`}>
        {p.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (p) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-neutral-400 hover:text-neutral-700"
          onClick={() => { setEditPosition(p); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
          if (window.confirm(`Delete "${p.title}"?`)) {
            await deletePosition.mutateAsync(p.id)
            toast({ title: 'Position deleted', variant: 'success' })
          }
        }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )},
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Positions"
        description="Manage job positions across departments"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditPosition(null); setDialogOpen(true) }}
        createLabel="New position"
      >
        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm h-8"
        >
          <option value="">All departments</option>
          {deptData?.items.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </PageHeader>
      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(p) => p.id}
        isLoading={isLoading}
        emptyTitle="No positions found"
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <PositionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        position={editPosition}
      />
    </div>
  )
}
