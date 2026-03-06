import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { RecruitmentRequestFormDialog } from '../components/recruitment-request-form-dialog'
import { type RecruitmentRequest, useRecruitmentRequests, useDeleteRecruitmentRequest } from '../hooks/use-recruitment-requests'
import { useDepartments } from '../../departments/hooks/use-departments'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function RecruitmentListPage() {
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useRecruitmentRequests(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: deptData } = useDepartments(workspaceId, { page_size: 100 })
  const deleteRequest = useDeleteRecruitmentRequest(workspaceId)

  const deptMap = new Map((deptData?.items ?? []).map((d) => [d.id, d.name]))

  const filtered = (data?.items ?? []).filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  )

  const columns: SimpleColumn<RecruitmentRequest>[] = [
    { key: 'title', label: 'Title', render: (r) => <span className="font-medium text-foreground">{r.title}</span> },
    { key: 'department', label: 'Department', render: (r) => deptMap.get(r.department_id) ?? '-' },
    { key: 'quantity', label: 'Qty', className: 'w-14 text-center', render: (r) => r.quantity },
    { key: 'deadline', label: 'Deadline', render: (r) => r.deadline ?? '—' },
    { key: 'status', label: 'Status', render: (r) => (
      <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ''}>{r.status}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-16', render: (r) => (
      <button className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
        onClick={async (e) => {
          e.stopPropagation()
          if (window.confirm('Delete this recruitment request?')) {
            await deleteRequest.mutateAsync(r.id)
            toast({ title: 'Request deleted', variant: 'success' })
          }
        }}>
        Delete
      </button>
    )},
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Recruitment"
        description="Manage open positions and candidate pipeline"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => setDialogOpen(true)}
        createLabel="New Request"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        columns={toColumnDefs(columns)}
        data={filtered}
        keyFn={(r) => r.id}
        onRowClick={(r) => navigate(`/hrm/recruitment/${r.id}`)}
        isLoading={isLoading}
        emptyTitle="No recruitment requests found"
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <RecruitmentRequestFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} />
    </div>
  )
}
