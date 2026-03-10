import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useGuideNavigation } from '../hooks/use-guide-navigation'

export function GuideNavFooter() {
  const { activeGuide, prevItem, nextItem, navigateTo } = useGuideNavigation()

  if (!prevItem && !nextItem) return null

  return (
    <div className="flex items-center justify-between border-t bg-background px-4 py-3 shrink-0">
      <div className="flex-1">
        {prevItem && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigateTo(activeGuide?.id ?? '', prevItem.hash)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs">{prevItem.labelEn}</span>
          </Button>
        )}
      </div>
      <div className="flex-1 flex justify-end">
        {nextItem && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigateTo(activeGuide?.id ?? '', nextItem.hash)}
          >
            <span className="text-xs">{nextItem.labelEn}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
