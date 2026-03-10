# WorkBoard Design Guidelines

**Version 2.0 | 2026-03-09**
Enterprise Professional redesign. Based on UI/UX Pro Max analysis.

---

## 1. Color System

All colors are specified as exact hex values. CSS custom properties use HSL for compatibility with shadcn/ui.

### Primary Palette

| Token | Hex | HSL | Usage |
|---|---|---|---|
| `--color-primary` | `#2563EB` | `217 91% 60%` | Primary actions, active states, links |
| `--color-primary-hover` | `#1D4ED8` | `217 91% 48%` | Hover state for primary |
| `--color-accent` | `#F97316` | `25 95% 53%` | CTAs, urgency, orange highlights |
| `--color-accent-hover` | `#EA580C` | `21 90% 48%` | Hover state for accent |
| `--color-success` | `#16A34A` | `142 76% 36%` | Success states, completed tasks |
| `--color-warning` | `#D97706` | `38 92% 44%` | Warning states, medium priority |
| `--color-danger` | `#DC2626` | `0 72% 51%` | Errors, high priority, overdue |
| `--color-info` | `#0EA5E9` | `199 89% 49%` | Info states, low priority |

### Neutral Scale

| Token | Hex | Usage |
|---|---|---|
| `--neutral-50` | `#F8FAFC` | Alternate row tint, empty state bg |
| `--neutral-100` | `#F1F5F9` | Subtle background, disabled states |
| `--neutral-200` | `#E2E8F0` | Borders, dividers, card edges |
| `--neutral-400` | `#94A3B8` | Placeholder text, secondary icons |
| `--neutral-600` | `#475569` | Secondary text, captions |
| `--neutral-800` | `#1E293B` | Primary text (light mode) |
| `--neutral-900` | `#0F172A` | Headings, high-emphasis text |

### Semantic Surface Tokens — Light Mode

| Token | Value | Usage |
|---|---|---|
| `--bg-page` | `#F8FAFC` | Page background |
| `--bg-surface` | `#F1F5F9` | Sidebar, panels, secondary surfaces |
| `--bg-elevated` | `#FFFFFF` | Cards, dropdowns, modals |
| `--border-default` | `#E2E8F0` | Default borders |
| `--text-primary` | `#1E293B` | Primary body text |
| `--text-secondary` | `#475569` | Secondary/muted text |
| `--text-tertiary` | `#94A3B8` | Placeholders, disabled text |

### Priority Color Mapping

| Priority | Color | Hex | Dot class |
|---|---|---|---|
| High | Danger red | `#DC2626` | `bg-red-600` |
| Medium | Warning amber | `#D97706` | `bg-amber-600` |
| Low | Info blue | `#0EA5E9` | `bg-sky-500` |
| None | Neutral | `#94A3B8` | `bg-slate-400` |

---

## 2. Typography

### Font Family

**Primary: Inter** — loaded via Google Fonts CDN. Industry standard for enterprise SaaS, excellent legibility at 14px.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

**Monospace: JetBrains Mono** — for code snippets, keyboard shortcut overlays only.

### Type Scale

