# Phase 3: Guide Viewer Page + Routing

## Context
- [plan.md](plan.md)
- Router: `frontend/src/app/router.tsx` -- uses lazy loading, `<Route>` inside `<AppShell>`
- AppShell: sidebar + header + `<Outlet />` -- guide viewer renders inside this layout
- Phase 2 provides `GUIDE_CONFIGS` data

## Overview
- **Priority:** High (core page layout)
- **Status:** pending
- **Effort:** 1.5h
- **Depends on:** Phase 1, Phase 2

## Requirements
- Route: `/guides` redirects to first guide (`/guides/user-guide`)
- Route: `/guides/:guideId` shows guide with sidebar + content
- Route: `/guides/:guideId/:sectionHash` loads specific section via iframe hash
- Guide viewer fills available content area (no extra scrollbar from AppShell's main)
- Left: guide sidebar (240px). Right: iframe content area.

## Architecture

```
AppShell
  +-- Sidebar (app sidebar, collapsed or expanded)
  +-- Header
  +-- <main> (Outlet)
        +-- GuideViewerPage
              +-- GuideSidebar (240px, own scrollbar)
              +-- GuideContentFrame (flex-1, iframe)
              +-- GuideNavFooter (bottom bar, prev/next)
```

The guide viewer uses its own sidebar (guide-specific TOC) separate from the app sidebar.
This is a 2-sidebar pattern: app nav sidebar on far left, guide TOC sidebar inside content area.

## Related Code Files
- **Modify:** `frontend/src/app/router.tsx` -- add lazy import + routes
- **Create:** `frontend/src/features/guides/pages/guide-viewer.tsx` -- main page
- **Create:** `frontend/src/features/guides/components/guide-content-frame.tsx` -- iframe wrapper
- **Create:** `frontend/src/features/guides/hooks/use-guide-navigation.ts` -- URL-driven state

## Implementation Steps

### 1. Add routes to `router.tsx`

After other lazy imports, add:
```tsx
const GuideViewerPage = lazy(() => import('@/features/guides/pages/guide-viewer'))
```

Inside the `<AppShell>` routes, add:
```tsx
{/* Guides */}
<Route path="/guides" element={<Navigate to="/guides/user-guide" replace />} />
<Route path="/guides/:guideId" element={<GuideViewerPage />} />
<Route path="/guides/:guideId/:sectionHash" element={<GuideViewerPage />} />
```

### 2. Create `use-guide-navigation.ts` hook

```tsx
// Reads :guideId and :sectionHash from URL params
// Returns: activeGuide (GuideConfig), activeSection, activeItem, flatItems, navigateTo()
// Provides prev/next item helpers
```

Key logic:
- `useParams()` to get `guideId` and `sectionHash`
- Look up `GuideConfig` by id
- Find active section/item from sectionHash
- Compute `prevItem` and `nextItem` from flat items list
- `navigateTo(guideId, hash)` via `useNavigate()`

### 3. Create `guide-content-frame.tsx`

Renders an `<iframe>` pointing to `/guides-static/{file}#{hash}`.
- `src` updates when guide or section changes
- Iframe fills container height
- No border, transparent background
- Key prop on iframe to force reload when guide changes
- Listen for app theme changes and post message to iframe (stretch goal)

```tsx
interface Props {
  guideFile: string   // e.g., "user-guide.html"
  sectionHash: string // e.g., "welcome"
}
```

Iframe src: `${API_BASE_URL}/guides-static/${guideFile}#${sectionHash}`

Note: The `API_BASE_URL` should come from the same config used by api.ts.

### 4. Create `guide-viewer.tsx` page

Layout:
```tsx
<div className="flex h-full">
  <GuideSidebar guide={activeGuide} activeHash={sectionHash} onNavigate={...} />
  <div className="flex flex-1 flex-col min-w-0">
    <GuideBreadcrumb guide={activeGuide} section={...} item={...} />
    <GuideContentFrame guideFile={activeGuide.file} sectionHash={sectionHash} />
    <GuideNavFooter prev={prevItem} next={nextItem} onNavigate={...} />
  </div>
</div>
```

Must set `h-full` and parent containers must allow it. The `<main>` in AppShell already has `flex-1 overflow-y-auto` -- the guide viewer should set `overflow-hidden` on its root to prevent double scrollbar (iframe handles its own scroll).

## Todo
- [ ] Add lazy import to router.tsx
- [ ] Add 3 route definitions
- [ ] Create use-guide-navigation.ts hook
- [ ] Create guide-content-frame.tsx component
- [ ] Create guide-viewer.tsx page with layout
- [ ] Verify iframe loads correctly in dev (proxy to :8000)
- [ ] Test URL navigation works: /guides/user-guide/welcome

## Success Criteria
- `/guides` redirects to `/guides/user-guide`
- `/guides/user-guide` renders sidebar + iframe with user guide
- `/guides/sop-pms/tasks` navigates to PMS SOP scrolled to tasks section
- No double scrollbar
- Each file under 200 lines

## Risk
- Vite dev proxy: frontend on `:5173` needs to proxy `/guides-static/` to `:8000`. Check `vite.config.ts` proxy config.
- Iframe height: must be 100% of container. Test with `h-full` chain.
- Browser back/forward should work with URL-based state.

## Security
- Iframe sandboxing: `sandbox="allow-same-origin allow-scripts"` to be safe
- No user-generated content in iframe src
