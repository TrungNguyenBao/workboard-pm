import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
import { DepartmentFormDialog } from '../components/department-form-dialog'
import { type Department, useDepartments, useDeleteDepartment } from '../hooks/use-departments'

const PAGE_SIZE = 20

export default function DepartmentsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)

  const { data } = useDepartments(workspaceId, { search: search || undefined, page, page_size: PAGE_SIZE })
  const deleteDept = useDeleteDepartment(workspaceId)

  const columns = [
    { key: 'name', label: 'Name', render: (d: Department) => <span className="font-medium">{d.name}</span> },
    { key: 'description', label: 'Description', render: (d: Department) => d.description ?? '-' },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (d: Department) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700"
            onClick={() => { setEditDept(d); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm(`Delete "${d.name}"?`)) {
                await deleteDept.mutateAsync(d.id)
                toast({ title: 'Department deleted', variant: 'success' })
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <HrmPageHeader
        title="Departments"
        description="Manage organizational departments"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditDept(null); setDialogOpen(true) }}
        createLabel="New department"
      />
      <HrmDataTable
        columns={columns}
        data={data?.items ?? []}
        keyFn={(d) => d.id}
        emptyMessage="No departments yet"
      />
      <HrmPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        department={editDept}
      />
    </div>
  )
}
