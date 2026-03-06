---
phase: 8
title: "Polish & Dark Mode QA"
status: completed
effort: 3h
depends_on: [4, 5, 6, 7]
---

# Phase 8: Polish & Dark Mode QA

## Context Links
- [Design Guidelines - Dark Mode](../../docs/design-guidelines.md)
- [index.css](../../frontend/src/index.css)
- [tailwind.config.ts](../../frontend/tailwind.config.ts)

## Overview
Final QA pass: test every page in dark mode, fix remaining hardcoded colors, verify responsive layouts, add `prefers-reduced-motion` support, ensure accessibility meets WCAG AA.

## Key Insights
- Phase 1 did initial token sweep on shell components, but module pages may have stragglers
- Form dialogs across all modules may have hardcoded colors
- Kanban board cards, task detail drawer, goal cards need dark mode verification
- `prefers-reduced-motion` rule mentioned in design guidelines but not implemented yet
- Accessibility: focus rings, touch targets, color contrast all need verification

## Requirements

### Functional
- Every page renders correctly in dark mode (no white flashes, no invisible text)
- Reduced motion mode disables all animations
- All form dialogs work in dark mode
- Responsive at 375px, 768px, 1024px, 1440px

### Non-functional
- Zero hardcoded `bg-white`, `text-neutral-900` remaining anywhere in `frontend/src/`
- WCAG AA contrast ratios on all text
- Focus rings visible in both themes

## Architecture

### QA Checklist Approach
Systematic page-by-page dark mode verification:
1. Toggle dark mode
2. Navigate to each route
3. Check for: invisible text, white backgrounds, broken borders, unreadable badges
4. Fix any issues found

### Reduced Motion
Add to `index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Related Code Files

### Files to AUDIT (dark mode sweep)
All files under:
- `frontend/src/shared/components/`
- `frontend/src/features/`
- `frontend/src/modules/pms/features/`
- `frontend/src/modules/wms/features/`
- `frontend/src/modules/hrm/features/`
- `frontend/src/modules/crm/features/`

### Files likely to need fixes
- Form dialog components (12+ files across all modules)
- `board-task-card.tsx`, `board-kanban-column.tsx` -- card backgrounds
- `task-detail-drawer.tsx` -- drawer background
- `goal-card.tsx`, `goal-detail-drawer.tsx` -- card/drawer backgrounds
- `filter-bar.tsx` -- filter button backgrounds
- `notification-bell.tsx`, dropdown -- popover backgrounds
- `command-palette.tsx` -- cmdk overlay

### Files to MODIFY
- `frontend/src/index.css` -- add reduced motion, any dark mode fixes
- Various component files -- fix hardcoded colors found during audit

## Implementation Steps

### Step 1: Automated hardcoded color scan
Run grep to find remaining hardcoded colors:
```bash
# Find bg-white (should be bg-background or bg-card)
grep -rn "bg-white" frontend/src/ --include="*.tsx"

# Find hardcoded neutral text that should flip
grep -rn "text-neutral-900\|text-neutral-800" frontend/src/ --include="*.tsx"

