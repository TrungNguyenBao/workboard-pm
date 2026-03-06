# User Guide — Vietnamese / Multi-Language Support

## Goal
Add Vietnamese (VI) translation to `docs/user-guide.html` via an inline EN/VI language toggle, matching the app's own language-switch pattern.

## Output
Updated `docs/user-guide.html` — same single file, now bilingual.

## Approach: Dual-Content + Data-Lang Toggle

```
html[data-lang="en"]  →  .lang-en visible, .lang-vi hidden
html[data-lang="vi"]  →  .lang-vi visible, .lang-en hidden
```

- EN content: existing elements get `class="lang-en"` wrapper divs
- VI content: new `class="lang-vi"` divs added right after each EN div
- Sidebar TOC links: `data-en` / `data-vi` attributes, JS swaps text on toggle
- Section headings (`<h2>/<h3>` with IDs): stay as-is (IDs unchanged for scrollspy), text swapped via data attributes
- Toggle button in topbar: `EN | VI` pill switcher
- Persisted to `localStorage` key `ug-lang`

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Language infrastructure (CSS, JS, toggle button) | Pending |
| 2 | Vietnamese content — all sections translated | Pending |

## Phases
- [Phase 1: Infrastructure](phase-01-lang-infrastructure.md)
- [Phase 2: Vietnamese Translation](phase-02-vi-translation.md)
