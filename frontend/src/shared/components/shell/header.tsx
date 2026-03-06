import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { CommandPalette } from '@/features/search/components/command-palette'
import { Breadcrumb } from '@/shared/components/ui/breadcrumb'
import { DarkModeToggle } from '@/shared/components/ui/dark-mode-toggle'

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4 shrink-0">
      <Breadcrumb />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(true)} title="Search (⌘K)">
          <Search className="h-4 w-4" />
        </Button>
        <DarkModeToggle />
        <NotificationBell />
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </header>
  )
}
