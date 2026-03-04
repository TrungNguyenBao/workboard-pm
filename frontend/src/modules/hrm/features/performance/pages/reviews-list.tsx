import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
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

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
}

function ReviewDetailRow({ workspaceId, review }: { workspaceId: string; review: PerformanceReview }) {
  const { data: feedback = [] } = useReviewFeedback(workspaceId, review.id)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="px-4 py-3 space-y-3 bg-neutral-50 border-t border-border">
      {feedback.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Feedback ({feedback.length})</p>
          <div className="space-y-2">
            {feedback.map((fb) => (
              <div key={fb.id} className="text-xs bg-white border border-border rounded p-2 space-y-1">
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
      {!showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>Add Feedback</Button>
      ) : (
        <ReviewFeedbackForm workspaceId={workspaceId} reviewId={review.id} onSuccess={() => setShowForm(false)} />
      )}
    </div>
  )
}

export default function ReviewsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data } = usePerformanceReviews(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 200 })

  const submitReview = useSubmitReview(workspaceId)
  const completeReview = useCompleteReview(workspaceId)
  const deleteReview = useDeletePerformanceReview(workspaceId)

  const employeeMap = new Map((employeesData?.items ?? []).map((e) => [e.id, e.name]))

  const columns = [
    {
      key: 'expand',
      label: '',
      className: 'w-8',
      render: (r: PerformanceReview) => (
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === r.id ? null : r.id) }}
        >
          {expandedId === r.id
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      ),
    },
    { key: 'employee', label: 'Employee', render: (r: PerformanceReview) => employeeMap.get(r.employee_id) ?? '—' },
    { key: 'reviewer', label: 'Reviewer', render: (r: PerformanceReview) => employeeMap.get(r.reviewer_id) ?? '—' },
    { key: 'period', label: 'Period', className: 'w-24', render: (r: PerformanceReview) => r.period },
    {
      key: 'score',
      label: 'Score',
      className: 'w-20',
      render: (r: PerformanceReview) => r.overall_score ? `${r.overall_score}/5` : '—',
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-28',
      render: (r: PerformanceReview) => (
        <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ''}>{r.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-36',
      render: (r: PerformanceReview) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm('Delete this review?')) {
                await deleteReview.mutateAsync(r.id)
                toast({ title: 'Review deleted', variant: 'success' })
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
        title="Performance Reviews"
        description="Track employee performance reviews and 360-degree feedback"
        searchValue=""
        onSearchChange={() => {}}
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
      </HrmPageHeader>

      <div className="flex-1 overflow-auto">
        <HrmDataTable
          columns={columns}
          data={data?.items ?? []}
          keyFn={(r) => r.id}
          emptyMessage="No performance reviews yet"
          renderExpanded={(r: PerformanceReview) =>
            expandedId === r.id
              ? <ReviewDetailRow workspaceId={workspaceId} review={r} />
              : null
          }
        />
      </div>

      <HrmPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />

      <PerformanceReviewFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
      />
    </div>
  )
}
