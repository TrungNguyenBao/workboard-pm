# Phase 1: Design Foundation

## Context Links
- [Design Guidelines](../../docs/design-guidelines.md)
- [Current index.css](../../frontend/src/index.css)
- [Tailwind Config](../../frontend/tailwind.config.ts)
- [index.html](../../frontend/index.html)

## Overview
- **Priority**: P1 — blocks all other phases
- **Status**: pending
- **Effort**: 2h
- **Description**: Swap color palette from purple to enterprise blue, switch font from DM Sans to Inter, update neutral scale from zinc to slate. This is CSS-only — changes propagate automatically to all components using design tokens.

## Key Insights
- Current HSL vars in `index.css` use shadcn convention (`--primary: H S% L%` without `hsl()` wrapper)
- `tailwind.config.ts` has hardcoded hex colors that ALSO need updating (dual source of truth)
- `index.html` loads DM Sans via Google Fonts CDN — swap URL to Inter
- Font reference in `tailwind.config.ts` `fontFamily.sans` must change
- Dark mode tokens in `.dark` class need equivalent blue-shifted values

## Requirements

### Functional
- All `--primary` references render as blue `#2563EB` instead of purple `#5E6AD2`
- All body text renders in Inter instead of DM Sans
- Neutral scale uses slate tones (warmer) instead of zinc (cold)
- Dark mode remains functional with blue-adjusted tokens
- Focus rings use blue instead of purple

### Non-Functional
- No visual regressions in existing components
- Font loads performantly (preconnect + display=swap already in place)
- Both light and dark modes pass WCAG AA contrast

## Architecture

No structural changes. Token-level swap only.

## Related Code Files

### Files to Modify
1. `frontend/index.html` — swap Google Fonts URL from DM Sans to Inter
2. `frontend/src/index.css` — update all HSL CSS variables (light + dark)
3. `frontend/tailwind.config.ts` — update hex colors, fontFamily, neutral scale
4. `docs/design-guidelines.md` — update color table, font references, rationale

## Implementation Steps

### Step 1: Update Google Fonts in index.html
Replace DM Sans font link with Inter (variable weight):
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Step 2: Update CSS Variables in index.css — Light Mode
Replace `:root` block:

| Token | Old HSL | New HSL | New Hex |
|---|---|---|---|
| `--primary` | `234 58% 60%` | `217 91% 60%` | `#2563EB` |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | (unchanged) |
| `--background` | `0 0% 100%` | `210 40% 98%` | `#F8FAFC` |
| `--foreground` | `240 5% 10%` | `222 47% 11%` | `#1E293B` |
| `--card` | `0 0% 100%` | `0 0% 100%` | (unchanged) |
| `--card-foreground` | `240 5% 10%` | `222 47% 11%` | `#1E293B` |
| `--popover` | `0 0% 100%` | `0 0% 100%` | (unchanged) |
| `--popover-foreground` | `240 5% 10%` | `222 47% 11%` | `#1E293B` |
| `--secondary` | `240 5% 96%` | `210 40% 96%` | `#F1F5F9` |
| `--secondary-foreground` | `240 5% 10%` | `222 47% 11%` | `#1E293B` |
| `--muted` | `240 5% 96%` | `210 40% 96%` | `#F1F5F9` |
| `--muted-foreground` | `240 4% 46%` | `215 16% 47%` | `#64748B` |
| `--accent` | `33 89% 58%` | `25 95% 53%` | `#F97316` |
| `--accent-foreground` | `0 0% 100%` | `0 0% 100%` | (unchanged) |
| `--destructive` | `0 84% 60%` | `0 84% 60%` | (unchanged) |
| `--border` | `240 6% 90%` | `214 32% 91%` | `#E2E8F0` |
| `--input` | `240 6% 90%` | `214 32% 91%` | `#E2E8F0` |
| `--ring` | `234 58% 60%` | `217 91% 60%` | `#2563EB` |

### Step 3: Update CSS Variables — Dark Mode
Replace `.dark` block:

| Token | New HSL | Hex Reference |
|---|---|---|
| `--background` | `222 47% 7%` | ~`#0F172A` shade |
| `--foreground` | `210 40% 98%` | `#F8FAFC` |
| `--card` | `222 47% 11%` | `#1E293B` |
| `--card-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--popover` | `222 35% 15%` | ~`#1E2A3F` |
| `--popover-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--primary` | `217 91% 65%` | ~`#3B82F6` (lightened for dark bg) |
| `--primary-foreground` | `0 0% 100%` | white |
| `--secondary` | `217 33% 17%` | `#1E293B` area |
| `--secondary-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--muted` | `217 33% 17%` | same as secondary |
| `--muted-foreground` | `215 20% 65%` | `#94A3B8` |
| `--accent` | `25 90% 60%` | `#FB923C` (lightened orange) |
| `--accent-foreground` | `0 0% 100%` | white |
| `--destructive` | `0 62% 30%` | (unchanged) |
| `--border` | `217 33% 20%` | slate-800 area |
| `--input` | `217 33% 20%` | same |
| `--ring` | `217 91% 65%` | matches dark primary |

### Step 4: Update tailwind.config.ts
```ts
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
colors: {
  primary: {
    DEFAULT: '#2563EB',
    hover: '#1D4ED8',
    light: '#EFF6FF',
  },
  accent: {
    DEFAULT: '#F97316',
    hover: '#EA580C',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  info: '#0EA5E9',
  surface: '#F8FAFC',
  border: '#E2E8F0',
},
```

### Step 5: Update scrollbar colors in index.css
Change `bg-neutral-300`/`bg-neutral-600` references to use new slate equivalents. These use Tailwind classes directly so they auto-resolve if the neutral scale is updated in config.

### Step 6: Update priority dot colors in index.css components layer
Update `bg-danger`, `bg-warning`, `bg-info` — these reference tailwind config, so they auto-update. No manual change needed.

### Step 7: Update design-guidelines.md
- Change font family section from DM Sans to Inter
- Update primary palette table with new hex/HSL values
- Update neutral scale table with slate values
- Update dark mode tokens section
- Update rationale: "Inter for enterprise standard" replacing DM Sans rationale

## Todo List
- [ ] Swap Google Fonts URL in index.html (DM Sans -> Inter)
- [ ] Update :root CSS variables in index.css (light mode)
- [ ] Update .dark CSS variables in index.css (dark mode)
- [ ] Update tailwind.config.ts colors, fontFamily, neutral scale
- [ ] Update scrollbar thumb colors if needed
- [ ] Update docs/design-guidelines.md
- [ ] Visual smoke test: light mode
- [ ] Visual smoke test: dark mode
- [ ] Verify focus rings are blue

## Success Criteria
- All text renders in Inter
- Primary buttons/links are blue `#2563EB`
- Focus rings are blue
- Dark mode has no broken contrast
- No purple remnants anywhere in the UI
- `npm run build` succeeds without errors

## Risk Assessment
- **Font metric differences**: Inter has slightly different metrics than DM Sans at 14px. May cause minor layout shifts in tight spaces (sidebar items, table cells). Mitigated by using same weight range (400-700).
- **Hardcoded hex in components**: Some components may hardcode purple hex (e.g., chart colors in dashboards). Those are handled in Phase 5, not here.

## Security Considerations
- No security impact. Font loaded from Google Fonts CDN (same as before).
