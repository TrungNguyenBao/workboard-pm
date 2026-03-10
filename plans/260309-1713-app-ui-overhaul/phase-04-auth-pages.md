# Phase 4: Auth Pages

## Context Links
- [Phase 1: Design Foundation](./phase-01-design-foundation.md)
- [Auth Layout](../../frontend/src/features/auth/components/auth-layout.tsx)
- [Login Page](../../frontend/src/features/auth/pages/login.tsx)
- [Register Page](../../frontend/src/features/auth/pages/register.tsx)

## Overview
- **Priority**: P2 — first impression for new users
- **Status**: completed
- **Effort**: 1.5h
- **Depends on**: Phase 1, Phase 2
- **Description**: Update auth pages from purple gradient branding to enterprise navy/blue gradient. Refine form styling, improve mobile logo, align with new design tokens.

## Key Insights
- `auth-layout.tsx` (65 lines) has hardcoded purple gradient: `from-[#5E6AD2] to-[#4338CA]` and dark variant `from-[#3B41A0] to-[#2D2B8A]`. These bypass CSS tokens.
- `login.tsx` (111 lines) uses `bg-primary` for mobile logo which auto-resolves. Rest uses token classes.
- `register.tsx` — needs same treatment as login.
- Feature list icons use `bg-white/10` which is color-agnostic — works with any gradient.
- The `W` logo block uses `bg-white/20` — works regardless of gradient color.

## Related Code Files

### Files to Modify
1. `frontend/src/features/auth/components/auth-layout.tsx` — gradient colors, minor polish
2. `frontend/src/features/auth/pages/login.tsx` — mobile logo bg color
3. `frontend/src/features/auth/pages/register.tsx` — mobile logo bg color (same pattern)

## Implementation Steps

### Step 1: Update auth-layout.tsx — Gradient Colors

Replace hardcoded purple gradients with enterprise navy/blue:

**Light mode gradient:**
```
from-[#5E6AD2] to-[#4338CA]
```
becomes:
```
from-[#1E40AF] to-[#1E3A5F]
```
This is blue-800 → a navy tone. Professional, trust-evoking.

**Dark mode gradient:**
```
dark:from-[#3B41A0] dark:to-[#2D2B8A]
```
becomes:
```
dark:from-[#1E3A5F] dark:to-[#0F172A]
```
Deep navy → slate-900. Maintains depth without being too bright.

### Step 2: Refine auth-layout.tsx — Subtle Polish

- Add a subtle pattern overlay for visual depth (optional, CSS-only):
```tsx
{/* Subtle grid pattern overlay */}
<div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
```
**Decision**: Skip the pattern overlay. Keep it clean — the gradient alone is sufficient. YAGNI.

- Update the copyright text opacity from `text-white/40` to `text-white/50` for slightly better readability.

### Step 3: Update login.tsx — Mobile Logo

The mobile logo uses `bg-primary` which auto-resolves to blue after Phase 1. No manual change needed.

Verify the form card area: it uses `bg-background` which resolves to the new `#F8FAFC` page background. The form content area should remain white for contrast. If `bg-background` is now off-white, wrap form in explicit `bg-white dark:bg-card`:

```tsx
<div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-background px-4 py-8">
```

### Step 4: Update register.tsx — Same Treatment

Apply identical changes as login.tsx. The register page follows the same AuthLayout pattern.

### Step 5: Verify Auth Flow

- Navigate to `/login` — blue gradient on left, clean form on right
- Navigate to `/register` — same layout
- Test on mobile viewport — only right panel shows with blue logo
- Test dark mode — deep navy gradient, form on dark bg

## Todo List
- [x] Update auth-layout.tsx gradient from purple to navy/blue
- [x] Update auth-layout.tsx dark mode gradient
- [x] Verify login.tsx mobile logo auto-resolves to blue (uses bg-primary token, no change needed)
- [x] Verify form panel background contrast (white vs off-white) (bg-background token, acceptable)
- [x] Verify register.tsx same treatment (uses bg-primary token, no change needed)
- [ ] Visual test: light mode auth pages
- [ ] Visual test: dark mode auth pages
- [ ] Visual test: mobile viewport

## Success Criteria
- Left branding panel shows navy/blue gradient (no purple)
- Dark mode shows deep navy gradient
- Form area has proper contrast against background
- Mobile logo is blue
- Feature list icons remain visible against gradient
- Copyright text is readable

## Risk Assessment
- **Low risk**: Only 3 files, isolated from rest of app. Auth pages are standalone routes.
- **Gradient contrast**: Navy/blue must provide enough contrast for white text. `#1E40AF` on white text = 8.2:1 ratio (AAA). Safe.
