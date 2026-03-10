# Phase 5: Guide Nav Footer + Breadcrumb

## Context
- [plan.md](plan.md)
- Phase 3 hook provides `prevItem` and `nextItem`
- Existing `breadcrumb.tsx` uses `SEGMENT_LABELS` map for URL segments

## Overview
- **Priority:** Medium
- **Status:** pending
- **Effort:** 45m
- **Depends on:** Phase 3

## Requirements

### Nav Footer (Previous / Next)
- Bottom bar spanning content area width (below iframe, above any page footer)
- Left side: "Previous" button with left arrow + label
- Right side: "Next" button with label + right arrow
- Hide prev if first item, hide next if last item
- When clicking next at last item of a guide, optionally link to next guide's first item
- Styled as subtle links, not heavy buttons (GitBook style)

### Breadcrumb
- Format: `Guides > {Guide Name} > {Section Name} > {Item Name}`
- Displayed above the iframe content
- Uses app's existing breadcrumb pattern OR custom guide-specific breadcrumb
- Decision: **Custom guide breadcrumb** because the existing breadcrumb reads URL segments, but guide section names come from TOC config, not URL

## Related Code Files
- **Create:** `frontend/src/features/guides/components/guide-nav-footer.tsx`
- **Create:** `frontend/src/features/guides/components/guide-breadcrumb.tsx`
- **Modify:** `frontend/src/shared/components/ui/breadcrumb.tsx` -- add `guides` to SEGMENT_LABELS (for consistency even though we use custom breadcrumb)

## Implementation Steps

### 1. guide-nav-footer.tsx

```tsx
interface Props {
  prev: { guideId: string; hash: string; labelEn: string; labelVi: string } | null
  next: { guideId: string; hash: string; labelEn: string; labelVi: string } | null
  onNavigate: (guideId: string, hash: string) => void
}
```

Layout:
```tsx
<div className="flex items-center justify-between border-t px-6 py-3">
  {prev ? (
    <button onClick={...} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ChevronLeft className="h-4 w-4" />
      <div className="text-left">
        <span className="text-xs text-muted-foreground">Previous</span>
        <span className="block font-medium">{label}</span>
      </div>
    </button>
  ) : <div />}
  {next ? (
    <button onClick={...} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <div className="text-right">
        <span className="text-xs text-muted-foreground">Next</span>
        <span className="block font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4" />
    </button>
  ) : <div />}
</div>
```

### 2. guide-breadcrumb.tsx

```tsx
interface Props {
  guideLabelEn: string
  guideLabelVi: string
  sectionLabelEn?: string
  sectionLabelVi?: string
  itemLabelEn?: string
  itemLabelVi?: string
  onNavigateGuide: () => void
}
```

Render: `Guides / {Guide} / {Section} / {Item}` with clickable segments.

### 3. Update breadcrumb.tsx

Add to `SEGMENT_LABELS`:
```typescript
guides: 'Guides',
```

## Todo
- [ ] Create guide-nav-footer.tsx
- [ ] Create guide-breadcrumb.tsx
- [ ] Add `guides` to SEGMENT_LABELS in breadcrumb.tsx
- [ ] Test prev/next navigation cycles through all items
- [ ] Verify bilingual labels work

## Success Criteria
- Prev/Next buttons navigate correctly
- Breadcrumb shows full path: Guides > Guide > Section > Item
- Bilingual labels follow app language
- Both components under 200 lines each
