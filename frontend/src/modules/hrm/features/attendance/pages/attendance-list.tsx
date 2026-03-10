import { useState } from 'react'
import { Clock, Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { AttendanceFormDialog } from '../components/attendance-form-dialog'
import { AttendanceSummaryCard } from '../components/attendance-summary-card'
import { type AttendanceRecord, useAttendance, useAttendanceSummary, useDeleteAttendance } from '../hooks/use-attendance'

const PAGE_SIZE = 20

const STATUS_VARIANT: Record<string, string> = {
  present: 'success',
  absent: 'danger',
  late: 'secondary',
  half_day: 'secondary',
  holiday: 'info',
  leave: 'secondary',
}

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function AttendanceListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState(currentPeriod())
  const [employeeIdFilter] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)

  const { data, isLoading } = useAttendance(workspaceId, {
    period: period || undefined,
    employee_id: employeeIdFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: summaries = [] } = useAttendanceSummary(workspaceId, period)
  const deleteRecord = useDeleteAttendance(workspaceId)

  const columns: SimpleColumn<AttendanceRecord>[] = [
    { key: 'date', label: 'Date', render: (r) => <span className="font-medium">{r.date}</span> },
    { key: 'employee_id', label: 'Employee ID', render: (r) => (
      <span className="font-mono text-xs text-muted-foreground">{r.employee_id.slice(0, 8)}…</span>
    )},
    { key: 'check_in', label: 'Check In', render: (r) => r.check_in ?? '—' },
    { key: 'check_out', label: 'Check Out', render: (r) => r.check_out ?? '—' },
    { key: 'status', label: 'Status', render: (r) => (
      <Badge variant={(STATUS_VARIANT[r.status] ?? 'secondary') as any}>
        {r.status.replace('_', ' ')}
      </Badge>
    )},
    { key: 'total_hours', label: 'Hours', render: (r) => r.total_hours != null ? Number(r.total_hours).toFixed(1) : '—' },
    { key: 'overtime_hours', label: 'OT', render: (r) => Number(r.overtime_hours) > 0
      ? <span className="text-orange-600 font-medium">{Number(r.overtime_hours).toFixed(1)}</span>
      : '—'
    },
    { key: 'actions', label: '', className: 'w-20', render: (r) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditRecord(r); setDialogOpen(true) }}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
          if (window.confirm('Delete this attendance record?')) {
            await deleteRecord.mutateAsync(r.id)
            toast({ title: 'Attendance record deleted', variant: 'success' })
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
        title="Attendance"
        description="Track daily employee attendance records"
        onCreateClick={() => { setEditRecord(null); setDialogOpen(true) }}
        createLabel="New Record"
      >
        <Input
          className="w-32 h-8 text-sm"
          type="month"
          value={period}
          onChange={(e) => { setPeriod(e.target.value); setPage(1) }}
        />
        <Select value={showSummary ? 'summary' : 'list'} onValueChange={(v) => setShowSummary(v === 'summary')}>
          <SelectTrigger className="w-32 h-8">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List view</SelectItem>
            <SelectItem value="summary">Summary</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {showSummary ? (
        <div className="p-4">
          <AttendanceSummaryCard summaries={summaries} period={period} />
        </div>
      ) : (
        <>
          <DataTable
            columns={toColumnDefs(columns)}
            data={data?.items ?? []}
            keyFn={(r) => r.id}
            isLoading={isLoading}
            emptyTitle="No attendance records found."
          />
          <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </>
      )}

      <AttendanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        record={editRecord}
      />
    </div>
  )
}
