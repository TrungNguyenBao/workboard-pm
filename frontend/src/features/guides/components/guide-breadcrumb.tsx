import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useGuideNavigation } from '../hooks/use-guide-navigation'
import { getFlatItems } from '../data/guide-toc'

export function GuideBreadcrumb() {
  const { activeGuide, activeSectionHash } = useGuideNavigation()

  const flatItems = activeGuide ? getFlatItems(activeGuide) : []
  const activeEntry = flatItems.find((f) => f.item.hash === activeSectionHash)

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link to="/guides" className="text-muted-foreground hover:text-foreground transition-colors">
        Guides
      </Link>
      {activeGuide && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <Link
            to={`/guides/${activeGuide.id}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {activeGuide.labelEn}
          </Link>
        </>
      )}
      {activeEntry && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground font-medium">{activeEntry.sectionLabel}</span>
        </>
      )}
    </nav>
  )
}
