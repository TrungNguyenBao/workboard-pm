---
phase: 1
title: "Design System Foundation"
status: completed
effort: 3h
depends_on: []
---

# Phase 1: Design System Foundation

## Context Links
- [Design Guidelines](../../docs/design-guidelines.md)
- [Current CSS](../../frontend/src/index.css)
- [Tailwind Config](../../frontend/tailwind.config.ts)

## Overview
Fix all hardcoded colors across the codebase, add dark mode toggle, create reusable skeleton/empty-state patterns. This phase is the prerequisite for all others.

## Key Insights
- `index.css` already defines both `:root` and `.dark` CSS variable sets correctly
- `tailwind.config.ts` has `darkMode: ['class']` -- toggle via `.dark` class on `<html>`
- Shell components hardcode `bg-white`, `bg-neutral-50`, `text-neutral-900` instead of semantic tokens
- Scrollbar thumb uses `bg-neutral-300` -- needs dark mode variant
- Dark mode section in `design-guidelines.md` section 8 provides all needed token values

## Requirements

### Functional
- Dark mode toggle button in header (persists preference to localStorage)
- All surfaces use semantic Tailwind classes (`bg-background`, `bg-card`, `text-foreground`, etc.)
- Skeleton component for table rows, cards, and list items
- Empty state component with icon + message + optional action

### Non-functional
- No visual regression in light mode after token swap
- Dark mode must work with existing shadcn components out of the box
- Zero new CSS variables needed -- use existing shadcn token system

## Architecture

### Dark Mode Toggle
- Store preference in localStorage key `a-erp-theme`
- Values: `light`, `dark`, `system`
- On mount: read preference, apply `.dark` class to `document.documentElement`
- Use a Zustand store slice (or simple hook) for reactivity

### Semantic Token Mapping

| Hardcoded | Replace With |
|-----------|-------------|
| `bg-white` | `bg-background` |
| `bg-neutral-50` | `bg-muted` or `bg-card` |
| `bg-neutral-100` | `bg-muted` |
| `text-neutral-900` | `text-foreground` |
| `text-neutral-700` | `text-foreground` |
| `text-neutral-600` | `text-muted-foreground` |
| `text-neutral-500` | `text-muted-foreground` |
| `text-neutral-400` | `text-muted-foreground` |
| `hover:bg-neutral-50` | `hover:bg-muted` |
| `hover:bg-neutral-100` | `hover:bg-accent` |
| `border-neutral-*` | `border-border` (already used in most places) |

**Note:** Not every `text-neutral-*` needs replacement. Keep accent colors on specific elements where intentional contrast is needed (e.g., badge text, priority indicators). Only replace general-purpose text/bg that should flip in dark mode.

## Related Code Files

### Files to MODIFY
- `frontend/src/index.css` -- add scrollbar dark mode, add utility classes
- `frontend/src/shared/components/shell/app-shell.tsx` -- `bg-white` -> `bg-background`
- `frontend/src/shared/components/shell/header.tsx` -- `bg-white` -> `bg-background`
- `frontend/src/shared/components/shell/sidebar.tsx` -- `bg-neutral-50` -> `bg-muted`
- `frontend/src/shared/components/shell/module-switcher.tsx` -- hover colors
- `frontend/src/modules/pms/features/projects/components/project-header.tsx` -- `bg-white`
- `frontend/src/modules/pms/features/dashboard/pages/my-tasks.tsx` -- hardcoded accent bg colors
- `frontend/src/features/auth/components/auth-layout.tsx` -- gradient hardcodes (acceptable, but right panel needs `bg-background`)
- `frontend/src/app/router.tsx` -- loading fallback `text-neutral-500`

### Files to CREATE
- `frontend/src/shared/components/ui/dark-mode-toggle.tsx` (~40 lines)
- `frontend/src/shared/components/ui/empty-state.tsx` (~35 lines)
- `frontend/src/shared/components/ui/skeleton-table.tsx` (~50 lines)
- `frontend/src/shared/hooks/use-theme.ts` (~45 lines)

## Implementation Steps

