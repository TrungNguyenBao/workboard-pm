import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { useCreateSection, type Section } from '../hooks/use-project-tasks'

interface BoardAddSectionInputProps {
  projectId: string
  sections: Section[]
}

/** Inline input to add a new section column at the end of the board */
export function BoardAddSectionInput({ projectId, sections }: BoardAddSectionInputProps) {
  const { t } = useTranslation('pms')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateSection(projectId)

  function handleSubmit() {
    if (!name.trim() || create.isPending) return
    const lastPos = sections[sections.length - 1]?.position ?? 0
    create.mutate(
      { name: name.trim(), position: lastPos + 65536 },
      { onSuccess: () => { setName(''); setOpen(false) } },
    )
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="h-8 flex-shrink-0 self-start text-neutral-400"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        {t('task.addSection')}
      </Button>
    )
  }

  return (
    <div className="w-64 flex-shrink-0">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') { setOpen(false); setName('') }
        }}
        placeholder={t('task.section')}
        className="w-full rounded-md border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 bg-background"
      />
      <div className="flex gap-1 mt-1.5">
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || create.isPending}>
          {create.isPending ? '…' : t('common:common.create')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setName('') }}>
          {t('common:common.cancel')}
        </Button>
      </div>
    </div>
  )
}
