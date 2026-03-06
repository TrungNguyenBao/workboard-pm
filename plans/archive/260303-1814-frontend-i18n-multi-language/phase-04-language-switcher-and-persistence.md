# Phase 4: Language Switcher UI and Persistence

## Context Links
- [plan.md](./plan.md)
- [Phase 3: Replace Hardcoded Strings](./phase-03-replace-hardcoded-strings.md)
- [frontend/src/shared/components/shell/sidebar.tsx](../../frontend/src/shared/components/shell/sidebar.tsx)
- [frontend/src/features/settings/pages/settings.tsx](../../frontend/src/features/settings/pages/settings.tsx)

## Overview
- **Priority**: P2
- **Status**: completed
- **Description**: Add a language switcher dropdown to the sidebar footer and settings page. Persist language choice in localStorage.

## Key Insights
- i18next's `i18n.changeLanguage(lng)` handles switching + triggers re-render of all `useTranslation()` consumers
- Persist to `localStorage` manually on change (key: `a-erp-language`) -- keeps it consistent with the init config from Phase 1
- Two placement options: sidebar footer (always visible) + settings page (discoverable)
- KISS: use a simple `<select>` or the existing `Select` component -- no custom dropdown needed

## Requirements
- Language switcher visible in sidebar footer area
- Language preference persisted in localStorage (key: `a-erp-language`)
- Switching language immediately updates all visible strings
- Settings page also shows language option for discoverability

## Architecture

```
User clicks language option
  → i18n.changeLanguage('en')
  → localStorage.setItem('a-erp-language', 'en')
  → react-i18next triggers re-render of all useTranslation() consumers
  → UI updates instantly
```

No Zustand store needed. i18next manages language state internally. localStorage handles persistence across sessions.

## Files to Create

### `frontend/src/shared/components/shell/language-switcher.tsx` (~35 lines)

```tsx
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const LANGUAGES = [
  { code: 'vi', label: 'Tieng Viet' },
  { code: 'en', label: 'English' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function handleChange(lng: string) {
    i18n.changeLanguage(lng)
    localStorage.setItem('a-erp-language', lng)
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
      <Select value={i18n.language} onValueChange={handleChange}>
        <SelectTrigger className="h-7 flex-1 text-xs border-0 bg-transparent px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

## Files to Modify

### `frontend/src/shared/components/shell/sidebar.tsx`

Add `LanguageSwitcher` to the sidebar footer, between settings icon and logout icon (or below the user section).

```tsx
// ADD import:
import { LanguageSwitcher } from './language-switcher'

// In the footer section, add above or below the user row:
// Option A: Add as a row above the user section
<div className="border-t border-border px-3 pt-2">
  <LanguageSwitcher />
</div>

// The existing user section remains unchanged below
<div className="border-t border-border p-3 flex items-center gap-2">
  {/* ...existing user/settings/logout... */}
</div>
```

Alternatively, place it inline in the existing footer to save space:

```tsx
// Option B: Compact -- add between settings and logout buttons
<div className="border-t border-border p-3">
  <div className="flex items-center gap-2 mb-2">
    <LanguageSwitcher />
  </div>
  <div className="flex items-center gap-2">
    {/* ...existing user avatar, name, settings, logout... */}
  </div>
</div>
```

**Recommendation**: Option A (separate row above user section) -- cleaner separation, doesn't crowd the user row.

### `frontend/src/features/settings/pages/settings.tsx`

Add a "Language" section in the settings form, between the email field and the password section.

```tsx
// ADD import:
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

// Inside SettingsPage component:
const { t, i18n } = useTranslation()

// ADD after the email input field, before the <hr />:
<div>
  <label className="text-sm font-medium text-neutral-700 block mb-1">
    {t('language.label')}
  </label>
  <Select
    value={i18n.language}
    onValueChange={(lng) => {
      i18n.changeLanguage(lng)
      localStorage.setItem('a-erp-language', lng)
    }}
  >
    <SelectTrigger className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="vi">{t('language.vi')}</SelectItem>
      <SelectItem value="en">{t('language.en')}</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Implementation Steps

1. Create `frontend/src/shared/components/shell/language-switcher.tsx`
2. Import and add `<LanguageSwitcher />` to `sidebar.tsx` footer
3. Add language select to `settings.tsx`
4. Test: switch language in sidebar, verify all strings update
5. Test: refresh page, verify language persists from localStorage
6. Test: switch language in settings, verify sidebar switcher updates too
7. Verify TypeScript compilation

## Todo List

- [ ] Create `frontend/src/shared/components/shell/language-switcher.tsx`
- [ ] Add `<LanguageSwitcher />` to sidebar footer in `sidebar.tsx`
- [ ] Add language select section to `settings.tsx`
- [ ] Test language switching in sidebar
- [ ] Test language switching in settings
- [ ] Test persistence across page refresh
- [ ] Test both directions: vi -> en and en -> vi
- [ ] Verify TypeScript compilation

## Success Criteria
- Language switcher visible in sidebar footer
- Language option available in settings page
- Switching language updates all visible strings immediately
- Language choice persists across page refreshes
- Both switchers stay in sync (changing in sidebar reflects in settings and vice versa)

## Risk Assessment
- **Select component styling**: The existing `Select` component from Radix may need minor styling adjustments in the sidebar's compact space. The `h-7 text-xs` classes should handle this.
- **i18n.language value**: i18next may return a region code like `vi-VN` instead of `vi`. The init config uses exact `vi`/`en` codes, so this shouldn't be an issue, but verify during testing.

## Security Considerations
- Language preference stored in localStorage only (no sensitive data)
- No server-side calls needed for language switching
