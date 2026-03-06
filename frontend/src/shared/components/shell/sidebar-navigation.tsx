import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Activity, BookOpen, Box, Briefcase, Building2, Calendar, CheckSquare, ClipboardCheck, Clock, Cpu, DollarSign, Home, Kanban, LogOut, Megaphone, Package, Plus, Shield, ShoppingCart, Star, Target, Ticket, TrendingUp, Truck, UserCheck, Users, UserPlus, Warehouse as WarehouseIcon } from 'lucide-react'
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

interface Project { id: string; name: string; color: string; description: string | null; is_archived: boolean }
interface Props { collapsed: boolean }

function NavItem({ to, icon, label, active, collapsed }: { to: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean }) {
  const btn = (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
        active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        collapsed && 'justify-center',
      )}
    >
      {icon}
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

  const noWorkspace = !activeWorkspaceId

  if (noWorkspace) {
    return collapsed ? null : (
      <div className="px-2 py-6 text-center flex-1">
        <p className="text-xs text-muted-foreground mb-3">{t('sidebar.noWorkspaceYet')}</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <nav className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
        {activeModule === 'hrm' ? (
          <>
            <NavItem to="/hrm/dashboard" icon={<Home className="h-4 w-4" />} label={t('nav.dashboard', 'Dashboard')} active={isActive('/hrm/dashboard')} collapsed={collapsed} />
            <NavItem to="/hrm/employees" icon={<Users className="h-4 w-4" />} label={t('nav.employees')} active={isActive('/hrm/employees')} collapsed={collapsed} />
            <NavItem to="/hrm/departments" icon={<Briefcase className="h-4 w-4" />} label={t('nav.departments')} active={isActive('/hrm/departments')} collapsed={collapsed} />
            <NavItem to="/hrm/positions" icon={<Box className="h-4 w-4" />} label={t('nav.positions')} active={isActive('/hrm/positions')} collapsed={collapsed} />
            <NavItem to="/hrm/leave" icon={<Calendar className="h-4 w-4" />} label={t('nav.leave')} active={isActive('/hrm/leave')} collapsed={collapsed} />
            <NavItem to="/hrm/payroll" icon={<DollarSign className="h-4 w-4" />} label={t('nav.payroll')} active={isActive('/hrm/payroll')} collapsed={collapsed} />
            <NavItem to="/hrm/attendance" icon={<Clock className="h-4 w-4" />} label={t('nav.attendance')} active={isActive('/hrm/attendance')} collapsed={collapsed} />
            <NavItem to="/hrm/insurance" icon={<Shield className="h-4 w-4" />} label={t('nav.insurance')} active={isActive('/hrm/insurance')} collapsed={collapsed} />
            <NavItem to="/hrm/recruitment" icon={<UserPlus className="h-4 w-4" />} label={t('nav.recruitment')} active={isActive('/hrm/recruitment')} collapsed={collapsed} />
            <NavItem to="/hrm/onboarding" icon={<ClipboardCheck className="h-4 w-4" />} label={t('nav.onboarding')} active={isActive('/hrm/onboarding')} collapsed={collapsed} />
            <NavItem to="/hrm/performance" icon={<TrendingUp className="h-4 w-4" />} label={t('nav.performance')} active={isActive('/hrm/performance')} collapsed={collapsed} />
            <NavItem to="/hrm/reviews" icon={<Star className="h-4 w-4" />} label={t('nav.reviews')} active={isActive('/hrm/reviews')} collapsed={collapsed} />
            <NavItem to="/hrm/training" icon={<BookOpen className="h-4 w-4" />} label={t('nav.training')} active={isActive('/hrm/training')} collapsed={collapsed} />
            <NavItem to="/hrm/offboarding" icon={<LogOut className="h-4 w-4" />} label={t('nav.offboarding')} active={isActive('/hrm/offboarding')} collapsed={collapsed} />
            <NavItem to="/hrm/assets" icon={<Package className="h-4 w-4" />} label={t('nav.assets')} active={isActive('/hrm/assets')} collapsed={collapsed} />
            <NavItem to="/hrm/procurement" icon={<ShoppingCart className="h-4 w-4" />} label={t('nav.procurement')} active={isActive('/hrm/procurement')} collapsed={collapsed} />
            <NavItem to="/members" icon={<Users className="h-4 w-4" />} label={t('nav.members')} active={isActive('/members')} collapsed={collapsed} />
          </>
        ) : activeModule === 'crm' ? (
          <>
            <NavItem to="/crm/dashboard" icon={<Home className="h-4 w-4" />} label={t('nav.dashboard', 'Dashboard')} active={isActive('/crm/dashboard')} collapsed={collapsed} />
            <NavItem to="/crm/leads" icon={<UserCheck className="h-4 w-4" />} label="Leads" active={isActive('/crm/leads')} collapsed={collapsed} />
            <NavItem to="/crm/contacts" icon={<Users className="h-4 w-4" />} label={t('nav.contacts')} active={isActive('/crm/contacts')} collapsed={collapsed} />
            <NavItem to="/crm/accounts" icon={<Building2 className="h-4 w-4" />} label="Accounts" active={isActive('/crm/accounts')} collapsed={collapsed} />
            <NavItem to="/crm/deals" icon={<DollarSign className="h-4 w-4" />} label={t('nav.deals')} active={isActive('/crm/deals')} collapsed={collapsed} />
            <NavItem to="/crm/pipeline" icon={<Kanban className="h-4 w-4" />} label="Pipeline" active={isActive('/crm/pipeline')} collapsed={collapsed} />
            <NavItem to="/crm/activities" icon={<Activity className="h-4 w-4" />} label="Activities" active={isActive('/crm/activities')} collapsed={collapsed} />
            <NavItem to="/crm/campaigns" icon={<Megaphone className="h-4 w-4" />} label="Campaigns" active={isActive('/crm/campaigns')} collapsed={collapsed} />
            <NavItem to="/crm/tickets" icon={<Ticket className="h-4 w-4" />} label="Tickets" active={isActive('/crm/tickets')} collapsed={collapsed} />
            <NavItem to="/members" icon={<UserPlus className="h-4 w-4" />} label={t('nav.members')} active={isActive('/members')} collapsed={collapsed} />
          </>
        ) : activeModule === 'wms' ? (
          <>
            <NavItem to="/wms/dashboard" icon={<Home className="h-4 w-4" />} label={t('nav.dashboard', 'Dashboard')} active={isActive('/wms/dashboard')} collapsed={collapsed} />
            <NavItem to="/wms/products" icon={<Package className="h-4 w-4" />} label={t('nav.products')} active={isActive('/wms/products')} collapsed={collapsed} />
            <NavItem to="/wms/warehouses" icon={<WarehouseIcon className="h-4 w-4" />} label={t('nav.warehouses')} active={isActive('/wms/warehouses')} collapsed={collapsed} />
            <NavItem to="/wms/devices" icon={<Cpu className="h-4 w-4" />} label={t('nav.devices')} active={isActive('/wms/devices')} collapsed={collapsed} />
            <NavItem to="/wms/inventory" icon={<Box className="h-4 w-4" />} label={t('nav.inventory')} active={isActive('/wms/inventory')} collapsed={collapsed} />
            <NavItem to="/wms/suppliers" icon={<Truck className="h-4 w-4" />} label={t('nav.suppliers')} active={isActive('/wms/suppliers')} collapsed={collapsed} />
            <NavItem to="/members" icon={<Users className="h-4 w-4" />} label={t('nav.members')} active={isActive('/members')} collapsed={collapsed} />
          </>
        ) : (
          <>
            <NavItem to="/pms/dashboard" icon={<Home className="h-4 w-4" />} label={t('nav.dashboard', 'Dashboard')} active={isActive('/pms/dashboard')} collapsed={collapsed} />
            <NavItem to="/pms/my-tasks" icon={<CheckSquare className="h-4 w-4" />} label={t('nav.myTasks')} active={isActive('/pms/my-tasks')} collapsed={collapsed} />
            <NavItem to="/pms/goals" icon={<Target className="h-4 w-4" />} label={t('nav.goals')} active={isActive('/pms/goals')} collapsed={collapsed} />
            <NavItem to="/members" icon={<Users className="h-4 w-4" />} label={t('nav.members')} active={isActive('/members')} collapsed={collapsed} />

            {!collapsed && (
              <div className="pt-4 pb-1 px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('sidebar.projects')}</span>
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

      <CreateProjectDialog open={projDialogOpen} onOpenChange={setProjDialogOpen} workspaceId={activeWorkspaceId} />
      <InviteMembersDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} workspaceId={activeWorkspaceId} />
    </TooltipProvider>
  )
}
