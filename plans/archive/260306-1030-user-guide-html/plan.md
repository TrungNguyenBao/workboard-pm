# A-ERP User Guide — HTML Edition

## Goal
Create a comprehensive, styled HTML user guide for the A-ERP platform covering all modules (PMS, WMS, HRM, CRM), for both end users and workspace admins.

## Output
Single self-contained HTML file at `docs/user-guide.html` — styled with the project's design system (DM Sans, indigo primary, dark mode support), with sidebar navigation, collapsible sections, and responsive layout.

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Structure & Shell | Pending |
| 2 | Auth & Getting Started | Pending |
| 3 | Workspace & Admin | Pending |
| 4 | PMS Module Guide | Pending |
| 5 | WMS Module Guide | Pending |
| 6 | HRM Module Guide | Pending |
| 7 | CRM Module Guide | Pending |
| 8 | Settings, Shortcuts & Tips | Pending |

## Key Decisions
- **Single HTML file** — self-contained, no build step, portable, easy to share
- **CSS matches design system** — DM Sans font, `#5E6AD2` primary, dark mode toggle
- **Sidebar TOC** — sticky left nav with section links, scrollspy highlighting
- **Screenshots** — described via styled placeholder boxes (no actual screenshots needed)
- **Audience markers** — admin-only sections tagged with badge
- **i18n note** — guide written in English; mentions Vietnamese language support exists

## Phases
- [Phase 1: Structure & Shell](phase-01-html-structure.md)
- [Phase 2: Auth & Getting Started](phase-02-auth-getting-started.md)
- [Phase 3: Workspace & Admin](phase-03-workspace-admin.md)
- [Phase 4: PMS Module](phase-04-pms-module.md)
- [Phase 5: WMS Module](phase-05-wms-module.md)
- [Phase 6: HRM Module](phase-06-hrm-module.md)
- [Phase 7: CRM Module](phase-07-crm-module.md)
- [Phase 8: Settings & Shortcuts](phase-08-settings-shortcuts.md)
