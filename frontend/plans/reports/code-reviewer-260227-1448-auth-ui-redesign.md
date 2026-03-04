# Code Review: Auth UI Redesign

**Date:** 2026-02-27
**Files:** auth-layout.tsx (new), login.tsx, register.tsx, index.css, login.test.tsx
**Status:** TypeScript — clean. ESLint — clean. Tests — 3/3 pass.

---

## Overall Assessment

Solid, clean implementation. The split-panel layout is well-extracted, the two form pages are consistent, and the test selectors correctly target the new DOM. Issues below are minor-to-medium; nothing blocking.

---

## Medium Priority

### 1. `bg-surface` bypasses the CSS variable theme system

`auth-layout.tsx` line 58 uses `bg-surface` (Tailwind static token `#F9F9FB`), while all other components use `bg-background` (CSS variable, dark-mode-aware). On dark mode the right panel will stay light.

**Fix:**
```tsx
// auth-layout.tsx line 58
- <div className="flex flex-1 flex-col items-center justify-center bg-surface px-4 py-8">
+ <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-8">
```

### 2. `animate-fade-in` duplicates `tailwindcss-animate` plugin

`index.css` defines a custom `@keyframes fade-in` and `.animate-fade-in` class. `tailwindcss-animate` (already in `tailwind.config.ts` plugins) provides `animate-fade-in` out of the box. The manual definition is harmless now but could conflict if the plugin's version is ever customized.

**Fix:** Remove lines 143–150 from `index.css` and rely on the plugin. Verify the plugin's default duration (150ms) vs the current 0.4s — if 0.4s is intentional, set it via `animation-duration` utility instead:
```tsx
<div className="w-full max-w-[380px] animate-fade-in duration-400">
```

### 3. Password visibility toggle excludes keyboard users

`tabIndex={-1}` on the show/hide button removes it from the tab order entirely. Screen-reader users navigating by keyboard cannot reach it. The `aria-label` is correct, but removing it from tab order contradicts WCAG 2.1 SC 2.1.1.

**Fix:** Remove `tabIndex={-1}` from both login.tsx (line 77) and register.tsx (line 83). Add a `focus-visible` ring to keep visual consistency:
```tsx
- tabIndex={-1}
+ className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
```

### 4. Error messages lack `role="alert"` / `aria-live`

Inline validation errors (e.g., `<p className="text-xs text-destructive">`) appear dynamically but are not announced to screen readers.

**Fix in both form pages:**
```tsx
- {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
+ {errors.email && <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
```

---

## Low Priority

### 5. `React` import missing in `auth-layout.tsx`

`AuthLayoutProps` uses `React.ReactNode` (line 11) without importing React. In Vite + React 17+ JSX transform this works at runtime, but the explicit `React.` namespace reference requires the import for TypeScript to resolve the type. TypeScript currently passes because `tsconfig` likely has `jsx: react-jsx`, but it's inconsistent with every other file in the codebase which imports React explicitly or uses the `ReactNode` named import.

**Fix:**
```tsx
- import { CheckCircle2, LayoutDashboard, Users, Zap } from 'lucide-react'
+ import { type ReactNode } from 'react'
+ import { CheckCircle2, LayoutDashboard, Users, Zap } from 'lucide-react'

- interface AuthLayoutProps {
-   children: React.ReactNode
- }
+ interface AuthLayoutProps {
+   children: ReactNode
+ }
```

### 6. Error type cast is fragile in both pages

```ts
const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
```
This pattern is copy-pasted identically in both files. If the API error shape ever changes, it needs updating in two places.

**Suggestion:** Extract to a shared utility in `src/shared/lib/`:
```ts
// src/shared/lib/api-error.ts
export function getApiErrorDetail(err: unknown): string | undefined {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
}
```

### 7. Test file imports `QueryClient` twice

`login.test.tsx` lines 5–6 import `QueryClientProvider` and `QueryClient` as two separate named imports from `@tanstack/react-query`. They can be on one line — minor style issue.

```ts
- import { QueryClientProvider } from '@tanstack/react-query'
- import { QueryClient } from '@tanstack/react-query'
+ import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
```

### 8. Missing test: password toggle visibility

The test suite covers field rendering, validation, and login call — but doesn't cover the password show/hide toggle. Given it's a new UI feature, worth adding:
```ts
it('toggles password visibility', () => {
  renderLogin()
  const passwordInput = screen.getByLabelText('Password')
  expect(passwordInput).toHaveAttribute('type', 'password')
  fireEvent.click(screen.getByRole('button', { name: /show password/i }))
  expect(passwordInput).toHaveAttribute('type', 'text')
})
```

### 9. `name` field in register has no `type="text"` or `autoComplete`

The name input (register.tsx line 62) omits `type` (defaults to `"text"`, fine) but also omits `autoComplete`. Login's email has implicit browser autocomplete, but the register form would benefit from:
```tsx
<Input id="name" type="text" autoComplete="name" placeholder="Jane Smith" {...register('name')} />
<Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
<Input id="password" type={...} autoComplete="new-password" ... />
```
Login's password should use `autoComplete="current-password"`.

---

## Positive Observations

- Layout extraction into `AuthLayout` is clean — YAGNI and DRY respected.
- Mobile-only logo fallback is a nice touch and correctly conditionally rendered.
- `aria-label` on toggle button is present and correct.
- Zod schema appropriately enforces min-8 on register but not on login (correct — backend handles login validation).
- `finally { setLoading(false) }` correctly prevents stuck loading state on both success and error.
- `register_` alias on register.tsx avoids shadowing the `register` from `useForm` — good defensive naming.
- Test uses `MemoryRouter` + `QueryClientProvider` wrapper — correct isolation approach.
- Copyright year is dynamic (`new Date().getFullYear()`).

---

## Recommended Actions (Prioritized)

1. **Fix dark mode**: change `bg-surface` to `bg-background` in `auth-layout.tsx` (2-min fix, visual correctness)
2. **Fix accessibility**: remove `tabIndex={-1}` from password toggles; add `role="alert"` to error messages (WCAG compliance)
3. **Fix React.ReactNode import**: use named `ReactNode` import in `auth-layout.tsx`
4. **Extract error utility**: deduplicate `getApiErrorDetail` into shared lib
5. **Add autoComplete attributes** to all auth inputs
6. **Add password toggle test** to login.test.tsx
7. **Remove manual `animate-fade-in`** from index.css or justify keeping it over the plugin default

---

## Unresolved Questions

- Is dark mode an active requirement? If not, issue #1 can be deferred.
- Should there be a register test file (`register.test.tsx`) symmetric to `login.test.tsx`?
- The `RequireAuth` guard in `router.tsx` reads `user` synchronously — if `fetchMe` hasn't resolved yet on page load, the user is briefly redirected to `/login`. Is there a loading gate before the router renders? (Not introduced by this PR, but relevant to auth flow correctness.)
