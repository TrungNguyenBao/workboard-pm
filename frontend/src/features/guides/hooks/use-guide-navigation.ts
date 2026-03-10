import { useNavigate, useParams } from 'react-router-dom'
import { getGuideById, getFlatItems } from '../data/guide-toc'
import type { GuideConfig, GuideTocItem } from '../data/guide-toc'

export interface GuideNavContext {
  activeGuide: GuideConfig | undefined
  activeItem: GuideTocItem | undefined
  activeSectionHash: string
  prevItem: GuideTocItem | null
  nextItem: GuideTocItem | null
  navigateTo: (guideId: string, hash: string) => void
}

export function useGuideNavigation(): GuideNavContext {
  const { guideId = 'user-guide', sectionHash = '' } = useParams<{
    guideId: string
    sectionHash: string
  }>()
  const navigate = useNavigate()

  const activeGuide = getGuideById(guideId)
  const flatItems = activeGuide ? getFlatItems(activeGuide) : []

  const activeIndex = flatItems.findIndex((f) => f.item.hash === sectionHash)
  const prevItem = activeIndex > 0 ? flatItems[activeIndex - 1].item : null
  const nextItem = activeIndex >= 0 && activeIndex < flatItems.length - 1
    ? flatItems[activeIndex + 1].item
    : null

  function navigateTo(gId: string, hash: string) {
    if (hash) {
      navigate(`/guides/${gId}/${hash}`)
    } else {
      navigate(`/guides/${gId}`)
    }
  }

  return {
    activeGuide,
    activeItem: activeIndex >= 0 ? flatItems[activeIndex].item : undefined,
    activeSectionHash: sectionHash,
    prevItem,
    nextItem,
    navigateTo,
  }
}
