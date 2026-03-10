---
title: "GitBook-Style User Guide Module"
description: "In-app guide viewer with sidebar tree nav, iframe content, search, and prev/next navigation"
status: pending
priority: P2
effort: 6h
branch: main
tags: [frontend, guides, documentation, ux]
created: 2026-03-10
---

# GitBook-Style User Guide Module

## Goal
Build an in-app documentation viewer with GitBook-like UX: collapsible sidebar tree, breadcrumbs, prev/next navigation, and search. Reuses existing HTML guide files via iframe rendering (Hybrid approach -- Option C).

## Approach
- **React shell** provides GitBook-like navigation (sidebar tree, breadcrumbs, prev/next, search)
- **Iframe** renders existing HTML guides as-is (no conversion needed)
- **Backend** serves HTML files as static assets at `/guides-static/`
- **TOC config** (JSON) extracted from HTML sidebar structures, drives all navigation
- Guide page lives **outside** the module switcher -- it's a shared feature accessible from any module

## Architecture

```
/guides                    -> Guide landing (redirects to first guide)
/guides/:guideId           -> Guide page with first section
/guides/:guideId/:section  -> Guide page scrolled to section via iframe hash

Frontend (React shell)           Backend (FastAPI)
+---------------------------+    +-----------------------+
| guide-viewer.tsx (page)   |    | main.py               |
|   +-------------------+   |    |   mount /guides-static |
|   | guide-sidebar     |   |    |   -> docs/*.html       |
|   | guide-content     |   |    +-----------------------+
|   | guide-nav-footer  |   |
|   +-------------------+   |
+---------------------------+
```

## Phases

| # | Phase | Status | Est |
|---|-------|--------|-----|
| 1 | [Backend: Serve static HTML guides](phase-01-backend-static-files.md) | pending | 30m |
| 2 | [TOC data structure + guide config](phase-02-guide-toc-config.md) | pending | 1h |
| 3 | [Guide viewer page + routing](phase-03-guide-viewer-page.md) | pending | 1.5h |
| 4 | [Guide sidebar component](phase-04-guide-sidebar.md) | pending | 1h |
| 5 | [Guide nav footer + breadcrumb](phase-05-nav-footer-breadcrumb.md) | pending | 45m |
| 6 | [Sidebar search + app nav integration](phase-06-search-and-nav-integration.md) | pending | 45m |
| 7 | [Mobile responsive + polish](phase-07-mobile-responsive.md) | pending | 30m |

## Key Dependencies
- Existing 5 HTML guides in `docs/` directory
- FastAPI `StaticFiles` middleware (already used for `/uploads`)
- shadcn/ui: `breadcrumb.tsx`, `input.tsx`, `button.tsx`, `separator.tsx`, `tooltip.tsx`, `sheet.tsx`
- `react-router-dom` v7 for route params
- App dark/light mode already functional

## Files Summary

**Modify:**
- `backend/app/main.py` -- mount `/guides-static/` static files
- `frontend/src/app/router.tsx` -- add `/guides/*` routes
- `frontend/src/shared/components/shell/sidebar-navigation.tsx` -- add "User Guide" link
- `frontend/src/shared/components/ui/breadcrumb.tsx` -- add `guides` segment label

**Create:**
- `frontend/src/features/guides/data/guide-toc.ts` -- TOC config for all 5 guides
- `frontend/src/features/guides/pages/guide-viewer.tsx` -- main page layout
- `frontend/src/features/guides/components/guide-sidebar.tsx` -- sidebar tree
- `frontend/src/features/guides/components/guide-content-frame.tsx` -- iframe wrapper
- `frontend/src/features/guides/components/guide-nav-footer.tsx` -- prev/next nav
- `frontend/src/features/guides/hooks/use-guide-navigation.ts` -- navigation state hook

## Risks
- Iframe cross-origin: mitigated by serving from same origin via backend static mount
- HTML guide theme mismatch: iframe loads its own CSS with own dark/light toggle; will need postMessage or URL param to sync theme
- Search within iframe content not possible; sidebar search filters TOC items only (acceptable for v1)
