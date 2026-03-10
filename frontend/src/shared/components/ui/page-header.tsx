import { Search, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

interface PageHeaderProps {
  title: string
  description?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onCreateClick?: () => void
  createLabel?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onCreateClick,
  createLabel = 'Create',
  filters,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onCreateClick && (
            <Button size="sm" onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-1.5" />
              {createLabel}
            </Button>
          )}
        </div>
      </div>
      {(onSearchChange ?? filters ?? children) && (
        <div className="flex items-center gap-3 flex-wrap">
          {onSearchChange && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
          )}
          {filters}
          {children}
        </div>
      )}
    </div>
  )
}
