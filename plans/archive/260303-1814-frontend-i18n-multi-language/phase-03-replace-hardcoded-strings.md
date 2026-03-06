# Phase 3: Replace Hardcoded Strings with t() Calls

## Context Links
- [plan.md](./plan.md)
- [Phase 2: Translation Files](./phase-02-create-translation-files.md)

## Overview
- **Priority**: P1 (core implementation)
- **Status**: completed
- **Description**: Replace every hardcoded user-facing string in the frontend with `useTranslation()` / `t()` calls, referencing keys from the translation JSON files.

## Key Insights
- Pattern: add `const { t } = useTranslation()` (or `useTranslation('pms')` for module namespaces) at the top of each component
- For components that use both common + module namespace: `const { t } = useTranslation(['pms', 'common'])` -- first namespace is default, prefix others with `common:`
- Module store `MODULES` array needs translation -- replace static `name`/`description` with `t()` calls in the component that renders them (not in the store itself, since hooks can't be called outside components)
- Zod validation messages can use i18n via a helper or by passing `t()` result as the error string
- `window.confirm()` calls need `t()` for the confirmation message

## Architecture

```
Component renders → useTranslation('namespace') → t('key') → localized string
                                                  t('key', { name: 'X' }) → interpolated string
```

No structural changes to components. Only string literals are replaced.

## Files to Modify

Organized by area. Each file gets `useTranslation()` added and strings replaced.

### Shared / Shell Components

#### `frontend/src/shared/components/shell/sidebar.tsx`
```tsx
// ADD at top of Sidebar():
const { t } = useTranslation()

// REPLACE strings:
// "No workspace" → t('sidebar.noWorkspace')
// "No workspace yet" → t('sidebar.noWorkspaceYet')
// "Create workspace" → t('sidebar.createWorkspace')
// "New workspace" → t('sidebar.newWorkspace')
// "Rename workspace" → t('sidebar.renameWorkspace')
// "Cancel" → t('common.cancel')
// "Save" → t('common.save')
// "My Tasks" → t('nav.myTasks')
// "Goals" → t('nav.goals')
// "Members" → t('nav.members')
// "Employees" → t('nav.employees')
// "Departments" → t('nav.departments')
// "Leave" → t('nav.leave')
// "Payroll" → t('nav.payroll')
// "Contacts" → t('nav.contacts')
// "Deals" → t('nav.deals')
// "Products" → t('nav.products')
// "Warehouses" → t('nav.warehouses')
// "Devices" → t('nav.devices')
// "Inventory" → t('nav.inventory')
// "Suppliers" → t('nav.suppliers')
// "Projects" → t('sidebar.projects')
// "New Project" → t('sidebar.newProject')
// "Invite members" → t('sidebar.inviteMembers')
// "Profile settings" → t('sidebar.profileSettings')
// "Settings" → t('sidebar.settings')
// "Log out" → t('sidebar.logOut')
// "Rename" → t('common.rename')
// "Delete" → t('common.delete')
// window.confirm message → t('common.deleteConfirmFull', { name: project.name })
```

#### `frontend/src/shared/components/shell/header.tsx`
```tsx
const { t } = useTranslation()
// "Search (⌘K)" title → t('common.search') + " (⌘K)"
```

#### `frontend/src/shared/components/shell/module-switcher.tsx`
```tsx
const { t } = useTranslation()
// Replace MODULES rendering:
// mod.name → t(`module.${mod.id}`)
// mod.description (title attr) → t(`module.${mod.id}.description`)
```

#### `frontend/src/shared/components/shell/keyboard-shortcuts-dialog.tsx`
```tsx
const { t } = useTranslation()
// "Keyboard Shortcuts" → t('shortcuts.title')
// All group names and labels → t('shortcuts.xxx') keys
// NOTE: The SHORTCUTS array should move inside the component or be a function
// that receives `t` so labels are reactive to language changes.
```

### Auth Pages

#### `frontend/src/features/auth/pages/login.tsx`
```tsx
const { t } = useTranslation()
// Zod schema messages:
//   z.string().email('Invalid email') → z.string().email(t('auth.invalidEmail'))
//   z.string().min(1, 'Password required') → z.string().min(1, t('auth.passwordRequired'))
// NOTE: schema must be created inside the component (or use a factory) so t() is available
// "Welcome back" → t('auth.welcomeBack')
// "Sign in to your WorkBoard account" → t('auth.signInDescription')
// "Email" → t('auth.email')
// "Password" → t('auth.password')
// placeholder texts → t('auth.emailPlaceholder'), t('auth.passwordPlaceholder')
// "Sign in" / "Signing in…" → t('auth.signIn') / t('auth.signingIn')
// toast title/description → t('auth.loginFailed'), t('auth.pleaseTryAgain')
// "Don't have an account?" → t('auth.dontHaveAccount')
// "Sign up" → t('auth.signUp')
// aria-label → t('auth.showPassword') / t('auth.hidePassword')
```

#### `frontend/src/features/auth/pages/register.tsx`
```tsx
const { t } = useTranslation()
// Similar pattern to login.tsx
// "Create your account" → t('auth.createAccount')
// "Start managing your projects..." → t('auth.createAccountDescription')
// "Full name" → t('auth.fullName')
// Zod messages → t('auth.nameRequired'), t('auth.invalidEmail'), t('auth.passwordMinLength')
// "Create account" / "Creating account…" → t('auth.createAccount') / t('auth.creatingAccount')
// "Already have an account?" → t('auth.alreadyHaveAccount')
// "Sign in" → t('auth.signIn')
// toast → t('auth.registrationFailed')
```

#### `frontend/src/features/auth/components/auth-layout.tsx`
```tsx
const { t } = useTranslation()
// "WorkBoard" → t('app.name')
// Tagline, subtitle, feature texts → t('auth.branding.xxx')
// Copyright → t('auth.branding.copyright')
// NOTE: features array should use t() for text values
```

### Settings / Workspace / Members

#### `frontend/src/features/settings/pages/settings.tsx`
```tsx
const { t } = useTranslation()
// "Settings" → t('settings.title')
// "Name" → t('settings.name')
// "Avatar URL" → t('settings.avatarUrl')
// "Email" → t('settings.email')
// "Change Password" → t('settings.changePassword')
// "Current Password" → t('settings.currentPassword')
// "New Password" → t('settings.newPassword')
// "Save Changes" / "Saving…" / "Saved ✓" → t('settings.save') / t('settings.saving') / t('settings.saved')
// "Failed to save" → t('settings.saveFailed')
```

#### `frontend/src/features/workspaces/components/create-workspace-dialog.tsx`
```tsx
const { t } = useTranslation()
// "Create a workspace" → t('workspace.create')
// "Workspace name" → t('workspace.name')
// "URL slug" → t('workspace.slug')
// "(letters, numbers, hyphens)" → t('workspace.slugHint')
// "Cancel" → t('common.cancel')
// "Creating…" / "Create workspace" → t('workspace.creating') / t('sidebar.createWorkspace')
// toast messages → t('workspace.created', { name }), t('workspace.createFailed')
```

#### `frontend/src/features/workspaces/components/invite-members-dialog.tsx`
```tsx
const { t } = useTranslation()
// All labels and buttons in the invite dialog
```

#### `frontend/src/features/workspaces/pages/members.tsx`
```tsx
const { t } = useTranslation()
// "Members" → t('members.title')
// "N member(s)" → t('members.count', { count: members.length })
// "Invite" → t('members.invite')
// "Loading…" → t('common.loading')
// confirm message → t('members.removeConfirm', { name: m.user_name })
// "Remove member" → t('members.removeMember')
// Role labels: "Admin"/"Member"/"Guest" → t('members.role.admin') etc.
```

#### `frontend/src/features/notifications/components/notification-bell.tsx`
```tsx
const { t } = useTranslation()
// "Notifications" → t('notifications.title')
// "Mark all read" → t('notifications.markAllRead')
// "No notifications" → t('notifications.empty')
```

#### `frontend/src/features/search/components/command-palette.tsx`
```tsx
const { t } = useTranslation()
// "Search tasks, projects…" → t('search.placeholder')
// "Searching…" → t('search.searching')
// "No results found" → t('search.noResults')
// "Tasks" → t('search.tasks')
// "Projects" → t('search.projects')
// "Navigation" → t('search.navigation')
// "My Tasks" (in navigation items) → t('nav.myTasks')
```

### PMS Module

#### `frontend/src/modules/pms/features/dashboard/pages/my-tasks.tsx`
```tsx
const { t } = useTranslation('pms')
// "My Tasks" → t('myTasks.title')
// "All caught up!" → t('myTasks.allCaughtUp')
// "Loading…" → t('common:common.loading')  // or use common ns
// "Overdue"/"Today"/"Upcoming"/"Later" → t('myTasks.overdue') etc.
```

#### `frontend/src/modules/pms/features/projects/components/create-project-dialog.tsx`
```tsx
const { t } = useTranslation('pms')
// "New project" → t('project.new')
// "Project name" → t('project.name')
// "Color" → t('project.color')
// "Cancel" → t('common:common.cancel')
// "Creating…" / "Create project" → t('project.creating') / t('project.createProject')
// toast → t('project.created', { name }), t('project.createFailed')
```

#### `frontend/src/modules/pms/features/projects/components/filter-bar.tsx`
```tsx
const { t } = useTranslation('pms')
// "Filter:" → t('filter.label')
// "All" → t('filter.all')
// "High"/"Medium"/"Low" → t('filter.high') etc.
// "Active"/"Done" → t('filter.active'), t('filter.done')
// "Clear" → t('filter.clear')
```

#### `frontend/src/modules/pms/features/projects/components/project-header.tsx`
```tsx
const { t } = useTranslation('pms')
// View tab labels: "Board"/"List"/"Calendar"/"Timeline"/"Overview"
```

#### `frontend/src/modules/pms/features/projects/pages/board.tsx`
#### `frontend/src/modules/pms/features/projects/pages/list.tsx`
#### `frontend/src/modules/pms/features/projects/pages/calendar.tsx`
#### `frontend/src/modules/pms/features/projects/pages/timeline.tsx`
#### `frontend/src/modules/pms/features/projects/pages/overview.tsx`
```tsx
// Each page: add useTranslation('pms'), replace any hardcoded labels
```

#### `frontend/src/modules/pms/features/projects/components/board-kanban-column.tsx`
#### `frontend/src/modules/pms/features/projects/components/board-task-card.tsx`
#### `frontend/src/modules/pms/features/projects/components/board-add-section-input.tsx`
#### `frontend/src/modules/pms/features/projects/components/inline-task-input.tsx`
#### `frontend/src/modules/pms/features/projects/components/activity-timeline.tsx`
#### `frontend/src/modules/pms/features/projects/components/project-settings-dialog.tsx`
```tsx
// Add useTranslation('pms'), replace labels
```

#### `frontend/src/modules/pms/features/tasks/components/task-detail-drawer.tsx`
#### `frontend/src/modules/pms/features/tasks/components/task-activity.tsx`
#### `frontend/src/modules/pms/features/tasks/components/recurrence-picker.tsx`
```tsx
// Add useTranslation('pms'), replace task-related labels
```

#### `frontend/src/modules/pms/features/goals/pages/goals-list.tsx`
#### `frontend/src/modules/pms/features/goals/components/create-goal-dialog.tsx`
#### `frontend/src/modules/pms/features/goals/components/goal-card.tsx`
#### `frontend/src/modules/pms/features/goals/components/goal-detail-drawer.tsx`
#### `frontend/src/modules/pms/features/goals/components/goal-linked-items.tsx`
#### `frontend/src/modules/pms/features/goals/components/link-projects-dialog.tsx`
#### `frontend/src/modules/pms/features/goals/components/link-tasks-dialog.tsx`
```tsx
// Add useTranslation('pms'), replace goal-related labels
```

#### `frontend/src/modules/pms/features/custom-fields/components/*.tsx` (4 files)
```tsx
// Add useTranslation('pms'), replace custom field labels
```

### WMS Module

#### `frontend/src/modules/wms/features/shared/components/wms-page-header.tsx`
```tsx
// NOTE: This is a generic component -- strings come from props.
// Only translate the "Search…" placeholder and "Create" default label.
const { t } = useTranslation()
// "Search…" placeholder → t('common.search') + '...'
```

#### `frontend/src/modules/wms/features/shared/components/wms-pagination.tsx`
```tsx
const { t } = useTranslation()
// "N items · Page X of Y" → t('common.items', { count: total }) + ' · ' + t('common.page', { page, total: totalPages })
```

#### `frontend/src/modules/wms/features/shared/components/wms-data-table.tsx`
```tsx
// emptyMessage comes from props -- no changes needed in this component
```

#### `frontend/src/modules/wms/features/products/pages/products-list.tsx`
```tsx
const { t } = useTranslation('wms')
// title, description, createLabel, column labels, emptyMessage, toast messages, confirm
// "Products" → t('products.title')
// "Manage product catalog" → t('products.description')
// "New product" → t('products.new')
// Column labels: "Name", "SKU", "Category", "Unit", "Serial Tracked", "Status"
// "All categories" → t('products.allCategories')
// "Equipment"/"Accessory" → t('products.equipment')/t('products.accessory')
// "No products yet" → t('products.empty')
// toast → t('products.deleted')
// confirm → t('common:common.deleteConfirm', { name: p.name })
// "Active"/"Inactive" → t('common:common.active')/t('common:common.inactive')
// "Yes"/"No" → t('common:common.yes')/t('common:common.no')
```

#### `frontend/src/modules/wms/features/products/components/product-form-dialog.tsx`
```tsx
const { t } = useTranslation('wms')
// "Edit product" / "New product" → t('products.edit') / t('products.new')
// Labels, buttons, toast messages
// "Cancel" → t('common:common.cancel')
// "Saving…" / "Save changes" / "Create product" → t('products.saving') / t('products.saveChanges') / t('products.createProduct')
```

#### Similar pattern for all WMS submodule pages and form dialogs:
- `warehouses-list.tsx`, `warehouse-form-dialog.tsx`
- `devices-list.tsx`, `device-form-dialog.tsx`
- `inventory-list.tsx`, `inventory-item-form-dialog.tsx`
- `suppliers-list.tsx`, `supplier-form-dialog.tsx`

### HRM Module

#### `frontend/src/modules/hrm/features/shared/components/hrm-page-header.tsx`
#### `frontend/src/modules/hrm/features/shared/components/hrm-pagination.tsx`
```tsx
// Same pattern as WMS shared components
```

#### `frontend/src/modules/hrm/features/employees/pages/employees-list.tsx`
```tsx
const { t } = useTranslation('hrm')
// "Employees" → t('employees.title')
// "Manage workforce and personnel" → t('employees.description')
// "New employee" → t('employees.new')
// Column labels → t('employees.name'), t('employees.email'), t('employees.position'), t('employees.hireDate')
// "No employees yet" → t('employees.empty')
// toast → t('employees.deleted')
```

#### Similar for: departments, leave, payroll pages and form dialogs

### CRM Module

#### `frontend/src/modules/crm/features/shared/components/crm-page-header.tsx`
#### `frontend/src/modules/crm/features/shared/components/crm-pagination.tsx`
```tsx
// Same pattern as WMS/HRM shared components
```

#### `frontend/src/modules/crm/features/contacts/pages/contacts-list.tsx`
```tsx
const { t } = useTranslation('crm')
// "Contacts" → t('contacts.title')
// "Manage customers and business contacts" → t('contacts.description')
// "New contact" → t('contacts.new')
// Column labels → t('contacts.name'), t('contacts.email'), etc.
// "No contacts yet" → t('contacts.empty')
// toast → t('contacts.deleted')
```

#### `frontend/src/modules/crm/features/contacts/components/contact-form-dialog.tsx`
```tsx
const { t } = useTranslation('crm')
```

#### `frontend/src/modules/crm/features/deals/pages/deals-list.tsx`
```tsx
const { t } = useTranslation('crm')
// "Deals" → t('deals.title')
// "Track sales pipeline..." → t('deals.description')
// "New deal" → t('deals.new')
// "All stages" → t('deals.allStages')
// Column labels, stage labels, toast, confirm
```

#### `frontend/src/modules/crm/features/deals/components/deal-form-dialog.tsx`
```tsx
const { t } = useTranslation('crm')
```

### Router / App

#### `frontend/src/app/router.tsx`
```tsx
// "Loading…" fallback → wrap in a component that uses t('common.loading')
// OR keep as-is since i18n may not be ready during Suspense fallback
// RECOMMENDATION: Keep "Loading…" hardcoded in router Suspense -- it's pre-i18n
```

#### `frontend/src/app/App.tsx`
```tsx
// No user-facing strings to translate (spinner only)
```

## Implementation Steps

1. Start with shared shell components (sidebar, header, module-switcher, keyboard-shortcuts)
2. Then auth pages (login, register, auth-layout)
3. Then shared features (settings, workspace dialogs, members, notifications, command palette)
4. Then PMS module (my-tasks, projects, goals, tasks, custom-fields)
5. Then WMS module (shared components first, then each feature)
6. Then HRM module
7. Then CRM module
8. After each file: run `tsc -b` to verify compilation
9. Test in browser: switch language, verify all strings update

## Implementation Pattern (copy-paste template)

```tsx
// At top of file, add import:
import { useTranslation } from 'react-i18next'

// Inside component function, first line:
const { t } = useTranslation()          // for common namespace
// OR
const { t } = useTranslation('pms')     // for module namespace
// OR
const { t } = useTranslation(['pms', 'common'])  // multiple namespaces

// Replace strings:
// BEFORE: <h1>My Tasks</h1>
// AFTER:  <h1>{t('myTasks.title')}</h1>

// BEFORE: toast({ title: 'Product deleted', variant: 'success' })
// AFTER:  toast({ title: t('products.deleted'), variant: 'success' })

// BEFORE: if (window.confirm(`Delete "${p.name}"?`))
// AFTER:  if (window.confirm(t('common:common.deleteConfirm', { name: p.name })))
```

## Todo List

### Shell / Shared
- [ ] `frontend/src/shared/components/shell/sidebar.tsx`
- [ ] `frontend/src/shared/components/shell/header.tsx`
- [ ] `frontend/src/shared/components/shell/module-switcher.tsx`
- [ ] `frontend/src/shared/components/shell/keyboard-shortcuts-dialog.tsx`

### Auth
- [ ] `frontend/src/features/auth/pages/login.tsx`
- [ ] `frontend/src/features/auth/pages/register.tsx`
- [ ] `frontend/src/features/auth/components/auth-layout.tsx`

### Shared Features
- [ ] `frontend/src/features/settings/pages/settings.tsx`
- [ ] `frontend/src/features/workspaces/components/create-workspace-dialog.tsx`
- [ ] `frontend/src/features/workspaces/components/invite-members-dialog.tsx`
- [ ] `frontend/src/features/workspaces/pages/members.tsx`
- [ ] `frontend/src/features/notifications/components/notification-bell.tsx`
- [ ] `frontend/src/features/search/components/command-palette.tsx`

### PMS Module
- [ ] `frontend/src/modules/pms/features/dashboard/pages/my-tasks.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/create-project-dialog.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/filter-bar.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/project-header.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/project-settings-dialog.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/board-kanban-column.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/board-task-card.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/board-add-section-input.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/inline-task-input.tsx`
- [ ] `frontend/src/modules/pms/features/projects/components/activity-timeline.tsx`
- [ ] `frontend/src/modules/pms/features/projects/pages/board.tsx`
- [ ] `frontend/src/modules/pms/features/projects/pages/list.tsx`
- [ ] `frontend/src/modules/pms/features/projects/pages/calendar.tsx`
- [ ] `frontend/src/modules/pms/features/projects/pages/timeline.tsx`
- [ ] `frontend/src/modules/pms/features/projects/pages/overview.tsx`
- [ ] `frontend/src/modules/pms/features/tasks/components/task-detail-drawer.tsx`
- [ ] `frontend/src/modules/pms/features/tasks/components/task-activity.tsx`
- [ ] `frontend/src/modules/pms/features/tasks/components/recurrence-picker.tsx`
- [ ] `frontend/src/modules/pms/features/goals/pages/goals-list.tsx`
- [ ] `frontend/src/modules/pms/features/goals/components/create-goal-dialog.tsx`
- [ ] `frontend/src/modules/pms/features/goals/components/goal-card.tsx`
- [ ] `frontend/src/modules/pms/features/goals/components/goal-detail-drawer.tsx`
- [ ] `frontend/src/modules/pms/features/goals/components/goal-linked-items.tsx`
- [ ] `frontend/src/modules/pms/features/goals/components/link-projects-dialog.tsx`
- [ ] `frontend/src/modules/pms/features/goals/components/link-tasks-dialog.tsx`
- [ ] `frontend/src/modules/pms/features/custom-fields/components/custom-fields-section.tsx`
- [ ] `frontend/src/modules/pms/features/custom-fields/components/custom-field-renderer.tsx`
- [ ] `frontend/src/modules/pms/features/custom-fields/components/field-config-panel.tsx`
- [ ] `frontend/src/modules/pms/features/custom-fields/components/add-field-dialog.tsx`

### WMS Module
- [ ] `frontend/src/modules/wms/features/shared/components/wms-page-header.tsx`
- [ ] `frontend/src/modules/wms/features/shared/components/wms-pagination.tsx`
- [ ] `frontend/src/modules/wms/features/products/pages/products-list.tsx`
- [ ] `frontend/src/modules/wms/features/products/components/product-form-dialog.tsx`
- [ ] `frontend/src/modules/wms/features/warehouses/pages/warehouses-list.tsx`
- [ ] `frontend/src/modules/wms/features/warehouses/components/warehouse-form-dialog.tsx`
- [ ] `frontend/src/modules/wms/features/devices/pages/devices-list.tsx`
- [ ] `frontend/src/modules/wms/features/devices/components/device-form-dialog.tsx`
- [ ] `frontend/src/modules/wms/features/inventory/pages/inventory-list.tsx`
- [ ] `frontend/src/modules/wms/features/inventory/components/inventory-item-form-dialog.tsx`
- [ ] `frontend/src/modules/wms/features/suppliers/pages/suppliers-list.tsx`
- [ ] `frontend/src/modules/wms/features/suppliers/components/supplier-form-dialog.tsx`

### HRM Module
- [ ] `frontend/src/modules/hrm/features/shared/components/hrm-page-header.tsx`
- [ ] `frontend/src/modules/hrm/features/shared/components/hrm-pagination.tsx`
- [ ] `frontend/src/modules/hrm/features/employees/pages/employees-list.tsx`
- [ ] `frontend/src/modules/hrm/features/employees/components/employee-form-dialog.tsx`
- [ ] `frontend/src/modules/hrm/features/departments/pages/departments-list.tsx`
- [ ] `frontend/src/modules/hrm/features/departments/components/department-form-dialog.tsx`
- [ ] `frontend/src/modules/hrm/features/leave/pages/leave-requests-list.tsx`
- [ ] `frontend/src/modules/hrm/features/leave/components/leave-request-form-dialog.tsx`
- [ ] `frontend/src/modules/hrm/features/leave/components/leave-type-form-dialog.tsx`
- [ ] `frontend/src/modules/hrm/features/payroll/pages/payroll-list.tsx`
- [ ] `frontend/src/modules/hrm/features/payroll/components/payroll-form-dialog.tsx`

### CRM Module
- [ ] `frontend/src/modules/crm/features/shared/components/crm-page-header.tsx`
- [ ] `frontend/src/modules/crm/features/shared/components/crm-pagination.tsx`
- [ ] `frontend/src/modules/crm/features/contacts/pages/contacts-list.tsx`
- [ ] `frontend/src/modules/crm/features/contacts/components/contact-form-dialog.tsx`
- [ ] `frontend/src/modules/crm/features/deals/pages/deals-list.tsx`
- [ ] `frontend/src/modules/crm/features/deals/components/deal-form-dialog.tsx`

### Verification
- [ ] TypeScript compilation passes (`tsc -b`)
- [ ] Dev server runs without console errors
- [ ] All pages render correctly in default language (vi)

## Success Criteria
- Zero hardcoded user-facing English strings remain in components
- All components use `useTranslation()` hook with correct namespace
- TypeScript compiles without errors
- App renders identically to before (in English, since translations match current strings)
- Switching `localStorage['a-erp-language']` to `'vi'` shows Vietnamese strings

## Risk Assessment
- **Zod schema + i18n**: Zod schemas with validation messages must be created inside component scope or use a factory function to access `t()`. This is a minor refactor pattern.
- **Module store strings**: `MODULES` array in `module.store.ts` has hardcoded names. These should NOT be changed in the store -- instead, the rendering components (`module-switcher.tsx`, `sidebar.tsx`) should use `t()` when displaying module info.
- **Large number of files**: ~55 files to modify. Work systematically area by area. Compile-check after each area.

## Security Considerations
- No security impact. Only string rendering changes.
- User input is never used as translation keys (prevents injection).
