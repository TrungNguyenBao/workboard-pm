# UI/UX Design Research: WorkBoard PM App
**Researcher report | 2026-02-25 | Ref: Asana, Linear, Notion, Monday.com, Height, Plane**

## 1. Color Palette

PM apps trend: muted, desaturated primaries + warm accent. Dark navy/slate base + indigo-violet primary.

```
Primary:       #5E6AD2  (indigo-violet, Linear-inspired)
Primary-hover: #4F55C4
Accent:        #F28C38  (warm amber — CTA, urgency)
Accent-hover:  #E07620
Success:       #22C55E
Warning:       #F59E0B
Danger:        #EF4444
Info:          #38BDF8

Neutral scale:
  50:  #FAFAFA   100: #F4F4F5   200: #E4E4E7
  400: #A1A1AA   600: #52525B   800: #27272A   900: #18181B

Light mode:  Background #FFFFFF | Surface #F9F9FB | Border #E4E4E7
Dark mode:   Background #0F0F12 | Surface #1A1A1F | Border rgba(255,255,255,0.10)
```

## 2. Typography

**Avoid Inter (overused), Poppins (too casual).**

**Recommended:** DM Sans (Google Fonts) — distinct weight contrast, excellent readability for dense UIs.
Alt: Geist (Vercel, self-hosted via `geist` npm package) — sharp, geometric, modern SaaS.
Mono: JetBrains Mono (code snippets, shortcuts overlay).

**Scale (14px base — PM apps use 14px not 16px):**
```
xs:   11px / 1.4 — labels, chips, metadata
sm:   13px / 1.5 — secondary body, captions
base: 14px / 1.6 — primary body
md:   16px / 1.5 — card titles
lg:   20px / 1.3 — section headings
xl:   24px / 1.2 — page headings
2xl:  30px / 1.15 — dashboard metrics
```
Weights: 400 body | 500 UI labels | 600 headings | 700 metrics only.

## 3. Layout

- **Sidebar:** Fixed 220–240px; collapsed 48px icon-only (no hover-expand)
- **Top bar:** 48px. Breadcrumb left | global search center | avatar+bell right
- **Main content:** Fluid, max-width 1400px, 24px lateral padding
- **Task detail:** Right-side drawer 480px — keeps list context visible

## 4. Kanban Board

- Columns: 240–280px wide, sticky header, 4px colored left-border + label + count
- Cards: white, 1px `#E4E4E7` border, 8px radius, 12px padding
  - Shadow: `0 1px 3px rgba(0,0,0,0.08)`
  - Content: priority dot | title (2-line clamp) | tag chips | avatar + due date
- Drag ghost: 95% opacity, 4° rotation, shadow `0 8px 24px rgba(0,0,0,0.18)`
- Drop zone: dashed `#5E6AD2` border + 10% blue fill + pulse animation
- Add card: inline ghost card at column bottom (no modal)

## 5. Task Detail Drawer (480px)

Top to bottom:
1. Breadcrumb + close button
2. Status pill (inline dropdown) + Priority selector
3. Title — large contenteditable h1
4. Assignee | Due date | Start date — 3-col icon+value row
5. Description — TipTap rich text
6. Subtasks accordion (expand/collapse)
7. Attachments 2-col thumbnail grid
8. Activity feed — chronological bottom (comments + system events)

## 6. Timeline / Gantt (V2)

- Bars: 28px height, 6px radius, colored by project/assignee
- Today marker: 2px solid `#5E6AD2`, vertical glow
- Zoom: Day | Week (default) | Month | Quarter — pill toggle
- Dependencies: Bezier curves, 1.5px, 6px arrowhead, Neutral-400
- Row alt-tint: Neutral-50 every other row

## 7. Dashboard Widgets

- Summary cards: 3–4 col grid. Icon (24px) + metric (30px bold) + label (12px)
- Progress rings: SVG stroke-dasharray, 64px diameter, 6px stroke
- Activity feed: 8px dot (action-color) + avatar (20px) + action + relative time
- Widget style: 1px Neutral-200 border, 12px radius, white — **no drop shadow** (flat 2025 trend)
- Empty states: 64px icon + headline + CTA

## 8. Notification Panel

- Bell → 360px slide-down dropdown (max 480px, scrollable)
- Badge: red 8px dot, no number
- Items: avatar (32px) + action + bold object + timestamp. Unread = 3px left indigo border
- Tabs: All | Mentions | Assigned
- Actions: "Mark all read" + individual dismiss on hover

## 9. Spacing System

**Base: 4px grid** (finer control for dense PM UIs).
Tokens: 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64px

```
Component:  12px 16px  (cards, inputs)
Panel:      16px 24px  (drawers, modals)
Page:       24px 32px  (main content)
Icon gap:   8px
Card stack: 8–12px
Grid gap:   16–24px
```

Radius tokens: xs=4px | sm=6px | md=8px | lg=12px | xl=16px | full=9999px

## 10. Dark Mode

```
Chrome:   #0F0F12
Surface:  #1A1A1F
Elevated: #25252B
Popover:  #2E2E38
```
Never pure #000. Borders: 8–12% white opacity. Text: `#FAFAFA` primary / `#A1A1AA` secondary.
Primary lightens to `#6E78E8` in dark. Accent to `#F5A05A`.

## 11. Icons

**Primary: Lucide Icons** — stroke-based, 1.5px, 24px grid, matches DM Sans geometry.
Supplement: Phosphor duotone for empty states only.
Sizes: sidebar=20px | top-bar=18px | inline=16px. Always `currentColor`.

## 12. shadcn/ui Customization

`globals.css` overrides:
```css
--radius: 0.5rem;
--primary: 94 106 210;        /* #5E6AD2 */
--primary-foreground: 0 0% 100%;
--accent: 33 89% 58%;         /* #F28C38 */
--muted: 240 5% 96%;
--border: 240 6% 90%;
```

Key component adjustments:
- **Button:** No uppercase, weight 500, `transition-colors 150ms`
- **Badge:** Full-radius pill, status-colored variants
- **Card:** Border only — no shadow; hover shifts border-color
- **Input:** 36px height, bottom-border-only variant for inline editing
- **Dialog → Sheet:** 480px right drawer for task detail
- **Tooltip:** Dark bg in light mode (inverted, Linear pattern)
- **Table:** Compact 32px rows, sticky header, Neutral-50 hover

## Unresolved Questions

1. Brand direction: approachable (Monday) vs focused/minimal (Linear)?
2. Custom per-project colors like Asana?
3. Primary viewport: 1280px, 1440px, or 1920px?
4. DM Sans (Google Fonts) vs Geist self-hosted?
5. Mobile responsiveness priority for v1?
6. Gantt: custom build vs library (frappe-gantt, react-gantt-task)?
7. Accessibility target: WCAG AA or AAA?
