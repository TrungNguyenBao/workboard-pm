---
phase: 4
title: "Auth Pages Polish"
status: completed
effort: 2h
depends_on: [1]
---

# Phase 4: Auth Pages Polish

## Context Links
- [auth-layout.tsx](../../frontend/src/features/auth/components/auth-layout.tsx)
- [login.tsx](../../frontend/src/features/auth/pages/login.tsx)
- [register.tsx](../../frontend/src/features/auth/pages/register.tsx)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview
Polish auth pages for dark mode compatibility, improve mobile responsiveness, add subtle entrance animations using CSS transitions only.

## Key Insights
- `auth-layout.tsx` is clean at 64 lines -- well-structured split panel
- Left panel uses hardcoded gradient: `from-[#5E6AD2] to-[#4338CA]` -- intentional brand color, keep but use CSS vars for dark mode variant
- Right panel already uses `bg-background` -- good
- Login page uses `animate-fade-in` class already defined in `index.css`
- Mobile logo block uses `bg-primary` -- already semantic, good
- No accessibility issues in forms (labels, aria, etc. are present)
- `register.tsx` likely mirrors login structure (same pattern)

## Requirements

### Functional
- Left branding panel adapts to dark mode (slightly different gradient)
- Form fields show focus states clearly in both themes
- Subtle staggered entrance animation for form elements
- Mobile layout tested at 375px, 768px breakpoints

### Non-functional
- CSS transitions only -- no Framer Motion
- Keep existing layout structure, polish only
- Both auth pages stay under 120 lines each

## Architecture

### Dark Mode Adaptation
- Left panel gradient: keep `from-[#5E6AD2] to-[#4338CA]` for light mode
- Dark mode: `dark:from-[#3B41A0] dark:to-[#2D2B8A]` (deeper, less bright)
- `bg-white/20` backdrop elements -> add `dark:bg-white/10` for subtlety
- Text colors on left panel are white-on-purple -- works in both modes

### Entrance Animations
Add to `index.css`:
```css
@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-slide-up-fade {
  animation: slide-up-fade 0.4s ease-out both;
}
```
Apply with staggered `animation-delay` via utility classes on form fields.

## Related Code Files

### Files to MODIFY
- `frontend/src/features/auth/components/auth-layout.tsx` -- dark gradient, token sweep
- `frontend/src/features/auth/pages/login.tsx` -- entrance animation classes
- `frontend/src/features/auth/pages/register.tsx` -- entrance animation classes
- `frontend/src/index.css` -- add `slide-up-fade` keyframe + stagger utilities

### Files to CREATE
None.

## Implementation Steps

### Step 1: Add animation keyframes to index.css
Add after existing `animate-fade-in`:
```css
@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-slide-up-fade {
  animation: slide-up-fade 0.4s ease-out both;
}

/* Stagger delays for form fields */
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
```

### Step 2: Update auth-layout.tsx
- Add dark mode gradient variant to left panel:
  ```
  bg-gradient-to-br from-[#5E6AD2] to-[#4338CA] dark:from-[#3B41A0] dark:to-[#2D2B8A]
  ```
- Update `bg-white/20` to `bg-white/20 dark:bg-white/10`
- Update `bg-white/10` to `bg-white/10 dark:bg-white/5`
- Text stays white (works on both gradients)
- Right panel: already `bg-background`, verify no hardcoded colors

### Step 3: Polish login.tsx
- Wrap heading in `animate-slide-up-fade`
- Wrap description in `animate-slide-up-fade delay-100`
- Wrap form in `animate-slide-up-fade delay-200`
- Wrap sign-up link in `animate-slide-up-fade delay-300`
- Verify all text uses semantic tokens (`text-foreground`, `text-muted-foreground`)

### Step 4: Polish register.tsx
- Same animation pattern as login
- Read file first to confirm structure matches login
- Apply same stagger pattern

### Step 5: Mobile responsiveness check
Verify at 375px width:
- Left panel hidden (`hidden lg:flex` already handles this)
- Mobile logo centered, form fills width with proper padding
- Form inputs don't overflow on small screens
- Touch targets >= 36px (buttons already use proper sizing)

### Step 6: Compile check
Run `tsc --noEmit`.

## Todo List
- [ ] Add `slide-up-fade` keyframe to `index.css`
- [ ] Add stagger delay utilities to `index.css`
- [ ] Update `auth-layout.tsx` dark mode gradient
- [ ] Add entrance animations to `login.tsx`
- [ ] Add entrance animations to `register.tsx`
- [ ] Verify mobile layout at 375px
- [ ] Compile check

## Success Criteria
- Auth pages look polished in both light and dark mode
- Form elements enter with subtle stagger animation on page load
- No hardcoded colors that break in dark mode
- Mobile layout works cleanly at 375px
- Both pages compile without errors

## Risk Assessment
- **Risk:** Stagger animation feels sluggish on slow devices
  - **Mitigation:** `prefers-reduced-motion` media query disables animations (already in index.css as rule from design guidelines)
- **Risk:** Dark gradient looks too different from brand
  - **Mitigation:** Only deepening the same hue, not changing it

## Security Considerations
None -- purely visual changes to auth UI.
