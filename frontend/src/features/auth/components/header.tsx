import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { CommandPalette } from '@/features/search/components/command-palette'

interface HeaderProps {
  title?: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-white px-6">
      {title && <h1 className="text-base font-semibold text-neutral-900">{title}</h1>}
      {!title && <div />}

      <div className="flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(true)} title="Search (⌘K)">
          <Search className="h-4 w-4" />
        </Button>
        <NotificationBell />
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </header>
  )
}
