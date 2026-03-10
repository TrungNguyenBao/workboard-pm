import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from '@/shared/components/ui/toast'
import { DataTable } from '@/shared/components/ui/data-table'
import { toColumnDefs, type SimpleColumn } from '@/shared/components/ui/data-table-types'
import { PageHeader } from '@/shared/components/ui/page-header'
import { PaginationControls } from '@/shared/components/ui/pagination-controls'
import { DealFormDialog } from '../components/deal-form-dialog'
import { DealCloseDialog } from '../components/deal-close-dialog'
import { type Deal, DEAL_STAGES, useDeals, useDeleteDeal } from '../hooks/use-deals'
import { useContacts } from '../../contacts/hooks/use-contacts'

const PAGE_SIZE = 20

const STAGE_VARIANT: Record<string, string> = {
  closed_won: 'success',
  closed_lost: 'danger',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function DealsListPage() {
  const { t } = useTranslation('crm')
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [closeDeal, setCloseDeal] = useState<Deal | null>(null)

  const { data, isLoading } = useDeals(workspaceId, {
    search: search || undefined,
    stage: stage === 'all' ? undefined : stage,
    page,
    page_size: PAGE_SIZE,
  })
  const { data: contactsData } = useContacts(workspaceId, { page_size: 100 })
  const deleteDeal = useDeleteDeal(workspaceId)

  const contactMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of contactsData?.items ?? []) map.set(c.id, c.name)
    return map
  }, [contactsData])

  const columns: SimpleColumn<Deal>[] = [
    { key: 'title', label: t('deals.titleLabel'), render: (d) => <span className="font-medium">{d.title}</span> },
    { key: 'value', label: t('deals.value'), render: (d) => formatCurrency(d.value) },
    {
      key: 'stage',
      label: t('deals.stage'),
      render: (d) => (
        <Badge variant={(STAGE_VARIANT[d.stage] ?? 'secondary') as any}>
          {DEAL_STAGES.find((s) => s.value === d.stage)?.label ?? d.stage}
        </Badge>
      ),
    },
    { key: 'contact', label: t('deals.contact'), render: (d) => (d.contact_id ? contactMap.get(d.contact_id) ?? '-' : '-') },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (d) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          {!d.stage.startsWith('closed_') && (
            <button className="p-1 text-muted-foreground hover:text-emerald-600" title="Close deal" onClick={() => setCloseDeal(d)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditDeal(d); setDialogOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 text-muted-foreground hover:text-destructive" onClick={async () => {
            if (window.confirm(t('common:common.deleteConfirm', { name: d.title }))) {
              await deleteDeal.mutateAsync(d.id)
              toast({ title: t('deals.deleted'), variant: 'success' })
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
        title={t('deals.title')}
        description={t('deals.description')}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onCreateClick={() => { setEditDeal(null); setDialogOpen(true) }}
        createLabel={t('deals.new')}
      >
        <Select value={stage} onValueChange={(v) => { setStage(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('deals.allStages')}</SelectItem>
            {DEAL_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>
      <DataTable
        columns={toColumnDefs(columns)}
        data={data?.items ?? []}
        keyFn={(d) => d.id}
        isLoading={isLoading}
        emptyTitle={t('deals.empty')}
      />
      <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
      <DealFormDialog open={dialogOpen} onOpenChange={setDialogOpen} workspaceId={workspaceId} deal={editDeal} />
      {closeDeal && (
        <DealCloseDialog
          dealId={closeDeal.id}
          dealTitle={closeDeal.title}
          open={!!closeDeal}
          onOpenChange={(v) => { if (!v) setCloseDeal(null) }}
          workspaceId={workspaceId}
        />
      )}
    </div>
  )
}
