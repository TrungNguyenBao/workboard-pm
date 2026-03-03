import { useNavigate } from 'react-router-dom'
import { ClipboardList, Handshake, Users, Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type ModuleId, MODULES, useModuleStore } from '@/stores/module.store'
import { cn } from '@/shared/lib/utils'

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardList,
  Warehouse,
  Users,
  Handshake,
}

export function ModuleSwitcher() {
  const { t } = useTranslation()
  const activeModule = useModuleStore((s) => s.activeModule)
  const setActiveModule = useModuleStore((s) => s.setActiveModule)
  const navigate = useNavigate()

  function handleSwitch(id: ModuleId, path: string) {
    setActiveModule(id)
    navigate(path)
  }

  return (
    <div className="flex items-center gap-1 px-2">
      {MODULES.map((mod) => {
        const Icon = ICON_MAP[mod.icon] ?? ClipboardList
        const isActive = activeModule === mod.id
        return (
          <button
            key={mod.id}
            onClick={() => handleSwitch(mod.id, mod.path)}
            title={t(`module.${mod.id}.description`)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{t(`module.${mod.id}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
