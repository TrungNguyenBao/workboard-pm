# Phase 8: Settings, Shortcuts & Tips

## Priority: Medium | Status: Pending

## Overview
Final sections: user settings, keyboard shortcuts reference, search, notifications, and tips.

## Content Outline

### 8.1 User Settings (`/settings`)
- Edit display name
- Set avatar URL
- View email (read-only)
- Language switcher (English / Vietnamese)
- Change password (current + new)

### 8.2 Notifications
- Bell icon (top-right) with unread count badge
- Dropdown: 8 most recent; "Mark all read"
- Click notification → navigate to resource + mark read
- Real-time delivery via SSE (auto-updates)
- Polling fallback every 30 seconds

### 8.3 Command Palette / Search (`Ctrl+K`)
- Global search across tasks (FTS), projects, navigation
- Results grouped: Tasks, Projects, Navigation
- Selecting task → navigates to project board

### 8.4 Dark Mode
- Toggle in top bar (sun/moon icon)
- Applies across entire application

### 8.5 Keyboard Shortcuts Reference
Table:

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open search |
| `?` | Keyboard shortcuts dialog |
| `Esc` | Close dialog/drawer |
| `G` then `H` | Go to My Tasks |
| `G` then `B` | Go to Board view |
| `G` then `L` | Go to List view |
| `N` | New task |
| `Enter` | Open selected task |
| `Backspace` | Delete task |

### 8.6 Tips & Best Practices
- Use Goals to track high-level objectives across projects
- Set up custom fields per project for structured metadata
- Use tags for cross-project categorization
- Check My Tasks daily for personal workload overview
- Use timeline view for deadline-heavy projects
- Set inventory min thresholds to catch low stock early
- Use KPI templates for repeatable performance metrics

## Implementation Steps
1. Write HTML for 8.1–8.6
2. Style keyboard shortcuts with `<kbd>` elements
3. Use tip callout boxes for best practices
4. End with a "Need Help?" section (link to support)

## Success Criteria
- All keyboard shortcuts documented
- Settings page fields match implementation
- Practical tips section adds value
