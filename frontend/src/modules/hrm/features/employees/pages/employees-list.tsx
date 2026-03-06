import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { EmployeeFormDialog } from '../components/employee-form-dialog'
import { type Employee, useEmployees, useDeleteEmployee } from '../hooks/use-employees'

const PAGE_SIZE = 20

export default function EmployeesListPage() {
  const { t } = useTranslation('hrm')
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)

  const { data, isLoading } = useEmployees(workspaceId, { search: search || undefined, page, page_size: PAGE_SIZE })
  const deleteEmployee = useDeleteEmployee(workspaceId)

  const columns: SimpleColumn<Employee>[] = [
    { key: 'name', label: t('employees.name'), render: (e) => <span className="font-medium">{e.name}</span> },
    { key: 'email', label: t('employees.email'), render: (e) => e.email },
    { key: 'position', label: t('employees.position'), render: (e) => e.position ?? '-' },
    {
      key: 'hire_date',
      label: t('employees.hireDate'),
      render: (e) => e.hire_date ? new Date(e.hire_date).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (e) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(ev) => ev.stopPropagation()}>
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700"
            onClick={() => { setEditEmployee(e); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm(t('common:common.deleteConfirm', { name: e.name }))) {
                await deleteEmployee.mutateAsync(e.id)
                toast({ title: t('employees.deleted'), variant: 'success' })
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
      <PageHeader
        title={t('employees.title')}
        description={t('employees.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditEmployee(null); setDialogOpen(true) }}
        createLabel={t('employees.new')}
      />
      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(e) => e.id}
        onRowClick={(e) => navigate(`/hrm/employees/${e.id}`)}
        isLoading={isLoading}
        emptyTitle={t('employees.empty')}
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        employee={editEmployee}
      />
    </div>
  )
}
