import { USER_GUIDE_CONFIG } from './guide-toc-user-guide'
import { SOP_PMS_CONFIG } from './guide-toc-sop-pms'
import { SOP_CRM_CONFIG } from './guide-toc-sop-crm'
import { SOP_HRM_CONFIG } from './guide-toc-sop-hrm'
import { SOP_WMS_CONFIG } from './guide-toc-sop-wms'

export interface GuideTocItem {
  id: string
  hash: string
  labelEn: string
  labelVi: string
}

export interface GuideTocSection {
  labelEn: string
  labelVi: string
  items: GuideTocItem[]
}

export interface GuideConfig {
  id: string
  file: string
  labelEn: string
  labelVi: string
  icon: string
  sections: GuideTocSection[]
}

export interface FlatGuideItem {
  sectionLabel: string
  item: GuideTocItem
  index: number
}

export const GUIDE_CONFIGS: GuideConfig[] = [
  USER_GUIDE_CONFIG,
  SOP_PMS_CONFIG,
  SOP_CRM_CONFIG,
  SOP_HRM_CONFIG,
  SOP_WMS_CONFIG,
]

export function getGuideById(id: string): GuideConfig | undefined {
  return GUIDE_CONFIGS.find((g) => g.id === id)
}

export function getFlatItems(guide: GuideConfig): FlatGuideItem[] {
  const result: FlatGuideItem[] = []
  let index = 0
  for (const section of guide.sections) {
    for (const item of section.items) {
      result.push({ sectionLabel: section.labelEn, item, index })
      index++
    }
  }
  return result
}
