import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, LayoutDashboard, Users, Zap } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

/** Split-panel auth layout: left branding + right form */
export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  const features = [
    { icon: LayoutDashboard, text: t('auth.branding.feature1') },
    { icon: Users, text: t('auth.branding.feature2') },
    { icon: Zap, text: t('auth.branding.feature3') },
    { icon: CheckCircle2, text: t('auth.branding.feature4') },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-gradient-to-br from-[#5E6AD2] to-[#4338CA] dark:from-[#3B41A0] dark:to-[#2D2B8A] p-10 text-white">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur-sm text-lg font-bold">
              W
            </div>
            <span className="text-xl font-semibold tracking-tight">{t('app.name')}</span>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-bold leading-tight mb-3" style={{ whiteSpace: 'pre-line' }}>
            {t('auth.branding.tagline')}
          </h2>
          <p className="text-white/70 text-base mb-12 max-w-[340px]">
            {t('auth.branding.subtitle')}
          </p>

          {/* Feature list */}
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 dark:bg-white/5">
                  <Icon size={16} className="text-white/90" />
                </div>
                <span className="text-sm text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} {t('auth.branding.copyright')}</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-[380px] animate-fade-in">{children}</div>
      </div>
    </div>
  )
}
