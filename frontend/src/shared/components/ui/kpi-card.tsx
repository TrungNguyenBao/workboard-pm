import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'flat'
  }
  className?: string
  valueClassName?: string
}

export function KpiCard({ label, value, icon, trend, className, valueClassName }: KpiCardProps) {
  return (
    <div className={cn('border border-border rounded-lg p-4 bg-card', className)}>
      {icon && (
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
          {icon}
        </div>
      )}
      <p className={cn('text-2xl font-bold text-foreground', valueClassName)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {trend && (
        <div className={cn(
          'flex items-center gap-1 text-xs mt-1.5',
          trend.direction === 'up' && 'text-emerald-600 dark:text-emerald-400',
          trend.direction === 'down' && 'text-red-600 dark:text-red-400',
          trend.direction === 'flat' && 'text-muted-foreground',
        )}>
          {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
          {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
          {trend.direction === 'flat' && <Minus className="h-3 w-3" />}
          <span>{trend.direction === 'flat' ? 'No change' : `${Math.abs(trend.value)}%`}</span>
        </div>
      )}
    </div>
  )
}
