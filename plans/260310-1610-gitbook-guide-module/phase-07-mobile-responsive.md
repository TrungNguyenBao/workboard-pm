# Phase 7: Mobile Responsive + Polish

## Context
- [plan.md](plan.md)
- App sidebar already collapses on mobile
- HTML guides have their own mobile responsive CSS

## Overview
- **Priority:** Low
- **Status:** pending
- **Effort:** 30m
- **Depends on:** Phase 3-6

## Requirements

### Mobile (< 768px)
- Guide sidebar hidden by default on mobile
- Toggle button (hamburger/menu icon) to show guide sidebar as overlay or sheet
- Use shadcn `<Sheet>` component for slide-in guide sidebar
- Iframe takes full width when sidebar hidden

### Dark Mode Sync
- HTML guides have their own `data-theme` toggle
- When app theme changes, sync to iframe via URL parameter
- Append `?theme=dark` or `?theme=light` to iframe src
- HTML guides need a small JS snippet to read URL param on load:
  ```javascript
  const params = new URLSearchParams(window.location.search)
  if (params.get('theme')) {
    document.documentElement.setAttribute('data-theme', params.get('theme'))
  }
  ```
- Add this snippet to each HTML guide (5 files, 3 lines each)

### Polish
- Loading skeleton while iframe loads
- Smooth transition when switching guides
- Focus management: when navigating, scroll guide sidebar to active item

## Related Code Files
- **Modify:** `frontend/src/features/guides/pages/guide-viewer.tsx` -- responsive breakpoint logic
- **Modify:** `frontend/src/features/guides/components/guide-sidebar.tsx` -- sheet wrapper for mobile
- **Modify:** `docs/user-guide.html` -- add theme URL param reader
- **Modify:** `docs/sop-pms-guide.html` -- add theme URL param reader
- **Modify:** `docs/sop-crm-guide.html` -- add theme URL param reader
- **Modify:** `docs/sop-hrm-guide.html` -- add theme URL param reader
- **Modify:** `docs/sop-wsm-guide.html` -- add theme URL param reader

## Implementation Steps

### 1. Mobile sidebar toggle

In `guide-viewer.tsx`:
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false)
// Use window.matchMedia or Tailwind responsive classes
```

For mobile: wrap `GuideSidebar` in `<Sheet>`:
```tsx
<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
  <SheetContent side="left" className="w-64 p-0">
    <GuideSidebar ... />
  </SheetContent>
</Sheet>
```

For desktop: render sidebar inline.

Use `useMediaQuery` or simple `hidden md:block` Tailwind approach:
```tsx
{/* Desktop sidebar */}
<div className="hidden md:block w-60 border-r">
  <GuideSidebar ... />
</div>
{/* Mobile sheet */}
<div className="md:hidden">
  <Sheet ...>
    <GuideSidebar ... />
  </Sheet>
</div>
```

### 2. Dark mode sync

In `guide-content-frame.tsx`, include theme in iframe src:
```tsx
const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
const src = `/guides-static/${guideFile}?theme=${theme}#${sectionHash}`
```

Add to each HTML guide `<script>` section:
```javascript
// Sync theme from parent app
(function() {
  var p = new URLSearchParams(window.location.search);
  if (p.get('theme')) document.documentElement.setAttribute('data-theme', p.get('theme'));
})();
```

### 3. Loading state

In `guide-content-frame.tsx`, add:
```tsx
const [loading, setLoading] = useState(true)
<>
  {loading && <div className="flex items-center justify-center h-full"><Spinner /></div>}
  <iframe onLoad={() => setLoading(false)} ... className={loading ? 'invisible' : ''} />
</>
```

## Todo
- [ ] Add mobile sheet toggle for guide sidebar
- [ ] Add theme sync URL param to iframe src
- [ ] Add theme reader script to all 5 HTML guides
- [ ] Add loading state to iframe
- [ ] Test on narrow viewport
- [ ] Test dark/light mode sync

## Success Criteria
- Guide sidebar works as sheet on mobile
- Theme syncs between app and iframe content
- Loading indicator shows while iframe loads
- No horizontal overflow on mobile
- All files under 200 lines

## Risk
- Theme sync via URL param requires modifying HTML guides (5 files, minor change)
- `onLoad` event may fire before iframe content is visually ready; acceptable for v1
