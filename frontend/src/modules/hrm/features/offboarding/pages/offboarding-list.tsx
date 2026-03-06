import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { ResignationFormDialog } from '../components/resignation-form-dialog'
import {
  type Resignation,
  useResignations,
  useApproveResignation,
  useRejectResignation,
} from '../hooks/use-offboarding'
import { useEmployees } from '../../employees/hooks/use-employees'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-neutral-100 text-neutral-600',
}

export default function OffboardingListPage() {
  const navigate = useNavigate()
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: empData } = useEmployees(workspaceId, { page_size: 200 })
  const { data, isLoading } = useResignations(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })

  const approve = useApproveResignation(workspaceId)
  const reject = useRejectResignation(workspaceId)
  const empMap = new Map((empData?.items ?? []).map((e) => [e.id, e.name]))

  const columns: SimpleColumn<Resignation>[] = [
    { key: 'employee', label: 'Employee', render: (r) => empMap.get(r.employee_id) ?? r.employee_id.slice(0, 8) },
    { key: 'resignation_date', label: 'Resignation Date', render: (r) => r.resignation_date },
    { key: 'last_working_day', label: 'Last Working Day', render: (r) => r.last_working_day },
    { key: 'status', label: 'Status', render: (r) => (
      <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ''}>{r.status}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-20', render: (r) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        {r.status === 'pending' && (
          <>
            <button className="p-1 text-green-500 hover:text-green-700" title="Approve"
              onClick={async () => { await approve.mutateAsync(r.id); toast({ title: 'Resignation approved', variant: 'success' }) }}>
              <Check className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 text-red-400 hover:text-red-600" title="Reject"
              onClick={async () => { await reject.mutateAsync(r.id); toast({ title: 'Resignation rejected', variant: 'success' }) }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Offboarding"
        description="Manage employee resignations and offboarding"
        onCreateClick={() => setDialogOpen(true)}
        createLabel="New Resignation"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(r) => r.id}
        onRowClick={(r) => navigate(`/hrm/offboarding/${r.id}`)}
        isLoading={isLoading}
        emptyTitle="No resignations found"
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <ResignationFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} />
    </div>
  )
}
