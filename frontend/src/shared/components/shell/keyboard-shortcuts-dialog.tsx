import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

interface ShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { group: string; items: { keys: string[]; label: string }[] }[] = [
  {
    group: 'Navigation',
    items: [
      { keys: ['G', 'H'], label: 'Go to My Tasks' },
      { keys: ['G', 'B'], label: 'Go to Board view' },
      { keys: ['G', 'L'], label: 'Go to List view' },
    ],
  },
  {
    group: 'Tasks',
    items: [
      { keys: ['N'], label: 'New task (in focused section)' },
      { keys: ['Enter'], label: 'Open selected task' },
      { keys: ['Backspace'], label: 'Delete selected task' },
    ],
  },
  {
    group: 'Search & Help',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Open command palette' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['Esc'], label: 'Close dialog / cancel' },
    ],
  },
]

export function KeyboardShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
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
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
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
