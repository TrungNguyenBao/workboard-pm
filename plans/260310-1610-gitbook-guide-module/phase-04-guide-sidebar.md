# Phase 4: Guide Sidebar Component

## Context
- [plan.md](plan.md)
- Phase 2 provides `GuideConfig` with sections/items
- Phase 3 provides `use-guide-navigation` hook
- Sidebar nav pattern: `sidebar-navigation.tsx` uses `NavGroup` with collapsible sections

## Overview
- **Priority:** High
- **Status:** pending
- **Effort:** 1h
- **Depends on:** Phase 2, Phase 3

## Key Insights
- Guide sidebar is INSIDE the content area (not replacing app sidebar)
- Uses collapsible sections matching the HTML guide sidebar structure
- Active item highlighted based on URL sectionHash param
- Guide picker at top to switch between 5 guides

## Requirements
- 240px wide sidebar inside guide viewer content area
- Guide picker dropdown at top (switch between user-guide, sop-pms, sop-crm, sop-hrm, sop-wms)
- Collapsible section groups with expand/collapse toggle
- Active item highlighted with primary color
- Scrollable if content exceeds viewport
- Bilingual labels based on i18n current language

## Related Code Files
- **Create:** `frontend/src/features/guides/components/guide-sidebar.tsx`

## Implementation Steps

### 1. Guide sidebar structure

```tsx
interface Props {
  guides: GuideConfig[]
  activeGuide: GuideConfig
  activeHash: string
  onSelectGuide: (guideId: string) => void
  onSelectItem: (hash: string) => void
}
```

### 2. Guide picker (top section)

Use a simple select or button list showing all 5 guides:
- Each guide shows its icon + label
- Active guide highlighted
- Clicking switches to that guide's first section

Use `<Select>` from shadcn/ui for compact dropdown, or render as vertical button list for GitBook-like feel.

Decision: **Vertical button list** (more GitBook-like). Each guide as a row: icon + label. Active one has `bg-primary/10 text-primary`.

### 3. Section groups

For active guide's sections:
- Section header with chevron toggle (expand/collapse)
- Default: all sections expanded
- Store collapsed state in local `useState` (map of section index -> boolean)
- Section title from `labelEn` / `labelVi` based on `i18n.language`

### 4. Section items

- Each item renders as a clickable row
- Active item: `bg-primary/8 text-primary font-medium`
- Inactive: `text-muted-foreground hover:bg-muted`
- Click calls `onSelectItem(item.hash)`
- Small dot indicator (like HTML guide's `.sidebar-link-dot`)

### 5. Bilingual label helper

```tsx
function useGuideLabel(en: string, vi: string): string {
  const { i18n } = useTranslation()
  return i18n.language === 'vi' ? vi : en
}
```

Or simpler inline: `i18n.language === 'vi' ? item.labelVi : item.labelEn`

## Todo
- [ ] Create guide-sidebar.tsx with guide picker + section tree
- [ ] Implement collapsible sections with local state
- [ ] Add active item highlighting
- [ ] Test bilingual label switching
- [ ] Verify scrolling works for long TOCs (user-guide has 40+ items)

## Success Criteria
- All 5 guides selectable
- Sections expand/collapse on click
- Active item visually distinct
- Labels switch with language toggle
- Scrollable without overflow issues
- Under 200 lines

## Risk
- Component may approach 200-line limit with all guide picker + sections + items. If needed, extract `GuideSidebarSection` as separate component.
