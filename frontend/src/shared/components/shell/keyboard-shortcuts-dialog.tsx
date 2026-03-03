import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

interface ShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const { t } = useTranslation()

  const SHORTCUTS = [
    {
      group: t('shortcuts.navigation'),
      items: [
        { keys: ['G', 'H'], label: t('shortcuts.goToMyTasks') },
        { keys: ['G', 'B'], label: t('shortcuts.goToBoard') },
        { keys: ['G', 'L'], label: t('shortcuts.goToList') },
      ],
    },
    {
      group: t('shortcuts.tasks'),
      items: [
        { keys: ['N'], label: t('shortcuts.newTask') },
        { keys: ['Enter'], label: t('shortcuts.openSelected') },
        { keys: ['Backspace'], label: t('shortcuts.deleteSelected') },
      ],
    },
    {
      group: t('shortcuts.searchHelp'),
      items: [
        { keys: ['Ctrl', 'K'], label: t('shortcuts.openCommandPalette') },
        { keys: ['?'], label: t('shortcuts.showShortcuts') },
        { keys: ['Esc'], label: t('shortcuts.closeDialog') },
      ],
    },
  ]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          {SHORTCUTS.map(({ group, items }) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{group}</p>
              <div className="space-y-1.5">
                {items.map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <kbd className="rounded border border-border bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-600 shadow-sm">
                            {k}
                          </kbd>
                          {i < keys.length - 1 && <span className="text-xs text-neutral-400">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
