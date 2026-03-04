import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
import { useEmployees } from '../../employees/hooks/use-employees'
import { KpiAssignmentFormDialog } from '../components/kpi-assignment-form-dialog'
import { KpiTemplateFormDialog } from '../components/kpi-template-form-dialog'
import { type KpiAssignment, useDeleteKpiAssignment, useKpiAssignments } from '../hooks/use-kpi-assignments'
import { type KpiTemplate, useDeleteKpiTemplate, useKpiTemplates } from '../hooks/use-kpi-templates'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-neutral-100 text-neutral-600',
}

function KpiProgressBar({ actual, target }: { actual: number | null; target: number }) {
  if (actual === null || target === 0) return <span className="text-xs text-muted-foreground">—</span>
  const pct = Math.min(Math.round((actual / target) * 100), 100)
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function KpiListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [periodFilter, setPeriodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<KpiTemplate | null>(null)

  const { data: templatesData } = useKpiTemplates(workspaceId, { page_size: 100 })
  const { data: assignmentsData } = useKpiAssignments(workspaceId, {
    period: periodFilter || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 200 })

  const deleteTemplate = useDeleteKpiTemplate(workspaceId)
  const deleteAssignment = useDeleteKpiAssignment(workspaceId)

  const templateMap = new Map((templatesData?.items ?? []).map((t) => [t.id, t]))
  const employeeMap = new Map((employeesData?.items ?? []).map((e) => [e.id, e.name]))

  const assignmentColumns = [
    { key: 'template', label: 'KPI', render: (r: KpiAssignment) => templateMap.get(r.template_id)?.name ?? '—' },
    { key: 'employee', label: 'Employee', render: (r: KpiAssignment) => employeeMap.get(r.employee_id) ?? '—' },
    { key: 'period', label: 'Period', className: 'w-24', render: (r: KpiAssignment) => r.period },
    {
      key: 'progress',
      label: 'Progress',
      render: (r: KpiAssignment) => <KpiProgressBar actual={r.actual_value} target={r.target_value} />,
    },
    {
      key: 'target',
      label: 'Target',
      className: 'w-20',
      render: (r: KpiAssignment) => r.target_value,
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-24',
      render: (r: KpiAssignment) => (
        <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ''}>{r.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-12',
      render: (r: KpiAssignment) => (
        <button
          className="p-1 text-neutral-400 hover:text-red-600"
          onClick={async (e) => {
            e.stopPropagation()
            if (window.confirm('Delete this KPI assignment?')) {
              await deleteAssignment.mutateAsync(r.id)
              toast({ title: 'Assignment deleted', variant: 'success' })
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <HrmPageHeader
        title="KPI Tracking"
        description="Manage KPI templates and employee assignments"
        searchValue=""
        onSearchChange={() => {}}
        onCreateClick={() => setAssignmentDialogOpen(true)}
        createLabel="New Assignment"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setEditTemplate(null); setTemplateDialogOpen(true) }}>
          Manage Templates
        </Button>
      </HrmPageHeader>

      {/* Template chips */}
      {(templatesData?.items ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 py-2 border-b border-border bg-neutral-50/50">
          {(templatesData?.items ?? []).map((tpl) => (
            <div key={tpl.id} className="flex items-center gap-1 text-xs bg-white border border-border rounded px-2 py-1">
              <span className="font-medium">{tpl.name}</span>
              {tpl.category && <span className="text-muted-foreground">· {tpl.category}</span>}
              {tpl.measurement_unit && <span className="text-muted-foreground">({tpl.measurement_unit})</span>}
              <button className="text-neutral-400 hover:text-neutral-700 ml-1" onClick={() => { setEditTemplate(tpl); setTemplateDialogOpen(true) }}>
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="text-neutral-400 hover:text-red-600"
                onClick={async () => {
                  if (window.confirm(`Delete template "${tpl.name}"?`)) {
                    await deleteTemplate.mutateAsync(tpl.id)
                    toast({ title: 'Template deleted', variant: 'success' })
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <HrmDataTable
        columns={assignmentColumns}
        data={assignmentsData?.items ?? []}
        keyFn={(r) => r.id}
        emptyMessage="No KPI assignments yet"
      />
      <HrmPagination page={page} pageSize={PAGE_SIZE} total={assignmentsData?.total ?? 0} onPageChange={setPage} />

      <KpiTemplateFormDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        workspaceId={workspaceId}
        template={editTemplate}
      />
      <KpiAssignmentFormDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        workspaceId={workspaceId}
      />
    </div>
  )
}
