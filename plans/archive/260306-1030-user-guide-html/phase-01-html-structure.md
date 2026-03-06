# Phase 1: HTML Structure & Shell

## Priority: High | Status: Pending

## Overview
Build the single-file HTML skeleton with design-system styling, sidebar TOC, dark mode toggle, scrollspy, and responsive layout.

## Requirements

### Functional
- Self-contained HTML file (inline CSS + JS, no external deps except Google Fonts CDN)
- Sticky sidebar with nested TOC links (collapsible per module)
- Smooth-scroll + scrollspy highlighting active section
- Dark mode toggle (matches app's dark theme)
- Responsive: sidebar collapses to hamburger on mobile (<768px)
- Print-friendly styles (@media print hides sidebar, full-width content)
- "Back to top" floating button

### Design Tokens (from design-guidelines.md)
- Font: DM Sans (Google Fonts), monospace: JetBrains Mono
- Primary: `#5E6AD2`, Accent: `#F28C38`
- Success: `#22C55E`, Warning: `#F59E0B`, Danger: `#EF4444`, Info: `#38BDF8`
- Light bg: `#FFFFFF` page, `#F9F9FB` surface, borders `#E4E4E7`
- Dark bg: `#0F0F12` page, `#1A1A1F` surface, borders `rgba(255,255,255,0.10)`
- Border radius: 8px cards, 6px inputs, 9999px badges
- Base font: 14px, headings: 600 weight

## Implementation Steps

1. Create `docs/user-guide.html`
2. Write HTML boilerplate with `<head>` (Google Fonts link, inline `<style>`)
3. Implement CSS:
   - CSS variables for light/dark themes
   - Sidebar: 260px fixed left, scrollable, nested `<nav>` with indent levels
   - Content area: `margin-left: 260px`, max-width 900px, padding
   - Section headings with anchor IDs
   - Admin badge style (indigo pill)
   - Tip/warning/info callout boxes
   - Table styles (striped, bordered)
   - Code/kbd tag styles (JetBrains Mono)
   - Dark mode class toggle on `<html>`
   - Responsive breakpoint: sidebar → overlay at <768px
   - Print: hide sidebar, remove fixed positioning
4. Implement JS (inline `<script>` at end):
   - Dark mode toggle (localStorage persistence)
   - Scrollspy: IntersectionObserver on `<h2>` elements → highlight sidebar link
   - Mobile hamburger toggle
   - Collapsible sidebar sections (click module name to expand/collapse children)
   - Smooth scroll on TOC link click
   - Back-to-top button visibility toggle
5. Build the `<body>` skeleton with all section `<h2>` / `<h3>` IDs matching TOC

## Related Files
- Create: `docs/user-guide.html`
- Reference: `docs/design-guidelines.md` (design tokens)

## Success Criteria
- HTML opens in browser with styled sidebar + empty content sections
- Dark mode toggle works and persists
- Sidebar links scroll to correct sections
- Mobile responsive layout works
- Print view is clean
