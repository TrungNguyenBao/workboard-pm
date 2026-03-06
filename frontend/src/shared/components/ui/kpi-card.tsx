import { cn } from '@/shared/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  className?: string
  valueClassName?: string
}

export function KpiCard({ label, value, icon, className, valueClassName }: KpiCardProps) {
  return (
    <div className={cn('border border-border rounded-lg p-4 bg-card', className)}>
      {icon && (
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
          {icon}
        </div>
      )}
      <p className={cn('text-2xl font-bold text-foreground', valueClassName)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
