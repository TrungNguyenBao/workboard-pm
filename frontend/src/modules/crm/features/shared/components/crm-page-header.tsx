import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Plus, Search } from 'lucide-react'

interface Props {
  title: string
  description: string
  searchValue: string
  onSearchChange: (value: string) => void
  onCreateClick: () => void
  createLabel?: string
  children?: React.ReactNode
}

export function CrmPageHeader({
  title,
  description,
  searchValue,
  onSearchChange,
  onCreateClick,
  createLabel = 'Create',
  children,
}: Props) {
  const { t } = useTranslation()
  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-1.5" />
          {createLabel}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder={t('common.search')}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
        {children}
      </div>
    </div>
  )
}