Base size is **14px** (not 16px — PM apps use 14px for information density).

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-xs` | `11px` | `1.4` | 400/500 | Labels, chip text, metadata, timestamps |
| `--text-sm` | `13px` | `1.5` | 400 | Secondary body, captions, nav items |
| `--text-base` | `14px` | `1.6` | 400 | Primary body, task rows, descriptions |
| `--text-md` | `16px` | `1.5` | 500/600 | Card titles, input labels |
| `--text-lg` | `20px` | `1.3` | 600 | Section headings, drawer titles |
| `--text-xl` | `24px` | `1.2` | 600 | Page headings |
| `--text-2xl` | `30px` | `1.15` | 700 | Dashboard metric numbers |

### Font Weights

| Token | Value | Usage |
|---|---|---|
| `font-normal` | `400` | Body copy, descriptions |
| `font-medium` | `500` | UI labels, nav items, button text |
| `font-semibold` | `600` | Headings, section titles, task titles |
| `font-bold` | `700` | Dashboard metrics only |

### CSS Variables

```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 0.6875rem;    /* 11px */
  --text-sm: 0.8125rem;    /* 13px */
  --text-base: 0.875rem;   /* 14px */
  --text-md: 1rem;         /* 16px */
  --text-lg: 1.25rem;      /* 20px */
  --text-xl: 1.5rem;       /* 24px */
  --text-2xl: 1.875rem;    /* 30px */
}
```

---

## 3. Spacing System

**Base grid: 4px.** All spacing values are multiples of 4px.

### Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Micro gaps, icon-to-label in tight contexts |
| `--space-2` | `8px` | Icon gap, inline element spacing, card stack gap |
| `--space-3` | `12px` | Component internal padding (compact) |
| `--space-4` | `16px` | Component internal padding (default), grid gap |
| `--space-5` | `20px` | Component internal padding (comfortable) |
| `--space-6` | `24px` | Panel padding, grid gap (comfortable), page lateral |
| `--space-8` | `32px` | Section spacing, page padding |
| `--space-10` | `40px` | Large section gaps |
| `--space-12` | `48px` | Top bar height, page header padding |
| `--space-16` | `64px` | Empty state icon size, major section gaps |

### Contextual Spacing

| Context | Padding | Gap |
|---|---|---|
| Card / Input interior | `12px 16px` | — |
| Drawer / Modal panel | `16px 24px` | — |
| Main page content | `24px 32px` | — |
| Icon to label | `8px` | — |
| Card stack (vertical) | — | `8–12px` |
| Grid columns | — | `16–24px` |
| Task row (compact) | `6px 12px` | — |
| Section header | `8px 12px` | — |

### Layout Dimensions

| Element | Size |
|---|---|
| Sidebar (expanded) | `240px` |
| Sidebar (collapsed) | `48px` |
| Top bar height | `48px` |
| Task detail drawer | `480px` |
| Kanban column width | `240–280px` |
| Kanban column gap | `16px` |
| Main content max-width | `1400px` |
| Notification dropdown | `360px` |
| Avatar size (default) | `32px` |
| Avatar size (small) | `20px` |
| Avatar size (large) | `40px` |

---

## 4. Border Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | `4px` | Tags, badges, small chips |
| `--radius-sm` | `6px` | Buttons (compact), input fields |
| `--radius-md` | `8px` | Cards, kanban cards, tooltips |
| `--radius-lg` | `12px` | Panels, widgets, metric cards |
| `--radius-xl` | `16px` | Modals, large cards, drawers |
| `--radius-full` | `9999px` | Pill badges, status chips, avatars |

```css
:root {
  --radius-xs:   0.25rem;   /* 4px */
  --radius-sm:   0.375rem;  /* 6px */
  --radius-md:   0.5rem;    /* 8px */
  --radius-lg:   0.75rem;   /* 12px */
  --radius-xl:   1rem;      /* 16px */
  --radius-full: 9999px;
}
```

---

## 5. Shadows

PM apps use **flat design with borders** as primary depth signal. Shadows are used sparingly.

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08)` | Kanban cards, default card |
| `--shadow-elevated` | `0 4px 12px rgba(0,0,0,0.10)` | Dropdowns, popovers |
| `--shadow-drawer` | `0 0 40px rgba(0,0,0,0.14)` | Task detail drawer overlay |
| `--shadow-drag` | `0 8px 24px rgba(0,0,0,0.18)` | Dragging card ghost |
| `--shadow-tooltip` | `0 2px 8px rgba(0,0,0,0.16)` | Tooltip bubble |
| `--shadow-none` | `none` | Metric cards, widgets (flat 2025 trend) |

**Rule:** Widget/metric cards use `border: 1px solid #E4E4E7` with no shadow. Kanban cards use `--shadow-card`. Drawers use `--shadow-drawer`.

---

## 6. Component Patterns

### Button

Buttons use DM Sans weight 500, no uppercase transform, `transition: colors 150ms ease`.

