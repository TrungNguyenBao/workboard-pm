import { useNavigate } from 'react-router-dom'
import { ClipboardList, Handshake, Users, Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type ModuleId, MODULES, useModuleStore } from '@/stores/module.store'
import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardList,
  Warehouse,
  Users,
  Handshake,
}

interface Props { collapsed: boolean }

export function SidebarModuleSwitcher({ collapsed }: Props) {
  const { t } = useTranslation()
  const activeModule = useModuleStore((s) => s.activeModule)
  const setActiveModule = useModuleStore((s) => s.setActiveModule)
  const navigate = useNavigate()

  function handleSwitch(id: ModuleId, path: string) {
    setActiveModule(id)
    navigate(path)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-0.5 px-1.5 py-2">
        {MODULES.map((mod) => {
          const Icon = ICON_MAP[mod.icon] ?? ClipboardList
          const isActive = activeModule === mod.id
          const label = t(`module.${mod.id}`)

          const btn = (
            <button
              key={mod.id}
              onClick={() => handleSwitch(mod.id, mod.path)}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          )

          if (collapsed) {
            return (
              <Tooltip key={mod.id}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          }

          return btn
        })}
      </div>
    </TooltipProvider>
  )
}
