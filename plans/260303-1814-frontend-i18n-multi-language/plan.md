---
title: "Frontend i18n Multi-language Support (EN/VI)"
description: "Add English + Vietnamese internationalization to the A-ERP frontend using react-i18next"
status: completed
priority: P2
effort: 6h
branch: main
tags: [frontend, i18n, react-i18next, localization]
created: 2026-03-03
completed: 2026-03-03
---

# Frontend i18n Multi-language Support

## Summary

Add English and Vietnamese translations to the entire A-ERP frontend. Default language: Vietnamese. Users switch languages via sidebar footer or settings page. Preference persisted in localStorage.

## Library Choice: react-i18next

**Why react-i18next** (not alternatives):
- De-facto standard for React i18n (~10M weekly downloads)
- `useTranslation()` hook fits existing functional component patterns
- Namespace support maps cleanly to our module architecture
- Lazy-loading namespaces per module keeps bundle small
- Zero config for interpolation, plurals, nesting

## Translation File Organization

```
frontend/src/
  i18n/
    index.ts                    # i18next init config
    locales/
      vi/
        common.json             # shared: nav, buttons, dialogs, toasts, auth
        pms.json                # PMS module strings
        wms.json                # WMS module strings
        hrm.json                # HRM module strings
        crm.json                # CRM module strings
      en/
        common.json
        pms.json
        wms.json
        hrm.json
        crm.json
```

**Namespace strategy**: `common` (default) + one namespace per module. Shared shell/auth/settings strings live in `common`. Module pages load their namespace on demand.

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Install + configure i18next](./phase-01-install-configure-i18next.md) | completed | 1h |
| 2 | [Create translation JSON files](./phase-02-create-translation-files.md) | completed | 2h |
| 3 | [Replace hardcoded strings with t() calls](./phase-03-replace-hardcoded-strings.md) | completed | 2h |
| 4 | [Add language switcher UI + persist preference](./phase-04-language-switcher-and-persistence.md) | completed | 1h |

## Key Decisions

1. **No backend changes needed** -- all translations are frontend-only static JSON
2. **No React context wrapper** -- i18next instance initialized at module level, imported by `main.tsx`
3. **Default namespace = common** -- avoids prefixing every shared string
4. **localStorage key: `a-erp-language`** -- matches existing `a-erp-module` convention
5. **No ICU/Intl complexity** -- simple key-value translations with basic interpolation (`{{name}}`)
6. **date-fns locale** -- set `date-fns` locale alongside language for date formatting consistency

## Dependencies

- `react-i18next` + `i18next` npm packages
- No backend changes
- No database changes

## Scope

**In scope:**
- All user-facing strings: page titles, descriptions, labels, buttons, toasts, empty states, confirm dialogs, form validation, sidebar nav, module names, keyboard shortcut labels, notifications

**Out of scope:**
- Backend API error messages (server-side i18n)
- Date/number locale formatting (already handled by `date-fns` + `Intl`)
- RTL layout support
- Dynamic DB content (project names, task titles, etc.)

## Risks

| Risk | Mitigation |
|------|-----------|
| Missing translation keys at runtime | i18next fallback to `vi` + console warnings in dev |
| Bundle size increase from JSON | Namespaced lazy loading per module |
| Stale translations after updates | Translation keys co-located in phase files for easy auditing |
