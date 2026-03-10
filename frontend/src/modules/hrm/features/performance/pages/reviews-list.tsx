import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { useEmployees } from '../../employees/hooks/use-employees'
import { PerformanceReviewFormDialog } from '../components/performance-review-form-dialog'
import { ReviewFeedbackForm } from '../components/review-feedback-form'
import { useReviewFeedback } from '../hooks/use-review-feedback'
import {
  type PerformanceReview,
  useCompleteReview,
  useDeletePerformanceReview,
  usePerformanceReviews,
  useSubmitReview,
} from '../hooks/use-performance-reviews'

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<string, string> = {
  draft: 'secondary',
  in_progress: 'warning',
  completed: 'success',
}

function ReviewDetailRow({ workspaceId, review }: { workspaceId: string; review: PerformanceReview }) {
  const { data: feedback = [] } = useReviewFeedback(workspaceId, review.id)
  const [showForm, setShowForm] = useState(false)
  return (
    <div className="px-4 py-3 space-y-3 bg-muted/30 border-t border-border">
      {feedback.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Feedback ({feedback.length})</p>
          <div className="space-y-2">
            {feedback.map((fb) => (
              <div key={fb.id} className="text-xs bg-card border border-border rounded p-2 space-y-1">
                <span className="font-medium capitalize">{fb.relationship_type}</span>
                {fb.scores && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fb.scores).map(([k, v]) => (
                      <span key={k} className="text-muted-foreground">{k}: <strong>{v}</strong></span>
                    ))}
                  </div>
                )}
                {fb.comments && <p className="text-muted-foreground">{fb.comments}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!showForm
        ? <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>Add Feedback</Button>
        : <ReviewFeedbackForm workspaceId={workspaceId} reviewId={review.id} onSuccess={() => setShowForm(false)} />
      }
    </div>
  )
}

export default function ReviewsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = usePerformanceReviews(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 200 })
  const submitReview = useSubmitReview(workspaceId)
  const completeReview = useCompleteReview(workspaceId)
  const deleteReview = useDeletePerformanceReview(workspaceId)
  const employeeMap = new Map((employeesData?.items ?? []).map((e) => [e.id, e.name]))

  const columns: SimpleColumn<PerformanceReview>[] = [
    { key: 'expand', label: '', className: 'w-8', render: (r) => (
      <button className="p-1 text-muted-foreground hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === r.id ? null : r.id) }}>
        {expandedId === r.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    )},
    { key: 'employee', label: 'Employee', render: (r) => employeeMap.get(r.employee_id) ?? '—' },
    { key: 'reviewer', label: 'Reviewer', render: (r) => employeeMap.get(r.reviewer_id) ?? '—' },
    { key: 'period', label: 'Period', className: 'w-24', render: (r) => r.period },
    { key: 'score', label: 'Score', className: 'w-20', render: (r) => r.overall_score ? `${r.overall_score}/5` : '—' },
    { key: 'status', label: 'Status', className: 'w-28', render: (r) => (
      <Badge variant={(STATUS_VARIANT[r.status] ?? 'secondary') as any}>{r.status}</Badge>
    )},
    { key: 'actions', label: '', className: 'w-36', render: (r) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        {r.status === 'draft' && (
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2"
            onClick={async () => { await submitReview.mutateAsync(r.id); toast({ title: 'Review submitted', variant: 'success' }) }}>
            Submit
          </Button>
        )}
        {r.status === 'in_progress' && (
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-green-700"
            onClick={async () => { await completeReview.mutateAsync(r.id); toast({ title: 'Review completed', variant: 'success' }) }}>
            Complete
          </Button>
        )}
        <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
          if (window.confirm('Delete this review?')) {
            await deleteReview.mutateAsync(r.id)
            toast({ title: 'Review deleted', variant: 'success' })
          }
        }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )},
  ]

  const items = data?.items ?? []

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Performance Reviews"
        description="Track employee performance reviews and 360-degree feedback"
        onCreateClick={() => setDialogOpen(true)}
        createLabel="New Review"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* DataTable renders rows; expanded detail rendered separately below each row via wrapper */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <DataTable columns={toColumnDefs(columns)} data={[]} keyFn={(r) => r.id} isLoading={true} emptyTitle="" />
        ) : items.length === 0 ? (
          <DataTable columns={toColumnDefs(columns)} data={[]} keyFn={(r) => r.id} emptyTitle="No performance reviews yet" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide ${col.className ?? ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <>
                  <tr key={r.id} className="group border-b border-border transition-colors text-sm hover:bg-muted/30">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-2.5 text-foreground ${col.className ?? ''}`}>
                        {col.render(r)}
                      </td>
                    ))}
                  </tr>
                  {expandedId === r.id && (
                    <tr key={`${r.id}-expanded`} className="border-b border-border">
                      <td colSpan={columns.length} className="p-0">
                        <ReviewDetailRow workspaceId={workspaceId} review={r} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <PerformanceReviewFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} />
    </div>
  )
}
