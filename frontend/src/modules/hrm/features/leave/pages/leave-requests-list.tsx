import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge, type BadgeVariant } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { LeaveRequestFormDialog } from '../components/leave-request-form-dialog'
import { LeaveTypeFormDialog } from '../components/leave-type-form-dialog'
import {
  type LeaveRequest,
  type LeaveType,
  useLeaveRequests,
  useLeaveTypes,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useDeleteLeaveRequest,
  useDeleteLeaveType,
} from '../hooks/use-leave'

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

export default function LeaveRequestsListPage() {
  const { t } = useTranslation('hrm')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [editType, setEditType] = useState<LeaveType | null>(null)

  const { data: typesData } = useLeaveTypes(workspaceId)
  const { data, isLoading } = useLeaveRequests(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })

  const approveRequest = useApproveLeaveRequest(workspaceId)
  const rejectRequest = useRejectLeaveRequest(workspaceId)
  const deleteRequest = useDeleteLeaveRequest(workspaceId)
  const deleteType = useDeleteLeaveType(workspaceId)

  const typeMap = new Map((typesData?.items ?? []).map((lt) => [lt.id, lt.name]))

  const columns: SimpleColumn<LeaveRequest>[] = [
    { key: 'leave_type', label: 'Type', render: (r) => typeMap.get(r.leave_type_id) ?? '-' },
    { key: 'start_date', label: 'Start', render: (r) => r.start_date },
    { key: 'end_date', label: 'End', render: (r) => r.end_date },
    { key: 'days', label: 'Days', className: 'w-16', render: (r) => r.days },
    {
      key: 'status',
      label: t('common:common.status'),
      render: (r) => (
        <Badge variant={(STATUS_VARIANT[r.status] ?? 'secondary') as BadgeVariant}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-28',
      render: (r) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          {r.status === 'pending' && (
            <>
              <button
                className="p-1 text-green-500 hover:text-green-700"
                title="Approve"
                onClick={async () => {
                  await approveRequest.mutateAsync(r.id)
                  toast({ title: 'Leave approved', variant: 'success' })
                }}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1 text-red-400 hover:text-red-600"
                title="Reject"
                onClick={async () => {
                  await rejectRequest.mutateAsync(r.id)
                  toast({ title: 'Leave rejected', variant: 'success' })
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            className="p-1 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              if (window.confirm('Delete this leave request?')) {
                await deleteRequest.mutateAsync(r.id)
                toast({ title: 'Leave request deleted', variant: 'success' })
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
        title={t('leave.title')}
        description={t('leave.description')}
        onCreateClick={() => setRequestDialogOpen(true)}
        createLabel={t('leave.new')}
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setEditType(null); setTypeDialogOpen(true) }}>
          Manage types
        </Button>
      </PageHeader>

      {(typesData?.items ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 py-2 border-b border-border bg-muted/30">
          {(typesData?.items ?? []).map((lt) => (
            <div key={lt.id} className="flex items-center gap-1 text-xs bg-card border border-border rounded px-2 py-1">
              <span>{lt.name} ({lt.days_per_year}d/yr)</span>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => { setEditType(lt); setTypeDialogOpen(true) }}>
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  if (window.confirm(t('common:common.deleteConfirm', { name: lt.name }))) {
                    await deleteType.mutateAsync(lt.id)
                    toast({ title: 'Leave type deleted', variant: 'success' })
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(r) => r.id}
        isLoading={isLoading}
        emptyTitle={t('leave.empty')}
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <LeaveRequestFormDialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen} workspaceId={workspaceId} />
      <LeaveTypeFormDialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen} workspaceId={workspaceId} leaveType={editType} />
    </div>
  )
}
