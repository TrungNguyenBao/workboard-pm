import { Badge } from '@/shared/components/ui/badge'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  ordered: 'bg-purple-100 text-purple-800',
  completed: 'bg-emerald-100 text-emerald-800',
}

interface Props {
  status: string
}

export function PurchaseStatusBadge({ status }: Props) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700'}>
      {status}
    </Badge>
  )
}
