import { useState } from 'react'
import { BookOpen, ChevronRight, Search, FileText } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { GUIDE_CONFIGS } from '../data/guide-toc'
import type { GuideConfig, GuideTocSection } from '../data/guide-toc'
import { useGuideNavigation } from '../hooks/use-guide-navigation'

function SectionGroup({
  section,
  guideId,
  activeSectionHash,
  navigateTo,
  searchQuery,
}: {
  section: GuideTocSection
  guideId: string
  activeSectionHash: string
  navigateTo: (guideId: string, hash: string) => void
  searchQuery: string
}) {
  const [expanded, setExpanded] = useState(true)
  const filtered = section.items.filter((item) =>
    !searchQuery || item.labelEn.toLowerCase().includes(searchQuery.toLowerCase())
  )
  if (filtered.length === 0) return null

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-left"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {section.labelEn}
        </span>
        <ChevronRight
          className={cn('h-3 w-3 text-muted-foreground transition-transform', expanded && 'rotate-90')}
        />
      </button>
      {expanded && (
        <div>
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(guideId, item.hash)}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors',
                activeSectionHash === item.hash
                  ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary pl-3.5'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.labelEn}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GuidePicker({
  activeGuide,
  navigateTo,
}: {
  activeGuide: GuideConfig | undefined
  navigateTo: (guideId: string, hash: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 truncate">
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{activeGuide?.labelEn ?? 'Select Guide'}</span>
        </span>
        <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-90')} />
      </Button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-popover shadow-md">
          {GUIDE_CONFIGS.map((g) => (
            <button
              key={g.id}
              onClick={() => { navigateTo(g.id, ''); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                g.id === activeGuide?.id && 'text-primary font-medium',
              )}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{g.labelEn}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function GuideSidebar() {
  const { activeGuide, activeSectionHash, navigateTo } = useGuideNavigation()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r bg-muted/30 overflow-hidden">
      <div className="flex flex-col gap-2 border-b p-3">
        <GuidePicker activeGuide={activeGuide} navigateTo={navigateTo} />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {activeGuide ? (
          activeGuide.sections.map((section) => (
            <SectionGroup
              key={section.labelEn}
              section={section}
              guideId={activeGuide.id}
              activeSectionHash={activeSectionHash}
              navigateTo={navigateTo}
              searchQuery={searchQuery}
            />
          ))
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Select a guide to get started.
          </p>
        )}
      </div>
    </aside>
  )
}
