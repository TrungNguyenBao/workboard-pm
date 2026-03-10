import { useState } from 'react'
import { CheckCircle, Pencil, Trash2, XCircle, Send } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
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

  const { data, isLoading } = usePurchaseRequests(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteRequest = useDeletePurchaseRequest(workspaceId)
  const submitRequest = useSubmitPurchaseRequest(workspaceId)
  const approveRequest = useApprovePurchaseRequest(workspaceId)
  const rejectRequest = useRejectPurchaseRequest(workspaceId)

  const columns: SimpleColumn<PurchaseRequest>[] = [
    { key: 'title', label: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'estimated_total', label: 'Est. Total', render: (r) => formatCurrency(r.estimated_total) },
    { key: 'items', label: 'Items', render: (r) => r.items?.length ?? 0 },
    { key: 'status', label: 'Status', render: (r) => <PurchaseStatusBadge status={r.status} /> },
    { key: 'actions', label: '', className: 'w-28', render: (r) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        {r.status === 'draft' && (
          <button className="p-1 text-muted-foreground hover:text-primary" title="Submit"
            onClick={async () => { await submitRequest.mutateAsync(r.id); toast({ title: 'Request submitted', variant: 'success' }) }}>
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
        {r.status === 'submitted' && (
          <>
            <button className="p-1 text-muted-foreground hover:text-emerald-600" title="Approve"
              onClick={async () => { await approveRequest.mutateAsync(r.id); toast({ title: 'Request approved', variant: 'success' }) }}>
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 text-muted-foreground hover:text-destructive" title="Reject"
              onClick={async () => { await rejectRequest.mutateAsync(r.id); toast({ title: 'Request rejected', variant: 'success' }) }}>
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {r.status === 'draft' && (
          <button className="p-1 text-muted-foreground hover:text-foreground"
            onClick={() => { setEditRequest(r); setFormOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
          if (window.confirm('Delete this purchase request?')) {
            await deleteRequest.mutateAsync(r.id)
            toast({ title: 'Request deleted', variant: 'success' })
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
        title="Procurement"
        description="Manage purchase requests and approvals"
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
      </PageHeader>

      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(r) => r.id}
        isLoading={isLoading}
        emptyTitle="No purchase requests found"
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <PurchaseRequestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        workspaceId={workspaceId}
        request={editRequest}
      />
    </div>
  )
}
