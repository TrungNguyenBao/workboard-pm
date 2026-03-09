import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { DepartmentFormDialog } from '../components/department-form-dialog'
import { VisualOrgChart } from '../components/visual-org-chart'
import { type Department, useDepartments, useDeleteDepartment } from '../hooks/use-departments'

const PAGE_SIZE = 20
type ViewMode = 'list' | 'chart'

export default function DepartmentsListPage() {
  const { t } = useTranslation('hrm')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const { data, isLoading } = useDepartments(workspaceId, { search: search || undefined, page, page_size: PAGE_SIZE })
  const deleteDept = useDeleteDepartment(workspaceId)

  const columns: SimpleColumn<Department>[] = [
    { key: 'name', label: t('common:common.name'), render: (d) => <span className="font-medium">{d.name}</span> },
    { key: 'description', label: t('common:common.description'), render: (d) => d.description ?? '-' },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (d) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700"
            onClick={() => { setEditDept(d); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm(t('common:common.deleteConfirm', { name: d.name }))) {
                await deleteDept.mutateAsync(d.id)
                toast({ title: t('departments.deleted'), variant: 'success' })
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
        title={t('departments.title')}
        description={t('departments.description')}
        searchValue={viewMode === 'list' ? search : undefined}
        onSearchChange={viewMode === 'list' ? (v) => { setSearch(v); setPage(1) } : undefined}
        onCreateClick={() => { setEditDept(null); setDialogOpen(true) }}
        createLabel={t('departments.new')}
      />

      {/* View mode tabs */}
      <div className="flex gap-1 px-6 border-b border-border">
        {(['list', 'chart'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              viewMode === mode
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'chart' ? 'Org Chart' : 'List'}
          </button>
        ))}
      </div>

      {viewMode === 'list' && (
        <>
          <DataTable
            columns={toColumnDefs(columns)}
            data={data?.items ?? []}
            keyFn={(d) => d.id}
            isLoading={isLoading}
            emptyTitle={t('departments.empty')}
          />
          <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      {viewMode === 'chart' && (
        <div className="flex-1 overflow-auto">
          <VisualOrgChart workspaceId={workspaceId} />
        </div>
      )}

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        department={editDept}
      />
    </div>
  )
}
