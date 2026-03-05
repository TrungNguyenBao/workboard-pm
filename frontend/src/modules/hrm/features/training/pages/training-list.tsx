import { useState } from 'react'
import { Trash2, CheckCircle, Pencil } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { HrmDataTable } from '../../shared/components/hrm-data-table'
import { HrmPageHeader } from '../../shared/components/hrm-page-header'
import { HrmPagination } from '../../shared/components/hrm-pagination'
import { useEmployees } from '../../employees/hooks/use-employees'
import { EnrollmentCompletionDialog } from '../components/enrollment-completion-dialog'
import { EnrollmentFormDialog } from '../components/enrollment-form-dialog'
import { TrainingProgramFormDialog } from '../components/training-program-form-dialog'
import { type TrainingEnrollment, useDeleteTrainingEnrollment, useTrainingEnrollments } from '../hooks/use-training-enrollments'
import { type TrainingProgram, useDeleteTrainingProgram, useTrainingPrograms } from '../hooks/use-training-programs'

const PAGE_SIZE = 20

const PROGRAM_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-neutral-100 text-neutral-600',
  cancelled: 'bg-red-100 text-red-700',
}

const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
  enrolled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  dropped: 'bg-neutral-100 text-neutral-600',
}

export default function TrainingListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [tab, setTab] = useState<'programs' | 'enrollments'>('programs')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false)
  const [editProgram, setEditProgram] = useState<TrainingProgram | null>(null)
  const [completingEnrollmentId, setCompletingEnrollmentId] = useState('')

  const { data: programsData } = useTrainingPrograms(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: tab === 'programs' ? page : 1,
    page_size: tab === 'programs' ? PAGE_SIZE : 200,
  })
  const { data: enrollmentsData } = useTrainingEnrollments(workspaceId, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: tab === 'enrollments' ? page : 1,
    page_size: PAGE_SIZE,
  })
  const { data: employeesData } = useEmployees(workspaceId, { page_size: 200 })

  const deleteProgram = useDeleteTrainingProgram(workspaceId)
  const deleteEnrollment = useDeleteTrainingEnrollment(workspaceId)

  const programMap = new Map((programsData?.items ?? []).map((p) => [p.id, p]))
  const employeeMap = new Map((employeesData?.items ?? []).map((e) => [e.id, e.name]))

  const enrollmentCountMap = new Map<string, number>()
  for (const e of enrollmentsData?.items ?? []) {
    enrollmentCountMap.set(e.program_id, (enrollmentCountMap.get(e.program_id) ?? 0) + 1)
  }

  const programColumns = [
    { key: 'name', label: 'Program', render: (p: TrainingProgram) => <span className="font-medium">{p.name}</span> },
    {
      key: 'status', label: 'Status', className: 'w-28',
      render: (p: TrainingProgram) => (
        <Badge variant="outline" className={PROGRAM_STATUS_COLORS[p.status] ?? ''}>{p.status}</Badge>
      ),
    },
    { key: 'trainer', label: 'Trainer', className: 'w-40', render: (p: TrainingProgram) => p.trainer ?? '—' },
    {
      key: 'dates', label: 'Dates', className: 'w-40',
      render: (p: TrainingProgram) =>
        p.start_date ? `${p.start_date}${p.end_date ? ` → ${p.end_date}` : ''}` : '—',
    },
    {
      key: 'budget', label: 'Budget', className: 'w-28',
      render: (p: TrainingProgram) => p.budget != null ? `$${Number(p.budget).toLocaleString()}` : '—',
    },
    {
      key: 'enrolled', label: 'Enrolled', className: 'w-20',
      render: (p: TrainingProgram) => (
        <span className="text-xs text-muted-foreground">{enrollmentCountMap.get(p.id) ?? 0}</span>
      ),
    },
    {
      key: 'actions', label: '', className: 'w-16',
      render: (p: TrainingProgram) => (
        <div className="flex items-center gap-1">
          <button className="p-1 text-neutral-400 hover:text-foreground" onClick={(e) => { e.stopPropagation(); setEditProgram(p); setProgramDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async (e) => {
              e.stopPropagation()
              if (window.confirm(`Delete program "${p.name}"?`)) {
                await deleteProgram.mutateAsync(p.id)
                toast({ title: 'Program deleted', variant: 'success' })
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const enrollmentColumns = [
    { key: 'employee', label: 'Employee', render: (e: TrainingEnrollment) => employeeMap.get(e.employee_id) ?? '—' },
    { key: 'program', label: 'Program', render: (e: TrainingEnrollment) => programMap.get(e.program_id)?.name ?? '—' },
    {
      key: 'status', label: 'Status', className: 'w-28',
      render: (e: TrainingEnrollment) => (
        <Badge variant="outline" className={ENROLLMENT_STATUS_COLORS[e.status] ?? ''}>{e.status}</Badge>
      ),
    },
    {
      key: 'score', label: 'Score', className: 'w-20',
      render: (e: TrainingEnrollment) => e.score != null ? String(e.score) : '—',
    },
    { key: 'completed_on', label: 'Completed', className: 'w-28', render: (e: TrainingEnrollment) => e.completion_date ?? '—' },
    {
      key: 'actions', label: '', className: 'w-20',
      render: (e: TrainingEnrollment) => (
        <div className="flex items-center gap-1">
          {e.status !== 'completed' && (
            <button
              className="p-1 text-neutral-400 hover:text-green-600"
              title="Mark complete"
              onClick={(ev) => { ev.stopPropagation(); setCompletingEnrollmentId(e.id); setCompletionDialogOpen(true) }}
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className="p-1 text-neutral-400 hover:text-red-600"
            onClick={async (ev) => {
              ev.stopPropagation()
              if (window.confirm('Remove this enrollment?')) {
                await deleteEnrollment.mutateAsync(e.id)
                toast({ title: 'Enrollment removed', variant: 'success' })
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const isPrograms = tab === 'programs'
  const total = isPrograms ? (programsData?.total ?? 0) : (enrollmentsData?.total ?? 0)

  return (
    <div className="flex flex-col h-full">
      <HrmPageHeader
        title="Training & Development"
        description="Manage training programs and employee enrollments"
        searchValue=""
        onSearchChange={() => {}}
        onCreateClick={() => {
          if (isPrograms) { setEditProgram(null); setProgramDialogOpen(true) }
          else setEnrollDialogOpen(true)
        }}
        createLabel={isPrograms ? 'New Program' : 'Enroll Employee'}
      >
        <div className="flex items-center gap-2 border border-border rounded-md p-0.5">
          <button
            className={`px-3 py-1 text-sm rounded transition-colors ${isPrograms ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setTab('programs'); setPage(1); setStatusFilter('all') }}
          >
            Programs
          </button>
          <button
            className={`px-3 py-1 text-sm rounded transition-colors ${!isPrograms ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setTab('enrollments'); setPage(1); setStatusFilter('all') }}
          >
            Enrollments
          </button>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {isPrograms ? (
              <>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </HrmPageHeader>

      {isPrograms ? (
        <HrmDataTable
          columns={programColumns}
          data={programsData?.items ?? []}
          keyFn={(p) => p.id}
          emptyMessage="No training programs yet"
        />
      ) : (
        <HrmDataTable
          columns={enrollmentColumns}
          data={enrollmentsData?.items ?? []}
          keyFn={(e) => e.id}
          emptyMessage="No enrollments yet"
        />
      )}

      <HrmPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <TrainingProgramFormDialog
        open={programDialogOpen}
        onOpenChange={setProgramDialogOpen}
        workspaceId={workspaceId}
        program={editProgram}
      />
      <EnrollmentFormDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        workspaceId={workspaceId}
        programs={programsData?.items ?? []}
      />
      {completionDialogOpen && (
        <EnrollmentCompletionDialog
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
          workspaceId={workspaceId}
          enrollmentId={completingEnrollmentId}
        />
      )}
    </div>
  )
}
