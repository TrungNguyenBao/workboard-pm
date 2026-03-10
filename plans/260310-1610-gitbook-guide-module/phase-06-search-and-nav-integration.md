# Phase 6: Sidebar Search + App Nav Integration

## Context
- [plan.md](plan.md)
- `sidebar-navigation.tsx` renders module-specific nav items + shared items (Members)
- Search is TOC-level filtering only (not in-content search)

## Overview
- **Priority:** Medium
- **Status:** pending
- **Effort:** 45m
- **Depends on:** Phase 4, Phase 5

## Requirements

### Sidebar Search
- Text input at top of guide sidebar (below guide picker)
- Filters TOC items across all sections by label (case-insensitive, matches en or vi)
- When search active: show flat list of matching items (no section grouping)
- Clear button to reset search
- Empty state: "No matching topics"

### App Nav Integration
- Add "User Guide" link to sidebar-navigation.tsx
- Appears at bottom of nav, before Members link, regardless of active module
- Icon: `BookOpen` (already in ICON_MAP)
- Route: `/guides`
- i18n key: `nav.guides`

## Related Code Files
- **Modify:** `frontend/src/features/guides/components/guide-sidebar.tsx` -- add search input
- **Modify:** `frontend/src/shared/components/shell/sidebar-navigation.tsx` -- add guide nav item

## Implementation Steps

### 1. Search in guide-sidebar.tsx

Add state:
```tsx
const [search, setSearch] = useState('')
```

Add input below guide picker:
```tsx
<div className="px-3 py-2">
  <Input
    placeholder={t('guides.search')}
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="h-8 text-sm"
  />
</div>
```

Filter logic:
```tsx
const filteredSections = useMemo(() => {
  if (!search.trim()) return activeGuide.sections
  const q = search.toLowerCase()
  return activeGuide.sections
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.labelEn.toLowerCase().includes(q) ||
        item.labelVi.toLowerCase().includes(q)
      )
    }))
    .filter(section => section.items.length > 0)
}, [search, activeGuide])
```

### 2. App sidebar integration

In `sidebar-navigation.tsx`, add guide link after the Members `NavItem` (around line 133):

```tsx
<NavItem
  to="/guides"
  iconName="BookOpen"
  label={t('nav.guides', 'User Guide')}
  active={isActive('/guides')}
  collapsed={collapsed}
/>
```

This goes right after the Members NavItem, before the PMS-specific project list section.

### 3. i18n key

Add `nav.guides` to translation files (en: "User Guide", vi: "Huong Dan").
If i18n files don't have this key, the fallback `'User Guide'` in the `t()` call handles it.

## Todo
- [ ] Add search input to guide-sidebar.tsx
- [ ] Implement filter logic with useMemo
- [ ] Add "User Guide" NavItem to sidebar-navigation.tsx
- [ ] Add `guides.search` and `nav.guides` i18n keys (or use fallbacks)
- [ ] Test search filters correctly across sections
- [ ] Test nav link highlights when on /guides routes

## Success Criteria
- Typing in search filters sidebar items in real time
- "User Guide" link visible in app sidebar regardless of active module
- Link highlights active when on /guides routes
- Search clears properly

## Risk
- sidebar-navigation.tsx is at 182 lines. Adding 6 more lines for guide NavItem stays under 200.
