import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/shared/hooks/use-theme'
import { Button } from '@/shared/components/ui/button'

type Theme = 'light' | 'dark' | 'system'

const CYCLE: Theme[] = ['system', 'light', 'dark']

const ICON: Record<Theme, React.ElementType> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

const LABEL: Record<Theme, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
}

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICON[theme]

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]
    setTheme(next)
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={cycle} title={LABEL[theme]}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}
