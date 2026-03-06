import { useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { LanguageSwitcher } from './language-switcher'
import { generateInitials } from '@/shared/lib/utils'

interface Props { collapsed: boolean }

export function SidebarUserFooter({ collapsed }: Props) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const avatar = (
    <Avatar className="h-7 w-7 flex-shrink-0">
      <AvatarImage src={user?.avatar_url ?? undefined} />
      <AvatarFallback>{generateInitials(user?.name ?? 'U')}</AvatarFallback>
    </Avatar>
  )

  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-1 py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/settings')} className="hover:opacity-80 transition-opacity">
                {avatar}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{user?.name}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => navigate('/settings')} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                <Settings className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t('sidebar.settings')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={async () => { await logout(); navigate('/login') }}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t('sidebar.logOut')}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="px-3 py-2">
      <div className="border-b border-border pb-2 mb-2">
        <LanguageSwitcher />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          title={t('sidebar.profileSettings')}
        >
          {avatar}
          <span className="text-sm text-foreground flex-1 truncate text-left">{user?.name}</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          title={t('sidebar.settings')}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={async () => { await logout(); navigate('/login') }}
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          title={t('sidebar.logOut')}
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