```css
/* Base button */
.btn {
  font-family: var(--font-sans);
  font-size: var(--text-base);  /* 14px */
  font-weight: 500;
  line-height: 1;
  padding: 8px 16px;
  border-radius: var(--radius-sm);  /* 6px */
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
```

#### Button Variants

| Variant | Background | Text | Border | Hover bg |
|---|---|---|---|---|
| `primary` | `#5E6AD2` | `#FFFFFF` | `transparent` | `#4F55C4` |
| `secondary` | `#F4F4F5` | `#27272A` | `transparent` | `#E4E4E7` |
| `outline` | `transparent` | `#27272A` | `#E4E4E7` | `#F4F4F5` |
| `ghost` | `transparent` | `#52525B` | `transparent` | `#F4F4F5` |
| `danger` | `#EF4444` | `#FFFFFF` | `transparent` | `#DC2626` |
| `accent` | `#F28C38` | `#FFFFFF` | `transparent` | `#E07620` |

#### Button Sizes

| Size | Padding | Font size | Height |
|---|---|---|---|
| `sm` | `6px 12px` | `13px` | `30px` |
| `md` (default) | `8px 16px` | `14px` | `36px` |
| `lg` | `10px 20px` | `16px` | `42px` |
| `icon` | `8px` | — | `36px` (square) |

### Badge

Full-radius pill. Colored variants for status and priority.

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);  /* 11px */
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}
```

#### Badge Variants

| Variant | Background | Text |
|---|---|---|
| `default` | `#F4F4F5` | `#52525B` |
| `primary` | `rgba(94,106,210,0.12)` | `#5E6AD2` |
| `success` | `rgba(34,197,94,0.12)` | `#16A34A` |
| `warning` | `rgba(245,158,11,0.12)` | `#D97706` |
| `danger` | `rgba(239,68,68,0.12)` | `#DC2626` |
| `info` | `rgba(56,189,248,0.12)` | `#0284C7` |

### Card

Flat card: border only, no shadow. Hover: border-color shifts to `#A1A1AA`.

```css
.card {
  background: #FFFFFF;
  border: 1px solid #E4E4E7;
  border-radius: var(--radius-lg);  /* 12px */
  padding: 16px 20px;
  transition: border-color 150ms ease;
}

.card:hover {
  border-color: #A1A1AA;
}
```

**Kanban card** uses `--radius-md` (8px), `padding: 12px`, `--shadow-card`, and a `4px colored left border` for column/status.

### Input

36px height. Two variants: default (full border) and inline (bottom border only for in-place editing).

```css
/* Default input */
.input {
  height: 36px;
  padding: 0 12px;
  font-size: var(--text-base);
  font-family: var(--font-sans);
  border: 1px solid #E4E4E7;
  border-radius: var(--radius-sm);
  background: #FFFFFF;
  color: #18181B;
  outline: none;
  transition: border-color 150ms ease;
  width: 100%;
}

.input:focus {
  border-color: #5E6AD2;
  box-shadow: 0 0 0 3px rgba(94,106,210,0.12);
}

.input::placeholder {
  color: #A1A1AA;
}

/* Inline editing variant (task title, etc.) */
.input-inline {
  border: none;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  padding: 4px 0;
  background: transparent;
}

.input-inline:focus {
  border-bottom-color: #5E6AD2;
  box-shadow: none;
}
```

### Drawer (Task Detail)

480px right-anchored panel. Overlays page content with scrim.

```css
.drawer-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.30);
  z-index: 40;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100vh;
  background: #FFFFFF;
  border-left: 1px solid #E4E4E7;
  box-shadow: var(--shadow-drawer);
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid #E4E4E7;
  flex-shrink: 0;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.drawer-footer {
  padding: 12px 20px;
  border-top: 1px solid #E4E4E7;
  flex-shrink: 0;
}
```

**Transition:** `transform: translateX(100%)` → `translateX(0)`, `transition: transform 220ms cubic-bezier(0.4,0,0.2,1)`.

---

## 7. Iconography

**Library: Lucide Icons** — stroke-based SVG icons, 1.5px stroke-width, designed on 24px grid. Matches DM Sans geometric style.

