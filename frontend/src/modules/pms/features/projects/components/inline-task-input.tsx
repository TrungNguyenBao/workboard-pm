import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { useCreateTask } from '../hooks/use-project-tasks'

interface Props {
  projectId: string
  sectionId: string | null
  /** Visual style: 'card' for board columns, 'row' for list view */
  variant?: 'card' | 'row'
}

export function InlineTaskInput({ projectId, sectionId, variant = 'card' }: Props) {
  const { t } = useTranslation('pms')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const createTask = useCreateTask(projectId)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function handleSubmit() {
    const trimmed = title.trim()
    if (!trimmed) return
    createTask.mutate(
      { title: trimmed, section_id: sectionId },
      { onSuccess: () => { setTitle(''); inputRef.current?.focus() } },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') { setOpen(false); setTitle('') }
  }

  function handleBlur() {
    if (!title.trim()) { setOpen(false) }
  }

  if (!open) {
    if (variant === 'row') {
      return (
        <button
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors border-b border-border"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          {t('task.addTask')}
        </button>
      )
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-neutral-400 hover:text-neutral-700"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('task.addTask')}
      </Button>
    )
  }

  if (variant === 'row') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-white">
        <div className="w-4 flex-shrink-0" />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={t('task.title')}
          className="flex-1 text-sm outline-none placeholder:text-neutral-300"
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSubmit() }}
          disabled={!title.trim() || createTask.isPending}
          className="text-xs text-primary font-medium disabled:opacity-40 hover:text-primary/80"
        >
          {createTask.isPending ? '…' : t('task.addTask')}
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); setOpen(false); setTitle('') }}
          className="text-neutral-400 hover:text-neutral-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // card variant
  return (
    <div className="rounded-md border border-primary/40 bg-white p-2 shadow-card">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={t('task.title')}
        className="w-full text-sm outline-none placeholder:text-neutral-300 mb-2"
      />
      <div className="flex items-center gap-1.5">
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSubmit() }}
          disabled={!title.trim() || createTask.isPending}
          className="px-2 py-1 text-xs rounded-sm bg-primary text-white font-medium disabled:opacity-40 hover:bg-primary/90"
        >
          {createTask.isPending ? '…' : t('task.addTask')}
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); setOpen(false); setTitle('') }}
          className="p-1 text-neutral-400 hover:text-neutral-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
