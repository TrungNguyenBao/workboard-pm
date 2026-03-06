## Phase Implementation Report

### Executed Phase
- Phase: Phase 8 — Polish & Dark Mode QA
- Plan: none (ad-hoc phase instructions)
- Status: completed

### Files Modified

**Shared UI primitives (7 files)**
- `src/shared/components/ui/button.tsx` — secondary/ghost/outline variants → semantic tokens
- `src/shared/components/ui/input.tsx` — bg-white/text-neutral-900 → bg-background/text-foreground
- `src/shared/components/ui/dialog.tsx` — bg-white → bg-background, title text-neutral-900 → text-foreground
- `src/shared/components/ui/dropdown-menu.tsx` — bg-white → bg-popover, item text/hover → semantic tokens
- `src/shared/components/ui/select.tsx` — trigger/content bg-white → bg-background/bg-popover, item focus → bg-muted
- `src/shared/components/ui/sheet.tsx` — bg-white → bg-background, title text → text-foreground
- `src/shared/components/ui/toast.tsx` — bg-white → bg-popover, text-neutral-* → semantic tokens

**Shared shell (2 files)**
- `src/shared/components/shell/keyboard-shortcuts-dialog.tsx` — kbd bg-neutral-100 → bg-muted
- `src/index.css` — expanded prefers-reduced-motion to full *, *::before, *::after block

**Feature pages (4 files)**
- `src/features/settings/pages/settings.tsx` — text-neutral-700/900, bg-neutral-50 → semantic tokens
- `src/features/workspaces/pages/members.tsx` — hover:bg-neutral-50, text colors → semantic tokens
- `src/features/search/components/command-palette.tsx` — aria-selected:bg-neutral-100, text-neutral-700 → semantic tokens
- `src/features/notifications/components/notification-bell.tsx` — read/unread text colors → semantic tokens

**PMS project components (8 files)**
- `src/modules/pms/features/projects/components/board-task-card.tsx` — bg-white → bg-card, task text → semantic
- `src/modules/pms/features/projects/components/board-kanban-column.tsx` — input bg-white → bg-background, column droppable bg-neutral-50 → bg-muted/30
- `src/modules/pms/features/projects/components/board-add-section-input.tsx` — bg-white → bg-background
- `src/modules/pms/features/projects/components/timeline-grid.tsx` — bg-white → bg-background, bg-neutral-50 → bg-muted/30, text colors → semantic; fixed lint error
- `src/modules/pms/features/projects/components/inline-task-input.tsx` — bg-white → bg-background/bg-card, hover bg-neutral-50 → bg-muted/50
- `src/modules/pms/features/projects/components/filter-bar.tsx` — bg-white → bg-background, hover:bg-neutral-100 → hover:bg-muted
- `src/modules/pms/features/projects/pages/list.tsx` — hover/header bg-neutral-50/100 → semantic, text colors
- `src/modules/pms/features/projects/pages/calendar.tsx` — bg-neutral-50 → bg-muted/30, completed task → bg-muted
- `src/modules/pms/features/projects/pages/timeline.tsx` — zoom button text colors → semantic tokens

**PMS task components (3 files)**
- `src/modules/pms/features/tasks/components/task-detail-drawer.tsx` — bg-neutral-100 → bg-muted, bg-white → bg-background, text colors → semantic
- `src/modules/pms/features/tasks/components/task-activity.tsx` — avatar bg, text colors → semantic tokens
- `src/modules/pms/features/tasks/components/recurrence-picker.tsx` — bg-neutral-100 → bg-muted, text colors → semantic

**PMS goals (5 files)**
- `src/modules/pms/features/goals/components/goal-card.tsx` — bg-white → bg-card, progress bar bg-neutral-100 → bg-muted, text colors
- `src/modules/pms/features/goals/components/goal-detail-drawer.tsx` — bg-neutral-100 → bg-muted, text colors → semantic
- `src/modules/pms/features/goals/components/link-tasks-dialog.tsx` — hover:bg-neutral-50 → hover:bg-muted/50
- `src/modules/pms/features/goals/components/link-projects-dialog.tsx` — hover:bg-neutral-50 → hover:bg-muted/50

