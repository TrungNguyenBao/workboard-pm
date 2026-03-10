import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity, BookOpen, Box, Briefcase, Building2, Calendar, CheckSquare,
  ClipboardCheck, Clock, Cpu, DollarSign, Home, Kanban, LogOut, Megaphone,
  Package, Plus, Shield, ShoppingCart, Star, Target, Ticket, TrendingUp,
  Truck, UserCheck, Users, UserPlus, Warehouse as WarehouseIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useModuleStore } from '@/stores/module.store'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { SidebarProjectNavItem } from './sidebar-project-nav-item'
import { CreateProjectDialog } from '@/modules/pms/features/projects/components/create-project-dialog'
import { InviteMembersDialog } from '@/features/workspaces/components/invite-members-dialog'
import api from '@/shared/lib/api'
import type { NavGroupDef, NavItemDef } from './sidebar-nav-config'
import { PMS_NAV, HRM_NAV, CRM_NAV, WMS_NAV } from './sidebar-nav-config'

interface Project { id: string; name: string; color: string; description: string | null; is_archived: boolean }
interface Props { collapsed: boolean }

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity, BookOpen, Box, Briefcase, Building2, Calendar, CheckSquare,
  ClipboardCheck, Clock, Cpu, DollarSign, Home, Kanban, LogOut, Megaphone,
  Package, Shield, ShoppingCart, Star, Target, Ticket, TrendingUp,
  Truck, UserCheck, Users, UserPlus, Warehouse: WarehouseIcon,
}

function NavItem({ to, iconName, label, active, collapsed }: {
  to: string; iconName: string; label: string; active: boolean; collapsed: boolean
}) {
  const Icon = ICON_MAP[iconName] ?? Box
  const btn = (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 rounded-sm py-1.5 text-sm transition-colors',
        active
          ? 'bg-primary/8 text-primary font-medium border-l-2 border-primary pl-1.5 pr-2'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground pl-2 pr-2',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }
  return btn
}

function NavGroup({ group, collapsed, isActive }: {
  group: NavGroupDef; collapsed: boolean; isActive: (path: string) => boolean
}) {
  const { t } = useTranslation()
  return (
    <div>
      {group.label && !collapsed && (
        <div className="pt-4 pb-1 px-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t(group.label)}
          </span>
        </div>
      )}
      {group.items.map((item: NavItemDef) => (
        <NavItem
          key={item.to}
          to={item.to}
          iconName={item.icon}
          label={t(item.labelKey, item.labelKey.split('.').pop() ?? item.labelKey)}
          active={isActive(item.to)}
          collapsed={collapsed}
        />
      ))}
    </div>
  )
}

export function SidebarNavigation({ collapsed }: Props) {
  const { t } = useTranslation()
  const location = useLocation()
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const activeModule = useModuleStore((s) => s.activeModule)
  const [projDialogOpen, setProjDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: () => api.get(`/pms/workspaces/${activeWorkspaceId}/projects`).then((r) => r.data),
    enabled: !!activeWorkspaceId && activeModule === 'pms',
  })

  function isActive(path: string) { return location.pathname.startsWith(path) }

  if (!activeWorkspaceId) {
    return collapsed ? null : (
      <div className="px-2 py-6 text-center flex-1">
        <p className="text-xs text-muted-foreground mb-3">{t('sidebar.noWorkspaceYet')}</p>
      </div>
    )
  }

  const navGroups =
    activeModule === 'hrm' ? HRM_NAV
    : activeModule === 'crm' ? CRM_NAV
    : activeModule === 'wms' ? WMS_NAV
    : PMS_NAV

  return (
    <TooltipProvider>
      <nav className="flex-1 overflow-y-auto px-1.5 py-2">
        {navGroups.map((group, i) => (
          <NavGroup key={group.label ?? `group-${i}`} group={group} collapsed={collapsed} isActive={isActive} />
        ))}

        <NavItem
          to="/members"
          iconName="Users"
          label={t('nav.members')}
          active={isActive('/members')}
          collapsed={collapsed}
        />

        {activeModule === 'pms' && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-1 px-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('sidebar.projects')}
                </span>
              </div>
            )}
            {projects.filter((p) => !p.is_archived).map((p) => (
              <SidebarProjectNavItem
                key={p.id}
                project={p}
                active={isActive(`/pms/projects/${p.id}`)}
                workspaceId={activeWorkspaceId}
                collapsed={collapsed}
              />
            ))}
            {!collapsed && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground mt-1"
                  onClick={() => setProjDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />{t('sidebar.newProject')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />{t('sidebar.inviteMembers')}
                </Button>
              </>
            )}
          </>
        )}
      </nav>

      {/* User Guide — always visible */}
      {!collapsed && (
        <div className="pt-4 pb-1 px-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Resources
          </span>
        </div>
      )}
      <NavItem
        to="/guides"
        iconName="BookOpen"
        label="User Guide"
        active={isActive('/guides')}
        collapsed={collapsed}
      />

      <CreateProjectDialog open={projDialogOpen} onOpenChange={setProjDialogOpen} workspaceId={activeWorkspaceId} />
      <InviteMembersDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} workspaceId={activeWorkspaceId} />
    </TooltipProvider>
  )
}
