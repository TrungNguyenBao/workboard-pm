import { Badge } from '@/shared/components/ui/badge'

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  screening: 'bg-yellow-100 text-yellow-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offered: 'bg-orange-100 text-orange-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

interface Props {
  status: string
}

export function CandidateStatusBadge({ status }: Props) {
  return (
    <Badge variant="outline" className={STATUS_COLORS[status] ?? 'bg-neutral-100 text-neutral-800'}>
      {status}
    </Badge>
  )
}