# Find hardcoded bg-neutral that should flip
grep -rn "bg-neutral-50\b\|bg-neutral-100\b" frontend/src/ --include="*.tsx"
```
Fix all found instances.

### Step 2: Add reduced motion support
Add to `index.css` after existing animations:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Step 3: Dark mode page-by-page QA

**Auth pages:**
- [ ] `/login` -- gradient panel, form, mobile layout
- [ ] `/register` -- same checks

**Shell:**
- [ ] Sidebar expanded -- all states (hover, active, workspace picker open)
- [ ] Sidebar collapsed -- icons, tooltips
- [ ] Header -- breadcrumbs, dark mode toggle, notification bell
- [ ] Module switcher in sidebar

**PMS module:**
- [ ] `/pms/dashboard` -- KPI cards, charts
- [ ] `/pms/my-tasks` -- task rows, bucket sections, accent backgrounds
- [ ] `/pms/goals` -- goal cards, empty state
- [ ] `/pms/projects/:id/board` -- kanban columns, task cards, drag overlay
- [ ] `/pms/projects/:id/list` -- list view table
- [ ] `/pms/projects/:id/calendar` -- calendar grid
- [ ] `/pms/projects/:id/overview` -- overview stats
- [ ] `/pms/projects/:id/timeline` -- timeline bars
- [ ] Task detail drawer -- all fields, activity timeline
- [ ] Create project dialog, project settings dialog

**WMS module:**
- [ ] `/wms/dashboard` -- KPI cards, charts
- [ ] `/wms/products` -- data table, empty state, form dialog
- [ ] `/wms/warehouses` -- data table, form dialog
- [ ] `/wms/devices` -- data table, form dialog
- [ ] `/wms/inventory` -- data table, form dialog
- [ ] `/wms/suppliers` -- data table, form dialog

**HRM module:**
- [ ] `/hrm/dashboard` -- KPI cards, charts
- [ ] `/hrm/employees` -- data table, form dialog
- [ ] `/hrm/departments` -- data table, form dialog
- [ ] `/hrm/leave` -- data table, form dialog
- [ ] `/hrm/payroll` -- data table, form dialog

**CRM module:**
- [ ] `/crm/dashboard` -- KPI cards, charts
- [ ] `/crm/contacts` -- data table, form dialog
- [ ] `/crm/deals` -- data table, form dialog

**Shared pages:**
- [ ] `/settings` -- settings form
- [ ] `/members` -- members list

### Step 4: Fix all issues found
For each issue:
1. Identify the file and line
2. Replace hardcoded color with semantic token
3. Verify fix in both light and dark mode

### Step 5: Responsive testing
Test at breakpoints: 375px, 768px, 1024px, 1440px
Key checks:
- Sidebar behavior on mobile (hidden or overlay?)
- Data tables horizontal scroll on small screens
- KPI cards grid collapse (4 -> 2 -> 1)
- Form dialogs not overflowing on mobile
- Board page horizontal scroll works

### Step 6: Accessibility audit
- **Focus rings:** Tab through interactive elements, verify visible ring in both themes
- **Contrast:** Check primary text, muted text, badge text meets AA ratio
- **Touch targets:** All buttons and interactive elements >= 36x36px
- **Screen reader:** Verify `aria-label` on icon-only buttons
- **Skip navigation:** Consider adding skip-to-content link (nice-to-have)

### Step 7: Final compile + lint
```bash
cd frontend && npx tsc --noEmit && npm run lint
```

## Todo List
- [ ] Run automated hardcoded color scan
- [ ] Fix all hardcoded colors found
- [ ] Add reduced motion support to `index.css`
- [ ] QA auth pages (dark mode)
- [ ] QA shell (sidebar, header) in dark mode
- [ ] QA PMS module pages in dark mode
- [ ] QA WMS module pages in dark mode
- [ ] QA HRM module pages in dark mode
- [ ] QA CRM module pages in dark mode
- [ ] QA shared pages in dark mode
- [ ] Fix all dark mode issues found
- [ ] Responsive testing at 4 breakpoints
- [ ] Accessibility audit (focus, contrast, touch targets)
- [ ] Final compile check
- [ ] Final lint check

## Success Criteria
- Zero hardcoded `bg-white` or `text-neutral-900` in codebase (grep returns empty)
- Every page renders correctly in dark mode
- Reduced motion preference respected
- Responsive at 375px, 768px, 1024px, 1440px
- WCAG AA contrast on all text
- All icon-only buttons have `aria-label`
- TypeScript compiles and lint passes

## Risk Assessment
- **Risk:** Some third-party component (cmdk, radix) renders with hardcoded light styles
  - **Mitigation:** shadcn/ui components use CSS variables by default; cmdk uses `--cmdk-*` vars that can be themed
- **Risk:** Recharts charts may not respect dark mode
  - **Mitigation:** Pass `stroke`/`fill` colors from CSS variables to chart components

## Security Considerations
None -- QA and polish only.

## Next Steps
After this phase, the UI overhaul is complete. Consider:
- User testing / feedback collection
- Performance profiling (bundle size, paint metrics)
- Mobile PWA considerations (future phase)
