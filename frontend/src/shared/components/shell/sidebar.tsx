import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useSidebarState } from '@/shared/hooks/use-sidebar-state'
import { Separator } from '@/shared/components/ui/separator'
import { SidebarWorkspacePicker } from './sidebar-workspace-picker'
import { SidebarModuleSwitcher } from './sidebar-module-switcher'
import { SidebarNavigation } from './sidebar-navigation'
import { SidebarUserFooter } from './sidebar-user-footer'

export function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebarState()

  return (
    <aside className={cn(
      'flex h-screen flex-col border-r border-border bg-muted/50 transition-[width] duration-200 ease-in-out overflow-hidden flex-shrink-0',
      collapsed ? 'w-12' : 'w-56',
    )}>
      <SidebarWorkspacePicker collapsed={collapsed} />
      <Separator />
      <SidebarModuleSwitcher collapsed={collapsed} />
      <Separator />
      <SidebarNavigation collapsed={collapsed} />
      <div className="mt-auto">
        <Separator />
        <SidebarUserFooter collapsed={collapsed} />
        <Separator />
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>
    </aside>
  )
}
