import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, RefreshCw } from 'lucide-react'
import api from '@/shared/lib/api'
import { Badge } from '@/shared/components/ui/badge'

interface Contract {
  id: string
  title: string
  contract_number: string
  status: string
  value: number
  start_date: string
  end_date: string | null
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function statusVariant(s: string): 'default' | 'secondary' | 'danger' {
  if (s === 'active') return 'default'
  if (s === 'terminated' || s === 'expired') return 'danger'
  return 'secondary'
}

interface Props {
  workspaceId: string
  accountId: string
}

export function AccountContractsTab({ workspaceId, accountId }: Props) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ items: Contract[] }>({
    queryKey: ['crm-contracts', workspaceId, { account_id: accountId }],
    queryFn: () =>
      api.get(`/crm/workspaces/${workspaceId}/contracts`, { params: { account_id: accountId, page_size: 50 } })
        .then((r) => r.data),
    enabled: !!workspaceId && !!accountId,
  })

  const renew = useMutation({
    mutationFn: (contractId: string) =>
      api.post(`/crm/workspaces/${workspaceId}/contracts/${contractId}/renew`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-contracts', workspaceId] }),
  })

  if (isLoading) {
    return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
  }

  const contracts = data?.items ?? []

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <FileText className="h-8 w-8" />
        <p className="text-sm">No contracts linked to this account</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {contracts.map((c) => (
        <div key={c.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
            <p className="text-xs text-muted-foreground">
              {c.contract_number} &middot; {c.start_date} – {c.end_date ?? 'ongoing'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
            <span className="text-sm font-medium text-foreground">{formatCurrency(c.value)}</span>
            <button
              onClick={() => renew.mutate(c.id)}
              disabled={renew.isPending}
              title="Renew contract"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
