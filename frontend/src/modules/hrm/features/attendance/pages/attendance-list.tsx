import { useState } from 'react'
import { Clock, Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
import { AttendanceFormDialog } from '../components/attendance-form-dialog'
import { AttendanceSummaryCard } from '../components/attendance-summary-card'
import { type AttendanceRecord, useAttendance, useAttendanceSummary, useDeleteAttendance } from '../hooks/use-attendance'

const PAGE_SIZE = 20

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-800',
  half_day: 'bg-blue-100 text-blue-700',
  holiday: 'bg-purple-100 text-purple-700',
  leave: 'bg-neutral-100 text-neutral-700',
}

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function AttendanceListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState(currentPeriod())
  const [employeeIdFilter, setEmployeeIdFilter] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)

  const { data } = useAttendance(workspaceId, {
    period: period || undefined,
    employee_id: employeeIdFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: summaries = [] } = useAttendanceSummary(workspaceId, period)
  const deleteRecord = useDeleteAttendance(workspaceId)

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (r: AttendanceRecord) => <span className="font-medium">{r.date}</span>,
    },
    {
      key: 'employee_id',
      label: 'Employee ID',
      render: (r: AttendanceRecord) => <span className="font-mono text-xs text-muted-foreground">{r.employee_id.slice(0, 8)}…</span>,
    },
    {
      key: 'check_in',
      label: 'Check In',
      render: (r: AttendanceRecord) => r.check_in ?? '—',
    },
    {
      key: 'check_out',
      label: 'Check Out',
      render: (r: AttendanceRecord) => r.check_out ?? '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: AttendanceRecord) => (
        <Badge variant="outline" className={STATUS_COLORS[r.status] ?? ''}>
          {r.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'total_hours',
      label: 'Hours',
      render: (r: AttendanceRecord) => r.total_hours != null ? Number(r.total_hours).toFixed(1) : '—',
    },
    {
      key: 'overtime_hours',
      label: 'OT',
      render: (r: AttendanceRecord) => Number(r.overtime_hours) > 0
        ? <span className="text-orange-600 font-medium">{Number(r.overtime_hours).toFixed(1)}</span>
        : '—',
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (r: AttendanceRecord) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700"
            onClick={() => { setEditRecord(r); setDialogOpen(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async () => {
              if (window.confirm('Delete this attendance record?')) {
                await deleteRecord.mutateAsync(r.id)
                toast({ title: 'Attendance record deleted', variant: 'success' })
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
        title="Attendance"
        description="Track daily employee attendance records"
        searchValue=""
        onSearchChange={() => {}}
        onCreateClick={() => { setEditRecord(null); setDialogOpen(true) }}
        createLabel="New Record"
      >
        <Input
          className="w-32 h-8 text-sm"
          type="month"
          value={period}
          onChange={(e) => { setPeriod(e.target.value); setPage(1) }}
        />
        <Select
          value={showSummary ? 'summary' : 'list'}
          onValueChange={(v) => setShowSummary(v === 'summary')}
        >
          <SelectTrigger className="w-32 h-8">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List view</SelectItem>
            <SelectItem value="summary">Summary</SelectItem>
          </SelectContent>
        </Select>
      </HrmPageHeader>

      {showSummary ? (
        <div className="p-4">
          <AttendanceSummaryCard summaries={summaries} period={period} />
        </div>
      ) : (
        <>
          <HrmDataTable
            columns={columns}
            data={data?.items ?? []}
            keyFn={(r) => r.id}
            emptyMessage="No attendance records found."
          />
          <HrmPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
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
