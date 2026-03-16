import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useSidebarState } from '@/shared/hooks/use-sidebar-state'
import { Separator } from '@/shared/components/ui/separator'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { SidebarWorkspacePicker } from './sidebar-workspace-picker'
import { SidebarModuleSwitcher } from './sidebar-module-switcher'
import { SidebarNavigation } from './sidebar-navigation'
import { SidebarUserFooter } from './sidebar-user-footer'

/** Shared sidebar inner content used by both desktop and mobile variants */
function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  return (
    <>
      <SidebarWorkspacePicker collapsed={collapsed} />
      <Separator />
      <SidebarModuleSwitcher collapsed={collapsed} />
      <Separator />
      <SidebarNavigation collapsed={collapsed} />
      <div className="mt-auto">
        <Separator />
        <SidebarUserFooter collapsed={collapsed} />
        {onToggle && (
          <>
            <Separator />
            <button
              onClick={onToggle}
              className="flex w-full items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed
                ? <PanelLeftOpen className="h-4 w-4" />
                : <PanelLeftClose className="h-4 w-4" />
              }
            </button>
          </>
        )}
      </div>
    </>
  )
}

/** Desktop sidebar — hidden on mobile */
export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebarState()

  return (
    <aside className={cn(
      'hidden lg:flex h-screen flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out overflow-hidden flex-shrink-0',
      collapsed ? 'w-12' : 'w-56',
    )}>
      <SidebarContent collapsed={collapsed} onToggle={toggleCollapsed} />
    </aside>
  )
}

/** Mobile sidebar — Sheet overlay, visible only on small screens */
export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarState()
  const location = useLocation()

  // Auto-close on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-56 p-0 flex flex-col [&>button]:hidden">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SidebarContent collapsed={false} />
      </SheetContent>
    </Sheet>
  )
}
