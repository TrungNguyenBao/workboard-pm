import { useState } from 'react'
import { CheckCircle, Pencil, Trash2, XCircle, Send } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
import { PurchaseRequestFormDialog } from '../components/purchase-request-form-dialog'
import { PurchaseStatusBadge } from '../components/purchase-status-badge'
import {
  type PurchaseRequest,
  usePurchaseRequests,
  useDeletePurchaseRequest,
  useSubmitPurchaseRequest,
  useApprovePurchaseRequest,
  useRejectPurchaseRequest,
} from '../hooks/use-purchase-requests'

const PAGE_SIZE = 20

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function ProcurementListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editRequest, setEditRequest] = useState<PurchaseRequest | null>(null)

  const { data } = usePurchaseRequests(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteRequest = useDeletePurchaseRequest(workspaceId)
  const submitRequest = useSubmitPurchaseRequest(workspaceId)
  const approveRequest = useApprovePurchaseRequest(workspaceId)
  const rejectRequest = useRejectPurchaseRequest(workspaceId)

  const columns = [
    { key: 'title', label: 'Title', render: (r: PurchaseRequest) => <span className="font-medium">{r.title}</span> },
    { key: 'estimated_total', label: 'Est. Total', render: (r: PurchaseRequest) => formatCurrency(r.estimated_total) },
    { key: 'items', label: 'Items', render: (r: PurchaseRequest) => r.items?.length ?? 0 },
    { key: 'status', label: 'Status', render: (r: PurchaseRequest) => <PurchaseStatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: '',
      className: 'w-28',
      render: (r: PurchaseRequest) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {r.status === 'draft' && (
            <button
              className="p-1 text-neutral-400 hover:text-blue-600"
              title="Submit"
              onClick={async () => {
                await submitRequest.mutateAsync(r.id)
                toast({ title: 'Request submitted', variant: 'success' })
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
          {r.status === 'submitted' && (
            <>
              <button
                className="p-1 text-neutral-400 hover:text-green-600"
                title="Approve"
                onClick={async () => {
                  await approveRequest.mutateAsync(r.id)
                  toast({ title: 'Request approved', variant: 'success' })
                }}
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1 text-neutral-400 hover:text-red-600"
                title="Reject"
                onClick={async () => {
                  await rejectRequest.mutateAsync(r.id)
                  toast({ title: 'Request rejected', variant: 'success' })
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {r.status === 'draft' && (
            <button
              className="p-1 text-neutral-400 hover:text-neutral-700"
              onClick={() => { setEditRequest(r); setFormOpen(true) }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm('Delete this purchase request?')) {
                await deleteRequest.mutateAsync(r.id)
                toast({ title: 'Request deleted', variant: 'success' })
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
        title="Procurement"
        description="Manage purchase requests and approvals"
        searchValue=""
        onSearchChange={() => {}}
        onCreateClick={() => { setEditRequest(null); setFormOpen(true) }}
        createLabel="New Request"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </HrmPageHeader>

      <HrmDataTable
        columns={columns}
        data={data?.items ?? []}
        keyFn={(r) => r.id}
        emptyMessage="No purchase requests found"
      />
      <HrmPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <PurchaseRequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        workspaceId={workspaceId}
        request={editRequest}
      />
    </div>
  )
}
