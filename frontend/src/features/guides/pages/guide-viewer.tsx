import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { GuideSidebar } from '../components/guide-sidebar'
import { GuideContentFrame } from '../components/guide-content-frame'
import { GuideNavFooter } from '../components/guide-nav-footer'
import { GuideBreadcrumb } from '../components/guide-breadcrumb'
import { useGuideNavigation } from '../hooks/use-guide-navigation'

export default function GuideViewerPage() {
  const { activeGuide, activeSectionHash } = useGuideNavigation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const guideFile = activeGuide?.file ?? 'user-guide.html'

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <GuideSidebar />
      </div>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <GuideSidebar />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar: mobile toggle + breadcrumb */}
        <div className="flex items-center gap-3 border-b bg-background px-4 py-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open guide navigation</span>
          </Button>
          <GuideBreadcrumb />
        </div>

        {/* iframe fills remaining height */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <GuideContentFrame guideFile={guideFile} sectionHash={activeSectionHash} />
        </div>

        <GuideNavFooter />
      </div>
    </div>
  )
}
