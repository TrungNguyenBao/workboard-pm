import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
import { EmployeeFormDialog } from '../components/employee-form-dialog'
import { type Employee, useEmployees, useDeleteEmployee } from '../hooks/use-employees'

const PAGE_SIZE = 20

export default function EmployeesListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)

  const { data } = useEmployees(workspaceId, { search: search || undefined, page, page_size: PAGE_SIZE })
  const deleteEmployee = useDeleteEmployee(workspaceId)

  const columns = [
    { key: 'name', label: 'Name', render: (e: Employee) => <span className="font-medium">{e.name}</span> },
    { key: 'email', label: 'Email', render: (e: Employee) => e.email },
    { key: 'position', label: 'Position', render: (e: Employee) => e.position ?? '-' },
    {
      key: 'hire_date',
      label: 'Hire Date',
      render: (e: Employee) => e.hire_date ? new Date(e.hire_date).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (e: Employee) => (
        <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700"
            onClick={() => { setEditEmployee(e); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm(`Delete "${e.name}"?`)) {
                await deleteEmployee.mutateAsync(e.id)
                toast({ title: 'Employee deleted', variant: 'success' })
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
        title="Employees"
        description="Manage workforce and personnel"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditEmployee(null); setDialogOpen(true) }}
        createLabel="New employee"
      />
      <HrmDataTable
        columns={columns}
        data={data?.items ?? []}
        keyFn={(e) => e.id}
        emptyMessage="No employees yet"
      />
      <HrmPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        employee={editEmployee}
      />
    </div>
  )
}
