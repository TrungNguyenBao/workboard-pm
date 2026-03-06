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
import { TicketFormDialog } from '../components/ticket-form-dialog'
import { type Ticket, TICKET_PRIORITIES, TICKET_STATUSES, useTickets, useDeleteTicket } from '../hooks/use-tickets'

const PAGE_SIZE = 20

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  critical: 'destructive',
  high: 'destructive',
}

export default function TicketsListPage() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTicket, setEditTicket] = useState<Ticket | null>(null)

  const { data, isLoading } = useTickets(workspaceId, {
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteTicket = useDeleteTicket(workspaceId)

  const columns: SimpleColumn<Ticket>[] = [
    { key: 'subject', label: 'Subject', render: (t) => <span className="font-medium">{t.subject}</span> },
    {
      key: 'priority', label: 'Priority', render: (t) => (
        <Badge variant={PRIORITY_VARIANT[t.priority] ?? 'secondary'}>
          {TICKET_PRIORITIES.find((p) => p.value === t.priority)?.label ?? t.priority}
        </Badge>
      ),
    },
    {
      key: 'status', label: 'Status', render: (t) => (
        <Badge variant={t.status === 'resolved' || t.status === 'closed' ? 'default' : 'secondary'}>
          {TICKET_STATUSES.find((s) => s.value === t.status)?.label ?? t.status}
        </Badge>
      ),
    },
    { key: 'created', label: 'Created', render: (t) => new Date(t.created_at).toLocaleDateString() },
    {
      key: 'actions', label: '', className: 'w-20', render: (t) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button className="p-1 text-neutral-400 hover:text-neutral-700" onClick={() => { setEditTicket(t); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-neutral-400 hover:text-red-600" onClick={async () => {
            if (window.confirm(`Delete ticket "${t.subject}"?`)) {
              await deleteTicket.mutateAsync(t.id)
              toast({ title: 'Ticket deleted', variant: 'success' })
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
        title="Tickets"
        description="Customer support tickets"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditTicket(null); setDialogOpen(true) }}
        createLabel="New Ticket"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {TICKET_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {TICKET_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>
      <DataTable columns={toColumnDefs(columns)} data={data?.items ?? []} keyFn={(t) => t.id} isLoading={isLoading} emptyTitle="No tickets yet" />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <TicketFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} ticket={editTicket} />
    </div>
  )
}
