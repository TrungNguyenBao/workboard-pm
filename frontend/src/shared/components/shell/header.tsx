import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { CommandPalette } from '@/features/search/components/command-palette'
import { Breadcrumb } from '@/shared/components/ui/breadcrumb'
import { DarkModeToggle } from '@/shared/components/ui/dark-mode-toggle'
import { useModuleStore } from '@/stores/module.store'
import { NotificationDropdown } from '@/modules/crm/features/notifications/components/notification-dropdown'

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const activeModule = useModuleStore((s) => s.activeModule)

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4 shrink-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Breadcrumb />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(true)} title="Search (⌘K)">
          <Search className="h-4 w-4" />
        </Button>
        <DarkModeToggle />
        {activeModule === 'crm' ? <NotificationDropdown /> : <NotificationBell />}
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </header>
  )
}