**PMS custom-fields (2 files)**
- `src/modules/pms/features/custom-fields/components/custom-field-renderer.tsx` — bg-neutral-50 → bg-muted/50, select bg → bg-muted
- `src/modules/pms/features/custom-fields/components/field-config-panel.tsx` — hover:bg-neutral-50 → hover:bg-muted/50

**Dashboard recharts (4 files)**
- `src/modules/pms/features/dashboard/pages/pms-dashboard.tsx` — CartesianGrid/XAxis/YAxis → neutral colors that work in both modes
- `src/modules/wms/features/dashboard/pages/wms-dashboard.tsx` — same recharts fix
- `src/modules/hrm/features/dashboard/pages/hrm-dashboard.tsx` — same recharts fix
- `src/modules/crm/features/dashboard/pages/crm-dashboard.tsx` — same recharts fix

**HRM pages (4 files)**
- `src/modules/hrm/features/leave/pages/leave-requests-list.tsx` — bg-neutral-50/50 → bg-muted/30, bg-white → bg-card
- `src/modules/hrm/features/training/pages/training-list.tsx` — tab button bg-white → bg-background
- `src/modules/hrm/features/performance/pages/reviews-list.tsx` — bg-neutral-50 → bg-muted/30, feedback card bg-white → bg-card
- `src/modules/hrm/features/performance/pages/kpi-list.tsx` — bg-neutral-50/50 → bg-muted/30, bg-white → bg-card
- `src/modules/hrm/features/performance/components/review-feedback-form.tsx` — bg-neutral-50/50 → bg-muted/30
- `src/modules/hrm/features/departments/components/org-chart-tree.tsx` — hover:bg-neutral-50 → hover:bg-muted/50, text-neutral-900 → text-foreground

### Tasks Completed
- [x] Step 1: Automated hardcoded color scan — identified all bg-white/text-neutral-* issues
- [x] Step 2: Fixed high-priority components (task-detail-drawer, board-task-card, board-kanban-column, notification-bell, settings, members)
- [x] Step 3: Fixed form dialogs (dialog.tsx handles all dialogs globally, bg-background)
- [x] Step 4: Full prefers-reduced-motion block added to index.css
- [x] Step 5: Accessibility — icon buttons already had title attributes; verified no new gaps introduced
- [x] Step 6: Recharts dark mode — CartesianGrid/XAxis/YAxis fixed with neutral colors working in both modes (stroke="#888888" strokeOpacity=0.2, fill="#6B7280")
- [x] Step 7: Scrollbar dark mode fix confirmed present (was added in Phase 1)
- [x] Step 8: TypeScript compile — PASS (0 errors)
- [x] Step 9: Lint — 2 pre-existing errors remain in files not touched by Phase 8 (custom-fields-section.tsx unused var, my-tasks-row.tsx unused expression)

### Tests Status
- Type check: PASS (0 errors)
- Lint: 2 pre-existing errors (not introduced by Phase 8), 1 pre-existing warning

### Token Mappings Applied
- bg-white → bg-background (page surfaces) / bg-card (card elements) / bg-popover (popovers/dropdowns)
- text-neutral-900/800 → text-foreground
- text-neutral-700/600 → text-muted-foreground
- text-neutral-500/400 → text-muted-foreground
- bg-neutral-50 → bg-muted/30 or bg-muted/50
- bg-neutral-100 → bg-muted
- hover:bg-neutral-50 → hover:bg-muted/50
- hover:bg-neutral-100 → hover:bg-muted
- focus:bg-neutral-100 → focus:bg-muted
- aria-selected:bg-neutral-100 → aria-selected:bg-muted

### Exceptions Preserved (not changed)
- Badge color palettes: bg-neutral-100 in status/priority badges (intentional always-neutral shading)
- auth-layout.tsx: bg-white/20, bg-white/10 alpha overlays on gradient bg (not page surfaces)
- filter-bar.tsx low priority color: intentional palette entry

### Issues Encountered
- None introduced. Pre-existing lint errors unrelated to Phase 8 remain.

### Next Steps
- Phase 9 (if any): Integration testing, E2E dark mode verification
- Run `make test-e2e` to verify dark mode visually
