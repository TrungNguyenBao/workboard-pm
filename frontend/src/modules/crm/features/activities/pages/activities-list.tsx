import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { ActivityFormDialog } from '../components/activity-form-dialog'
import { type Activity, ACTIVITY_TYPES, useActivities, useDeleteActivity } from '../hooks/use-activities'

const PAGE_SIZE = 20

export default function ActivitiesListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)

  const { data, isLoading } = useActivities(workspaceId, {
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteActivity = useDeleteActivity(workspaceId)

  const columns: SimpleColumn<Activity>[] = [
    {
      key: 'type', label: 'Type', render: (a) => (
        <Badge variant="secondary">{ACTIVITY_TYPES.find((t) => t.value === a.type)?.label ?? a.type}</Badge>
      ),
    },
    { key: 'subject', label: 'Subject', render: (a) => <span className="font-medium">{a.subject}</span> },
    { key: 'date', label: 'Date', render: (a) => new Date(a.date).toLocaleDateString() },
    { key: 'notes', label: 'Notes', render: (a) => <span className="text-muted-foreground truncate max-w-[200px] block">{a.notes ?? '-'}</span> },
    {
      key: 'actions', label: '', className: 'w-20', render: (a) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditActivity(a); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
            if (window.confirm(`Delete activity "${a.subject}"?`)) {
              await deleteActivity.mutateAsync(a.id)
              toast({ title: 'Activity deleted', variant: 'success' })
            }
          }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Activities"
        description="Track sales activities and interactions"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditActivity(null); setDialogOpen(true) }}
        createLabel="New Activity"
      >
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ACTIVITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>
      <DataTable columns={toColumnDefs(columns)} data={data?.items ?? []} keyFn={(a) => a.id} isLoading={isLoading} emptyTitle="No activities yet" />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <ActivityFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} activity={editActivity} />
    </div>
  )
}