**Supplement:** Phosphor Icons (duotone variant) for empty states only.

### Icon Sizes

| Context | Size | Stroke |
|---|---|---|
| Sidebar navigation | `20px` | `1.5px` |
| Top bar actions | `18px` | `1.5px` |
| Inline / table rows | `16px` | `1.5px` |
| Empty state (Phosphor) | `64px` | duotone |

### Rules

- Always use `currentColor` — never hardcode fill/stroke colors.
- Icon color inherits from parent text color.
- Icon + label gap: `8px` always.
- Never scale icons with CSS `transform` — use correct size props.
- Interactive icons (buttons): use `--ghost` button pattern with icon inside.
- Lucide icon names to use:

| UI element | Lucide icon |
|---|---|
| Home | `Home` |
| My Tasks | `CheckSquare` |
| Inbox | `Inbox` |
| Projects | `FolderKanban` |
| Search | `Search` |
| Notifications | `Bell` |
| Settings | `Settings` |
| Close drawer | `X` |
| Collapse section | `ChevronDown` |
| Add item | `Plus` |
| Priority high | `ArrowUp` |
| Priority medium | `ArrowRight` |
| Priority low | `ArrowDown` |
| Assignee | `User` |
| Due date | `Calendar` |
| Attachment | `Paperclip` |
| Comment | `MessageCircle` |
| More actions | `MoreHorizontal` |
| Drag handle | `GripVertical` |
| Board view | `LayoutKanban` |
| List view | `List` |
| Timeline | `BarChart2` |
| Calendar view | `CalendarDays` |

---

## 8. Dark Mode Tokens

Dark mode inverts surface hierarchy. Never use pure `#000000`.

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Surfaces — slate-based */
    --bg-page:      #0F172A;
    --bg-surface:   #1E293B;
    --bg-elevated:  #334155;
    --bg-popover:   #1E293B;

    /* Borders */
    --border-default: rgba(255,255,255,0.10);
    --border-strong:  rgba(255,255,255,0.18);

    /* Text */
    --text-primary:   #F8FAFC;
    --text-secondary: #94A3B8;
    --text-tertiary:  #475569;

    /* Brand — lightened for dark bg contrast */
    --color-primary:       #3B82F6;  /* lightened from #2563EB */
    --color-primary-hover: #60A5FA;
    --color-accent:        #FB923C;  /* lightened from #F97316 */

    /* Functional — same hue, adjusted lightness */
    --color-success: #4ADE80;
    --color-warning: #FBB532;
    --color-danger:  #F87171;
    --color-info:    #7DD3FC;
  }
}
```

### Dark Mode Component Notes

- Cards: `background: #1E293B`, `border: 1px solid rgba(255,255,255,0.10)`
- Sidebar: `background: var(--card)`, active item: `background: rgba(37,99,235,0.15)`
- Inputs: `background: #1E293B`, `border: rgba(255,255,255,0.12)`
- Kanban cards: `background: #1E293B`
- Tooltips: use `#F8FAFC` bg with dark text (inverted from dark mode default)

---

## 9. shadcn/ui CSS Variable Overrides

Place in `app/globals.css` (Next.js) or equivalent global stylesheet.

