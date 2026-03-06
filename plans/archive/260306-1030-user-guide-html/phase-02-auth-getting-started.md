# Phase 2: Auth & Getting Started

## Priority: High | Status: Pending

## Overview
Write the "Getting Started" section covering registration, login, first-time workspace creation, and basic navigation.

## Content Outline

### 2.1 Welcome / Introduction
- What is A-ERP (one paragraph)
- Four modules overview: PMS (Projects), WMS (Warehouse), HRM (People), CRM (Sales)
- Audience: end users + workspace admins

### 2.2 Creating an Account
- Navigate to `/register`
- Fields: Full Name, Email, Password (min 8 chars)
- Show/hide password toggle
- Submit → auto-login → redirected to workspace creation

### 2.3 Logging In
- Navigate to `/login`
- Email + Password fields
- On success → redirected to My Tasks (`/pms/my-tasks`)
- Session: JWT stored in memory (auto-refreshed via cookie)

### 2.4 First-Time Setup
- Workspace creation dialog appears automatically
- Enter workspace name → auto-generates URL slug
- After creation → land on PMS dashboard

### 2.5 Navigating the App
- **Sidebar** (left): workspace picker (top), module switcher, module-specific nav links, user footer
- **Top bar**: breadcrumb trail, search (Ctrl+K), dark mode toggle, notification bell
- **Module switcher**: click module icon to switch between PMS/WMS/HRM/CRM
- **Sidebar collapse**: click toggle to minimize sidebar to icon-only (48px)

### 2.6 Language Support
- English and Vietnamese available
- Switch via sidebar footer flag icon or Settings page
- Persists across sessions (localStorage)

## Implementation Steps
1. Write HTML content for sections 2.1–2.6 inside the Getting Started `<section>`
2. Use callout boxes for tips (e.g., "Tip: Use Ctrl+K to quickly search")
3. Use `<kbd>` tags for keyboard shortcuts
4. Mark no admin-only content in this section

## Success Criteria
- Clear onboarding flow from registration → first workspace → navigation
- All UI elements described match actual implementation
