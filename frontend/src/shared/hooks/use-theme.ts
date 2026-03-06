import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  root.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('a-erp-theme') as Theme) ?? 'system'
  })

  useEffect(() => {
    applyTheme(theme)

    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onMediaChange() { applyTheme('system') }
    mq.addEventListener('change', onMediaChange)
    return () => mq.removeEventListener('change', onMediaChange)
  }, [theme])

  function setTheme(t: Theme) {
    localStorage.setItem('a-erp-theme', t)
    setThemeState(t)
  }

  return { theme, setTheme }
}
