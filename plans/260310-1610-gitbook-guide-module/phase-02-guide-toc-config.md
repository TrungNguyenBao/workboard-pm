# Phase 2: TOC Data Structure + Guide Config

## Context
- [plan.md](plan.md)
- HTML guides have sidebar sections with `class="sidebar-section-title"` and links with `class="sidebar-link"` and `href="#hash"`
- Each section title has `data-en` and `data-vi` attributes for bilingual support

## Overview
- **Priority:** High (drives all navigation components)
- **Status:** pending
- **Effort:** 1h

## Key Insights
- Each HTML guide has a well-structured sidebar: sections > links with hash anchors
- Bilingual labels available via `data-en`/`data-vi` attributes
- TOC is static config -- no API needed, just a TypeScript file

## Requirements
- Type definitions for guide TOC tree
- Config for all 5 guides with sections/items extracted from HTML
- Each item maps to: guide file + hash anchor
- Bilingual labels (en/vi)

## Architecture

```typescript
interface GuideTocItem {
  id: string           // unique slug for URL
  hash: string         // anchor in HTML (e.g., "#welcome")
  labelEn: string
  labelVi: string
}

interface GuideTocSection {
  labelEn: string
  labelVi: string
  items: GuideTocItem[]
}

interface GuideConfig {
  id: string           // URL slug: "user-guide", "sop-pms", etc.
  file: string         // HTML filename: "user-guide.html"
  labelEn: string
  labelVi: string
  icon: string         // lucide icon name
  sections: GuideTocSection[]
}
```

## Related Code Files
- **Create:** `frontend/src/features/guides/data/guide-toc.ts`

## Implementation Steps

1. Create `frontend/src/features/guides/data/guide-toc.ts` with type exports

2. Create `GuideConfig` for `user-guide`:
   - id: `"user-guide"`, file: `"user-guide.html"`
   - 7 sections: Getting Started, Workspace & Admin, PMS, WMS, HRM, CRM, Settings & More
   - Items extracted from HTML sidebar links with hash anchors

3. Create `GuideConfig` for each SOP guide:
   - `sop-pms`: file `sop-pms-guide.html`, 7 sections (Introduction, Setup, Tasks, Agile/Sprint, Views, Analytics, Reference)
   - `sop-crm`: file `sop-crm-guide.html`, 6 sections (Introduction, Lead Management, Pipeline & Sales, Customer & Support, Marketing & Data, Reference)
   - `sop-hrm`: file `sop-hrm-guide.html`, 8 sections (Introduction, Org & Records, Recruitment, Attendance & Payroll, Performance & Training, Admin, Offboarding, Reference)
   - `sop-wms`: file `sop-wsm-guide.html`, 6 sections (Introduction, Setup, Inventory, Devices, Analytics, Reference)

4. Export `GUIDE_CONFIGS: GuideConfig[]` array

5. Export helper: `getGuideById(id: string): GuideConfig | undefined`

6. Export helper: `getFlatItems(guide: GuideConfig): { section, item, index }[]` for prev/next navigation

**IMPORTANT:** This file will be large. Split into:
- `guide-toc.ts` -- types + `GUIDE_CONFIGS` array + helpers (~80 lines)
- `guide-toc-user-guide.ts` -- user guide config (~80 lines)
- `guide-toc-sop-pms.ts` -- PMS SOP config (~60 lines)
- `guide-toc-sop-crm.ts` -- CRM SOP config (~50 lines)
- `guide-toc-sop-hrm.ts` -- HRM SOP config (~60 lines)
- `guide-toc-sop-wms.ts` -- WMS SOP config (~50 lines)

## Todo
- [ ] Define TypeScript types
- [ ] Extract user-guide TOC from HTML
- [ ] Extract sop-pms TOC from HTML
- [ ] Extract sop-crm TOC from HTML
- [ ] Extract sop-hrm TOC from HTML
- [ ] Extract sop-wms TOC from HTML
- [ ] Create main guide-toc.ts with aggregation + helpers
- [ ] Verify all hash anchors match HTML ids

## Success Criteria
- All 5 guides represented with correct section/item counts
- Hash anchors match actual HTML element IDs
- Types exported and importable
- Each file under 200 lines

## Risk
- HTML anchor IDs may change if guides are updated. Document this coupling clearly.
- Some sections may have items in HTML not captured; do a thorough extraction.
