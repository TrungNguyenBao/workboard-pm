# Phase 1: Language Infrastructure

## Priority: High | Status: Pending

## Overview
Add the language toggle mechanism to the existing `docs/user-guide.html` without breaking current EN content. All changes are additive.

## Changes to `docs/user-guide.html`

### 1. HTML `lang` attribute
Change `<html lang="en" data-theme="light">` → `<html lang="en" data-lang="en" data-theme="light">`

### 2. CSS additions (append to existing `<style>`)
```css
/* ── Language visibility ────────────────────────────────── */
html[data-lang="en"] .lang-vi { display: none; }
html[data-lang="vi"] .lang-en { display: none; }
html[data-lang="vi"] { --lang: "vi"; }

/* ── Language toggle button ─────────────────────────────── */
.lang-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  padding: 2px;
  background: var(--bg-elevated);
}
.lang-toggle button {
  padding: 2px 10px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-base) ease;
}
.lang-toggle button.active {
  background: var(--color-primary);
  color: #fff;
}
```

### 3. Topbar HTML — add lang toggle button
Insert after the dark-mode toggle button in the topbar:
```html
<div class="lang-toggle">
  <button id="langEn" class="active" onclick="setLang('en')">EN</button>
  <button id="langVi" onclick="setLang('vi')">VI</button>
</div>
```

### 4. Wrap existing content blocks
For each content section, wrap the body content (not headings) in `<div class="lang-en">...</div>`.
Headings get `data-en="English text" data-vi="Tiếng Việt text"` attributes.

### 5. JS additions (append to existing `<script>`)
```js
// ── Language Toggle ───────────────────────────────────────
function setLang(lang) {
  document.documentElement.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang === 'vi' ? 'vi' : 'en');
  localStorage.setItem('ug-lang', lang);
  document.getElementById('langEn').classList.toggle('active', lang === 'en');
  document.getElementById('langVi').classList.toggle('active', lang === 'vi');
  // Swap sidebar link text
  document.querySelectorAll('[data-en][data-vi]').forEach(function(el) {
    el.textContent = el.getAttribute('data-' + lang);
  });
}

// Init language on load
(function() {
  const saved = localStorage.getItem('ug-lang') || 'en';
  if (saved === 'vi') setLang('vi');
})();
```

## Related Files
- Modify: `docs/user-guide.html`

## Success Criteria
- EN|VI toggle appears in topbar, styled correctly
- Toggling hides/shows `.lang-en` / `.lang-vi` sections
- Sidebar link text swaps
- Preference persists on reload