```css
@layer base {
  :root {
    --radius: 0.5rem;
    --primary: 217 91% 60%;              /* #2563EB */
    --primary-foreground: 0 0% 100%;
    --accent: 25 95% 53%;                /* #F97316 */
    --accent-foreground: 0 0% 100%;
    --muted: 210 40% 96%;                /* #F1F5F9 */
    --muted-foreground: 215 16% 47%;     /* #64748B */
    --border: 214 32% 91%;               /* #E2E8F0 */
    --input: 214 32% 91%;
    --ring: 217 91% 60%;
    --background: 210 40% 98%;           /* #F8FAFC */
    --foreground: 222 47% 11%;           /* #1E293B */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --secondary: 210 40% 96%;            /* #F1F5F9 */
    --secondary-foreground: 222 47% 11%;
  }

  .dark {
    --background: 222 47% 7%;            /* #0F172A */
    --foreground: 210 40% 98%;           /* #F8FAFC */
    --card: 222 47% 11%;                 /* #1E293B */
    --card-foreground: 210 40% 98%;
    --popover: 222 35% 15%;
    --popover-foreground: 210 40% 98%;
    --primary: 217 91% 65%;              /* #3B82F6 */
    --primary-foreground: 0 0% 100%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;     /* #94A3B8 */
    --accent: 25 90% 60%;                /* #FB923C */
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62% 30%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 20%;
    --input: 217 33% 20%;
    --ring: 217 91% 65%;
  }
}

/* Component overrides */

/* Button: no uppercase, 150ms transition */
.btn, [data-slot="button"] {
  text-transform: none;
  font-weight: 500;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
}

/* Badge: always pill */
[data-slot="badge"] {
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 500;
}

/* Card: border only, no shadow; hover shifts border */
[data-slot="card"] {
  box-shadow: none;
  border: 1px solid hsl(var(--border));
  transition: border-color 150ms ease;
}

[data-slot="card"]:hover {
  border-color: hsl(240 5% 65%);
}

/* Input: 36px height */
[data-slot="input"] {
  height: 36px;
}

/* Table: compact 32px rows */
[data-slot="table"] tbody tr {
  height: 32px;
}

/* Tooltip: dark bg in light mode (Linear pattern) */
[data-slot="tooltip-content"] {
  background: #18181B;
  color: #FAFAFA;
  font-size: 0.6875rem;
}
```

---

## 10. Animation & Motion

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | `100ms` | Hover color transitions |
| `--duration-base` | `150ms` | Most UI transitions |
| `--duration-slow` | `220ms` | Drawer open/close, modals |
| `--duration-enter` | `200ms` | Element appearing |
| `--duration-exit` | `150ms` | Element disappearing (always faster) |
| `--ease-default` | `cubic-bezier(0.4,0,0.2,1)` | Standard easing (Material) |
| `--ease-bounce` | `cubic-bezier(0.34,1.56,0.64,1)` | Subtle spring for cards |

**Rules:**
- Never animate `width`, `height` — animate `transform` and `opacity` instead.
- Reduce motion: `@media (prefers-reduced-motion: reduce)` disables all transitions.
- Drag ghost: `opacity: 0.95`, `transform: rotate(4deg)`.
- Drop zone pulse: `animation: pulse 1s ease-in-out infinite`.

---

## 11. Accessibility

- **Target:** WCAG AA minimum. AAA for primary text.
- Primary `#5E6AD2` on white: contrast ratio ~4.6:1 (AA for large text, borderline normal — prefer on colored bg).
- Use `#4F55C4` (primary-hover) for text on white to achieve AA 5.0:1.
- All interactive elements: visible focus ring `box-shadow: 0 0 0 3px rgba(94,106,210,0.30)`.
- Minimum touch target: 36×36px.
- Icon-only buttons require `aria-label`.
- Color is never the sole conveyor of meaning — always pair with text or shape.
- Task priority: dot + text label, not dot alone.

---

## 12. Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| Inter font family | Industry standard for enterprise SaaS; excellent legibility at 14px, variable font |
| Blue primary (#2563EB) | Enterprise trust color; Salesforce/HubSpot/Monday pattern; better WCAG AA on white |
| Slate neutral scale | Warmer than zinc; more professional enterprise feel vs cold gray |
| 14px base (not 16px) | ERP apps require information density; 16px wastes vertical space in data tables |
| 4px grid | Finer control than 8px grid for compact components like task rows and sidebar items |
| Flat cards (no shadow) | Border-only cards reduce visual noise; enterprise data-dense pattern |
| Grouped sidebar nav | HRM has 16+ items — grouping into sections (People, Time, Talent, Ops) improves navigation |
| Primary viewport: 1280px | Most common enterprise/SaaS desktop target; drawer at 480px leaves ~760px for content |
| No hover-expand sidebar | Hover-expand causes accidental triggers; collapsed = icon-only, always explicit |
