# Phase 1: Install and Configure i18next

## Context Links
- [plan.md](./plan.md)
- [frontend/package.json](../../frontend/package.json)
- [frontend/src/main.tsx](../../frontend/src/main.tsx)
- [frontend/src/app/App.tsx](../../frontend/src/app/App.tsx)

## Overview
- **Priority**: P1 (foundation for all other phases)
- **Status**: completed
- **Description**: Install react-i18next, create the i18n configuration, and wire it into the app entry point.

## Key Insights
- i18next instance is initialized once at module level via `i18n/index.ts` and imported as a side effect in `main.tsx`
- No `I18nextProvider` wrapper needed -- react-i18next auto-detects the initialized instance
- Default language: `vi`, fallback: `vi`
- Namespaces: `common` (default), `pms`, `wms`, `hrm`, `crm`

## Requirements
- Install `i18next` and `react-i18next`
- Create `frontend/src/i18n/index.ts` with proper config
- Import `i18n/index.ts` in `main.tsx` before app renders
- Support lazy-loading namespaces (bundled JSON, not HTTP fetched -- KISS)

## Architecture

```
main.tsx
  └── import '@/i18n'       // side-effect: initializes i18next
  └── <App />
        └── useTranslation() available everywhere
```

i18next config options:
- `lng`: read from `localStorage.getItem('a-erp-language') || 'vi'`
- `fallbackLng`: `'vi'`
- `defaultNS`: `'common'`
- `ns`: `['common', 'pms', 'wms', 'hrm', 'crm']`
- `interpolation.escapeValue`: `false` (React already escapes)
- `resources`: inline imported JSON (simple, no backend needed)

## Files to Create

### `frontend/src/i18n/index.ts` (~30 lines)

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import commonVi from './locales/vi/common.json'
import pmsVi from './locales/vi/pms.json'
import wmsVi from './locales/vi/wms.json'
import hrmVi from './locales/vi/hrm.json'
import crmVi from './locales/vi/crm.json'

import commonEn from './locales/en/common.json'
import pmsEn from './locales/en/pms.json'
import wmsEn from './locales/en/wms.json'
import hrmEn from './locales/en/hrm.json'
import crmEn from './locales/en/crm.json'

const savedLang = localStorage.getItem('a-erp-language') || 'vi'

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: ['common', 'pms', 'wms', 'hrm', 'crm'],
  resources: {
    vi: { common: commonVi, pms: pmsVi, wms: wmsVi, hrm: hrmVi, crm: crmVi },
    en: { common: commonEn, pms: pmsEn, wms: wmsEn, hrm: hrmEn, crm: crmEn },
  },
  interpolation: { escapeValue: false },
})

export default i18n
```

## Files to Modify

### `frontend/src/main.tsx`

Add one import line before the App import:

```typescript
import './index.css'
import '@/i18n'              // <-- ADD THIS LINE
import App from './app/App.tsx'
```

## Implementation Steps

1. Run `cd frontend && npm install i18next react-i18next`
2. Create directory `frontend/src/i18n/locales/vi/` and `frontend/src/i18n/locales/en/`
3. Create placeholder JSON files (empty `{}`) for all 10 locale files (filled in Phase 2)
4. Create `frontend/src/i18n/index.ts` per snippet above
5. Add `import '@/i18n'` to `main.tsx`
6. Verify `tsc -b` compiles without errors
7. Verify dev server starts and renders normally

## Todo List

- [ ] Install `i18next` and `react-i18next`
- [ ] Create `frontend/src/i18n/locales/vi/` directory with 5 empty JSON files
- [ ] Create `frontend/src/i18n/locales/en/` directory with 5 empty JSON files
- [ ] Create `frontend/src/i18n/index.ts`
- [ ] Add import to `frontend/src/main.tsx`
- [ ] Verify TypeScript compilation
- [ ] Verify dev server works

## Success Criteria
- `i18next` initialized before React renders
- `useTranslation()` hook callable in any component without errors
- No runtime console errors
- Existing UI unchanged (no strings replaced yet)

## Risk Assessment
- **TypeScript JSON imports**: tsconfig already has `moduleResolution: "bundler"` which supports JSON imports. If errors, add `"resolveJsonModule": true` to `tsconfig.app.json`.
- **Bundle size**: all 10 JSON files are small (<5KB each). No lazy-loading complexity needed.