### Step 1: Create theme hook
Create `frontend/src/shared/hooks/use-theme.ts`:
- Export `useTheme()` returning `{ theme, setTheme }` where theme is `'light' | 'dark' | 'system'`
- On mount, read from `localStorage.getItem('a-erp-theme')`, default to `'system'`
- Apply/remove `.dark` class on `document.documentElement` based on resolved theme
- Listen to `prefers-color-scheme` media query for `system` mode
- Keep under 45 lines

### Step 2: Create dark mode toggle
Create `frontend/src/shared/components/ui/dark-mode-toggle.tsx`:
- Renders a ghost button cycling: system -> light -> dark -> system
- Icons: `Monitor` (system), `Sun` (light), `Moon` (dark) from lucide-react
- Uses `useTheme()` hook
- Keep under 40 lines

### Step 3: Sweep hardcoded colors in shell
For each shell file, find-replace hardcoded Tailwind classes:
- `app-shell.tsx` line 73: `bg-white` -> `bg-background`
- `header.tsx` line 18: `bg-white` -> `bg-background`, `text-neutral-900` -> `text-foreground`
- `sidebar.tsx` line 72: `bg-neutral-50` -> `bg-muted`
- `sidebar.tsx`: sweep all `text-neutral-*` and `bg-neutral-*` to semantic equivalents
- `module-switcher.tsx`: `hover:bg-neutral-100` -> `hover:bg-accent`
- `project-header.tsx` line 42: `bg-white` -> `bg-background`

### Step 4: Fix scrollbar for dark mode
In `index.css`, update scrollbar styles:
```css
::-webkit-scrollbar-thumb {
  @apply bg-neutral-300 dark:bg-neutral-600 rounded-full;
}
::-webkit-scrollbar-thumb:hover {
  @apply bg-neutral-400 dark:bg-neutral-500;
}
```

### Step 5: Create empty state component
Create `frontend/src/shared/components/ui/empty-state.tsx`:
```tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}
```
- Centered layout, icon + title + description + optional action button
- Uses semantic tokens: `text-muted-foreground`, `bg-muted`

### Step 6: Create skeleton table component
Create `frontend/src/shared/components/ui/skeleton-table.tsx`:
- Props: `rows?: number` (default 5), `columns?: number` (default 4)
- Renders a table-like skeleton with animated pulse bars
- Uses `bg-muted animate-pulse rounded`

### Step 7: Fix my-tasks accent backgrounds
In `my-tasks.tsx`, the `BucketSection` uses `bg-red-50`, `bg-amber-50`:
- These are intentional accent colors, keep them but add dark variants:
- `bg-red-50 dark:bg-red-950/30`, `bg-amber-50 dark:bg-amber-950/30`

### Step 8: Verify compilation
Run `cd frontend && npx tsc --noEmit` to check no type errors introduced.

## Todo List
- [ ] Create `use-theme.ts` hook
- [ ] Create `dark-mode-toggle.tsx`
- [ ] Sweep `app-shell.tsx` hardcoded colors
- [ ] Sweep `header.tsx` hardcoded colors
- [ ] Sweep `sidebar.tsx` hardcoded colors
- [ ] Sweep `module-switcher.tsx` hardcoded colors
- [ ] Sweep `project-header.tsx` hardcoded colors
- [ ] Fix scrollbar dark mode in `index.css`
- [ ] Create `empty-state.tsx`
- [ ] Create `skeleton-table.tsx`
- [ ] Fix dark mode for accent backgrounds in `my-tasks.tsx`
- [ ] Fix `router.tsx` loading fallback colors
- [ ] Compile check (`tsc --noEmit`)
- [ ] Visual check light mode -- no regressions

## Success Criteria
- Adding `.dark` to `<html>` flips all shell surfaces (sidebar, header, main area)
- Dark mode toggle persists across page refresh
- No hardcoded `bg-white` remains in shell components
- Skeleton and empty state components render correctly in both themes
- TypeScript compiles without errors

## Risk Assessment
- **Risk:** Replacing `text-neutral-600` with `text-muted-foreground` may change exact shade
  - **Mitigation:** The HSL values in CSS vars already approximate neutral-500, acceptable difference
- **Risk:** Some hardcoded colors in module pages may be missed
  - **Mitigation:** Phase 8 (QA) includes full dark mode audit

## Security Considerations
None -- purely frontend visual changes.
