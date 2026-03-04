# Phase 2: Create Translation JSON Files

## Context Links
- [plan.md](./plan.md)
- [Phase 1: Install + Configure](./phase-01-install-configure-i18next.md)

## Overview
- **Priority**: P1 (blocks Phase 3)
- **Status**: completed
- **Description**: Create all 10 translation JSON files (5 namespaces x 2 languages) with every user-facing string extracted from the codebase.

## Key Insights
- All hardcoded strings catalogued from full codebase scan
- Flat key structure preferred over deep nesting (simpler autocomplete, easier grep)
- Keys use dot-separated sections: `section.element` e.g. `sidebar.myTasks`, `auth.signIn`
- Vietnamese is primary, English is secondary. Both files have identical key sets.

## Files to Create

### `frontend/src/i18n/locales/vi/common.json`

Covers: auth, sidebar, header, settings, workspace, members, notifications, command palette, keyboard shortcuts, shared UI patterns.

```json
{
  "app.loading": "Dang tai...",
  "app.name": "WorkBoard",

  "auth.welcomeBack": "Chao mung tro lai",
  "auth.signInDescription": "Dang nhap vao tai khoan WorkBoard cua ban",
  "auth.email": "Email",
  "auth.password": "Mat khau",
  "auth.emailPlaceholder": "you@example.com",
  "auth.passwordPlaceholder": "Nhap mat khau cua ban",
  "auth.signIn": "Dang nhap",
  "auth.signingIn": "Dang dang nhap...",
  "auth.loginFailed": "Dang nhap that bai",
  "auth.pleaseTryAgain": "Vui long thu lai",
  "auth.dontHaveAccount": "Chua co tai khoan?",
  "auth.signUp": "Dang ky",
  "auth.createAccount": "Tao tai khoan",
  "auth.createAccountDescription": "Bat dau quan ly du an voi WorkBoard",
  "auth.fullName": "Ho va ten",
  "auth.fullNamePlaceholder": "Nguyen Van A",
  "auth.passwordMinLength": "Mat khau it nhat 8 ky tu",
  "auth.creatingAccount": "Dang tao tai khoan...",
  "auth.registrationFailed": "Dang ky that bai",
  "auth.alreadyHaveAccount": "Da co tai khoan?",
  "auth.nameRequired": "Yeu cau nhap ten",
  "auth.invalidEmail": "Email khong hop le",
  "auth.passwordRequired": "Yeu cau nhap mat khau",
  "auth.showPassword": "Hien mat khau",
  "auth.hidePassword": "An mat khau",

  "auth.branding.tagline": "Noi nhom bien ke hoach\nthanh tien do.",
  "auth.branding.subtitle": "Nen tang quan ly du an giup moi nguoi dong bo, tu y tuong ban dau den san pham cuoi cung.",
  "auth.branding.feature1": "To chuc du an voi bang, danh sach va dong thoi gian",
  "auth.branding.feature2": "Cong tac voi nhom theo thoi gian thuc",
  "auth.branding.feature3": "Tu dong hoa quy trinh va theo doi tien do",
  "auth.branding.feature4": "Theo doi tien trinh tu y tuong den hoan thanh",
  "auth.branding.copyright": "WorkBoard. Moi quyen duoc bao luu.",

  "sidebar.noWorkspace": "Khong co khong gian lam viec",
  "sidebar.noWorkspaceYet": "Chua co khong gian lam viec",
  "sidebar.createWorkspace": "Tao khong gian lam viec",
  "sidebar.newWorkspace": "Tao moi",
  "sidebar.renameWorkspace": "Doi ten khong gian lam viec",
  "sidebar.projects": "Du an",
  "sidebar.newProject": "Du an moi",
  "sidebar.inviteMembers": "Moi thanh vien",
  "sidebar.settings": "Cai dat",
  "sidebar.logOut": "Dang xuat",
  "sidebar.profileSettings": "Cai dat ho so",

  "nav.myTasks": "Nhiem vu cua toi",
  "nav.goals": "Muc tieu",
  "nav.members": "Thanh vien",
  "nav.employees": "Nhan vien",
  "nav.departments": "Phong ban",
  "nav.leave": "Nghi phep",
  "nav.payroll": "Bang luong",
  "nav.contacts": "Lien he",
  "nav.deals": "Giao dich",
  "nav.products": "San pham",
  "nav.warehouses": "Kho",
  "nav.devices": "Thiet bi",
  "nav.inventory": "Ton kho",
  "nav.suppliers": "Nha cung cap",

  "module.pms": "Du an",
  "module.pms.description": "Quan ly du an",
  "module.wms": "Kho",
  "module.wms.description": "Quan ly kho",
  "module.hrm": "Nhan su",
  "module.hrm.description": "Quan ly nhan su",
  "module.crm": "Ban hang",
  "module.crm.description": "Quan ly khach hang",

  "workspace.create": "Tao khong gian lam viec",
  "workspace.name": "Ten khong gian lam viec",
  "workspace.namePlaceholder": "Cong ty ABC",
  "workspace.slug": "Duong dan URL",
  "workspace.slugHint": "(chu cai, so, gach noi)",
  "workspace.creating": "Dang tao...",
  "workspace.created": "Khong gian lam viec \"{{name}}\" da duoc tao",
  "workspace.createFailed": "Tao khong gian lam viec that bai",

  "members.title": "Thanh vien",
  "members.count": "{{count}} thanh vien",
  "members.invite": "Moi",
  "members.loading": "Dang tai...",
  "members.removeConfirm": "Xoa {{name}} khoi khong gian lam viec nay?",
  "members.removeMember": "Xoa thanh vien",
  "members.role.admin": "Quan tri",
  "members.role.member": "Thanh vien",
  "members.role.guest": "Khach",

  "settings.title": "Cai dat",
  "settings.name": "Ten",
  "settings.avatarUrl": "URL anh dai dien",
  "settings.email": "Email",
  "settings.changePassword": "Doi mat khau",
  "settings.currentPassword": "Mat khau hien tai",
  "settings.newPassword": "Mat khau moi",
  "settings.save": "Luu thay doi",
  "settings.saving": "Dang luu...",
  "settings.saved": "Da luu",
  "settings.saveFailed": "Luu that bai",

  "notifications.title": "Thong bao",
  "notifications.markAllRead": "Danh dau tat ca da doc",
  "notifications.empty": "Khong co thong bao",

  "search.placeholder": "Tim kiem nhiem vu, du an...",
  "search.searching": "Dang tim...",
  "search.noResults": "Khong tim thay ket qua",
  "search.tasks": "Nhiem vu",
  "search.projects": "Du an",
  "search.navigation": "Dieu huong",

  "shortcuts.title": "Phim tat",
  "shortcuts.navigation": "Dieu huong",
  "shortcuts.goToMyTasks": "Di den Nhiem vu cua toi",
  "shortcuts.goToBoard": "Di den che do Bang",
  "shortcuts.goToList": "Di den che do Danh sach",
  "shortcuts.tasks": "Nhiem vu",
  "shortcuts.newTask": "Nhiem vu moi (trong muc dang chon)",
  "shortcuts.openSelected": "Mo nhiem vu da chon",
  "shortcuts.deleteSelected": "Xoa nhiem vu da chon",
  "shortcuts.searchHelp": "Tim kiem & Tro giup",
  "shortcuts.openCommandPalette": "Mo bang lenh",
  "shortcuts.showShortcuts": "Hien phim tat",
  "shortcuts.closeDialog": "Dong hop thoai / huy",

  "common.cancel": "Huy",
  "common.save": "Luu",
  "common.delete": "Xoa",
  "common.rename": "Doi ten",
  "common.settings": "Cai dat",
  "common.create": "Tao",
  "common.search": "Tim kiem",
  "common.filter": "Loc",
  "common.clear": "Xoa bo",
  "common.loading": "Dang tai...",
  "common.yes": "Co",
  "common.no": "Khong",
  "common.active": "Hoat dong",
  "common.inactive": "Khong hoat dong",
  "common.all": "Tat ca",
  "common.actions": "",
  "common.name": "Ten",
  "common.email": "Email",
  "common.phone": "Dien thoai",
  "common.description": "Mo ta",
  "common.status": "Trang thai",
  "common.page": "Trang {{page}} / {{total}}",
  "common.items": "{{count}} muc",
  "common.deleteConfirm": "Xoa \"{{name}}\"?",
  "common.deleteConfirmFull": "Xoa \"{{name}}\"? Hanh dong nay khong the hoan tac.",

  "language.label": "Ngon ngu",
  "language.vi": "Tieng Viet",
  "language.en": "English"
}
```

### `frontend/src/i18n/locales/en/common.json`

```json
{
  "app.loading": "Loading...",
  "app.name": "WorkBoard",

  "auth.welcomeBack": "Welcome back",
  "auth.signInDescription": "Sign in to your WorkBoard account",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.emailPlaceholder": "you@example.com",
  "auth.passwordPlaceholder": "Enter your password",
  "auth.signIn": "Sign in",
  "auth.signingIn": "Signing in...",
  "auth.loginFailed": "Login failed",
  "auth.pleaseTryAgain": "Please try again",
  "auth.dontHaveAccount": "Don't have an account?",
  "auth.signUp": "Sign up",
  "auth.createAccount": "Create account",
  "auth.createAccountDescription": "Start managing your projects with WorkBoard",
  "auth.fullName": "Full name",
  "auth.fullNamePlaceholder": "Jane Smith",
  "auth.passwordMinLength": "Password must be at least 8 characters",
  "auth.creatingAccount": "Creating account...",
  "auth.registrationFailed": "Registration failed",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.nameRequired": "Name required",
  "auth.invalidEmail": "Invalid email",
  "auth.passwordRequired": "Password required",
  "auth.showPassword": "Show password",
  "auth.hidePassword": "Hide password",

  "auth.branding.tagline": "Where teams turn plans\ninto progress.",
  "auth.branding.subtitle": "The project management platform that keeps everyone aligned, from first idea to final delivery.",
  "auth.branding.feature1": "Organize projects with boards, lists & timelines",
  "auth.branding.feature2": "Collaborate with your team in real-time",
  "auth.branding.feature3": "Automate workflows and stay on track",
  "auth.branding.feature4": "Track progress from idea to completion",
  "auth.branding.copyright": "WorkBoard. All rights reserved.",

  "sidebar.noWorkspace": "No workspace",
  "sidebar.noWorkspaceYet": "No workspace yet",
  "sidebar.createWorkspace": "Create workspace",
  "sidebar.newWorkspace": "New workspace",
  "sidebar.renameWorkspace": "Rename workspace",
  "sidebar.projects": "Projects",
  "sidebar.newProject": "New Project",
  "sidebar.inviteMembers": "Invite members",
  "sidebar.settings": "Settings",
  "sidebar.logOut": "Log out",
  "sidebar.profileSettings": "Profile settings",

  "nav.myTasks": "My Tasks",
  "nav.goals": "Goals",
  "nav.members": "Members",
  "nav.employees": "Employees",
  "nav.departments": "Departments",
  "nav.leave": "Leave",
  "nav.payroll": "Payroll",
  "nav.contacts": "Contacts",
  "nav.deals": "Deals",
  "nav.products": "Products",
  "nav.warehouses": "Warehouses",
  "nav.devices": "Devices",
  "nav.inventory": "Inventory",
  "nav.suppliers": "Suppliers",

  "module.pms": "Projects",
  "module.pms.description": "Project Management",
  "module.wms": "Warehouse",
  "module.wms.description": "Warehouse Management",
  "module.hrm": "People",
  "module.hrm.description": "Human Resources",
  "module.crm": "Sales",
  "module.crm.description": "Customer Relations",

  "workspace.create": "Create a workspace",
  "workspace.name": "Workspace name",
  "workspace.namePlaceholder": "Acme Corp",
  "workspace.slug": "URL slug",
  "workspace.slugHint": "(letters, numbers, hyphens)",
  "workspace.creating": "Creating...",
  "workspace.created": "Workspace \"{{name}}\" created",
  "workspace.createFailed": "Failed to create workspace",

  "members.title": "Members",
  "members.count": "{{count}} member(s)",
  "members.invite": "Invite",
  "members.loading": "Loading...",
  "members.removeConfirm": "Remove {{name}} from this workspace?",
  "members.removeMember": "Remove member",
  "members.role.admin": "Admin",
  "members.role.member": "Member",
  "members.role.guest": "Guest",

  "settings.title": "Settings",
  "settings.name": "Name",
  "settings.avatarUrl": "Avatar URL",
  "settings.email": "Email",
  "settings.changePassword": "Change Password",
  "settings.currentPassword": "Current Password",
  "settings.newPassword": "New Password",
  "settings.save": "Save Changes",
  "settings.saving": "Saving...",
  "settings.saved": "Saved",
  "settings.saveFailed": "Failed to save",

  "notifications.title": "Notifications",
  "notifications.markAllRead": "Mark all read",
  "notifications.empty": "No notifications",

  "search.placeholder": "Search tasks, projects...",
  "search.searching": "Searching...",
  "search.noResults": "No results found",
  "search.tasks": "Tasks",
  "search.projects": "Projects",
  "search.navigation": "Navigation",

  "shortcuts.title": "Keyboard Shortcuts",
  "shortcuts.navigation": "Navigation",
  "shortcuts.goToMyTasks": "Go to My Tasks",
  "shortcuts.goToBoard": "Go to Board view",
  "shortcuts.goToList": "Go to List view",
  "shortcuts.tasks": "Tasks",
  "shortcuts.newTask": "New task (in focused section)",
  "shortcuts.openSelected": "Open selected task",
  "shortcuts.deleteSelected": "Delete selected task",
  "shortcuts.searchHelp": "Search & Help",
  "shortcuts.openCommandPalette": "Open command palette",
  "shortcuts.showShortcuts": "Show keyboard shortcuts",
  "shortcuts.closeDialog": "Close dialog / cancel",

  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.rename": "Rename",
  "common.settings": "Settings",
  "common.create": "Create",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.clear": "Clear",
  "common.loading": "Loading...",
  "common.yes": "Yes",
  "common.no": "No",
  "common.active": "Active",
  "common.inactive": "Inactive",
  "common.all": "All",
  "common.actions": "",
  "common.name": "Name",
  "common.email": "Email",
  "common.phone": "Phone",
  "common.description": "Description",
  "common.status": "Status",
  "common.page": "Page {{page}} of {{total}}",
  "common.items": "{{count}} item(s)",
  "common.deleteConfirm": "Delete \"{{name}}\"?",
  "common.deleteConfirmFull": "Delete \"{{name}}\"? This cannot be undone.",

  "language.label": "Language",
  "language.vi": "Tieng Viet",
  "language.en": "English"
}
```

### `frontend/src/i18n/locales/vi/pms.json`

```json
{
  "myTasks.title": "Nhiem vu cua toi",
  "myTasks.allCaughtUp": "Hoan thanh tat ca!",
  "myTasks.overdue": "Qua han",
  "myTasks.today": "Hom nay",
  "myTasks.upcoming": "Sap toi",
  "myTasks.later": "Sau do",

  "project.new": "Du an moi",
  "project.name": "Ten du an",
  "project.namePlaceholder": "Du an cua toi",
  "project.color": "Mau",
  "project.creating": "Dang tao...",
  "project.createProject": "Tao du an",
  "project.created": "Du an \"{{name}}\" da duoc tao",
  "project.createFailed": "Tao du an that bai",
  "project.deleteConfirm": "Xoa \"{{name}}\"? Hanh dong nay khong the hoan tac.",

  "project.views.board": "Bang",
  "project.views.list": "Danh sach",
  "project.views.calendar": "Lich",
  "project.views.timeline": "Dong thoi gian",
  "project.views.overview": "Tong quan",

  "filter.all": "Tat ca",
  "filter.high": "Cao",
  "filter.medium": "Trung binh",
  "filter.low": "Thap",
  "filter.active": "Dang lam",
  "filter.done": "Hoan thanh",
  "filter.clear": "Xoa bo",
  "filter.label": "Loc:",

  "task.newTask": "Nhiem vu moi",
  "task.addTask": "Them nhiem vu",
  "task.title": "Tieu de",
  "task.description": "Mo ta",
  "task.assignee": "Nguoi thuc hien",
  "task.dueDate": "Ngay het han",
  "task.priority": "Do uu tien",
  "task.priority.high": "Cao",
  "task.priority.medium": "Trung binh",
  "task.priority.low": "Thap",
  "task.priority.none": "Khong",
  "task.status.todo": "Can lam",
  "task.status.inProgress": "Dang lam",
  "task.status.completed": "Hoan thanh",
  "task.section": "Phan",
  "task.addSection": "Them phan",
  "task.activity": "Hoat dong",
  "task.noActivity": "Chua co hoat dong",

  "goal.title": "Muc tieu",
  "goal.description": "Theo doi muc tieu va tien trinh cua nhom",
  "goal.new": "Muc tieu moi",
  "goal.noWorkspace": "Chua chon khong gian lam viec. Vui long chon hoac tao khong gian lam viec.",
  "goal.noGoals": "Chua co muc tieu. Tao mot muc tieu de theo doi tien trinh cua nhom.",
  "goal.noGoalsFiltered": "Khong co muc tieu voi trang thai \"{{status}}\".",
  "goal.status.allStatuses": "Tat ca trang thai",
  "goal.status.onTrack": "Dung tien do",
  "goal.status.atRisk": "Co rui ro",
  "goal.status.offTrack": "Lech tien do",
  "goal.status.achieved": "Dat duoc",
  "goal.status.dropped": "Da huy",

  "customField.title": "Truong tuy chinh",
  "customField.addField": "Them truong"
}
```

### `frontend/src/i18n/locales/en/pms.json`

```json
{
  "myTasks.title": "My Tasks",
  "myTasks.allCaughtUp": "All caught up!",
  "myTasks.overdue": "Overdue",
  "myTasks.today": "Today",
  "myTasks.upcoming": "Upcoming",
  "myTasks.later": "Later",

  "project.new": "New project",
  "project.name": "Project name",
  "project.namePlaceholder": "My Project",
  "project.color": "Color",
  "project.creating": "Creating...",
  "project.createProject": "Create project",
  "project.created": "Project \"{{name}}\" created",
  "project.createFailed": "Failed to create project",
  "project.deleteConfirm": "Delete \"{{name}}\"? This cannot be undone.",

  "project.views.board": "Board",
  "project.views.list": "List",
  "project.views.calendar": "Calendar",
  "project.views.timeline": "Timeline",
  "project.views.overview": "Overview",

  "filter.all": "All",
  "filter.high": "High",
  "filter.medium": "Medium",
  "filter.low": "Low",
  "filter.active": "Active",
  "filter.done": "Done",
  "filter.clear": "Clear",
  "filter.label": "Filter:",

  "task.newTask": "New task",
  "task.addTask": "Add task",
  "task.title": "Title",
  "task.description": "Description",
  "task.assignee": "Assignee",
  "task.dueDate": "Due date",
  "task.priority": "Priority",
  "task.priority.high": "High",
  "task.priority.medium": "Medium",
  "task.priority.low": "Low",
  "task.priority.none": "None",
  "task.status.todo": "To Do",
  "task.status.inProgress": "In Progress",
  "task.status.completed": "Completed",
  "task.section": "Section",
  "task.addSection": "Add section",
  "task.activity": "Activity",
  "task.noActivity": "No activity yet",

  "goal.title": "Goals",
  "goal.description": "Track your team's objectives and progress",
  "goal.new": "New goal",
  "goal.noWorkspace": "No workspace selected. Please select or create a workspace first.",
  "goal.noGoals": "No goals yet. Create one to track your team's progress.",
  "goal.noGoalsFiltered": "No goals with status \"{{status}}\".",
  "goal.status.allStatuses": "All statuses",
  "goal.status.onTrack": "On Track",
  "goal.status.atRisk": "At Risk",
  "goal.status.offTrack": "Off Track",
  "goal.status.achieved": "Achieved",
  "goal.status.dropped": "Dropped",

  "customField.title": "Custom Fields",
  "customField.addField": "Add field"
}
```

### `frontend/src/i18n/locales/vi/wms.json`

```json
{
  "products.title": "San pham",
  "products.description": "Quan ly danh muc san pham",
  "products.new": "San pham moi",
  "products.edit": "Chinh sua san pham",
  "products.created": "San pham da duoc tao",
  "products.updated": "San pham da duoc cap nhat",
  "products.deleted": "San pham da duoc xoa",
  "products.createFailed": "Tao san pham that bai",
  "products.updateFailed": "Cap nhat san pham that bai",
  "products.empty": "Chua co san pham",
  "products.name": "Ten",
  "products.sku": "Ma SKU",
  "products.category": "Danh muc",
  "products.unit": "Don vi",
  "products.serialTracked": "Theo doi so seri",
  "products.allCategories": "Tat ca danh muc",
  "products.equipment": "Thiet bi",
  "products.accessory": "Phu kien",
  "products.saveChanges": "Luu thay doi",
  "products.createProduct": "Tao san pham",
  "products.saving": "Dang luu...",

  "warehouses.title": "Kho",
  "warehouses.description": "Quan ly vi tri kho hang",
  "warehouses.new": "Kho moi",
  "warehouses.empty": "Chua co kho",
  "warehouses.deleted": "Kho da duoc xoa",

  "devices.title": "Thiet bi",
  "devices.description": "Quan ly thiet bi va may moc",
  "devices.new": "Thiet bi moi",
  "devices.empty": "Chua co thiet bi",
  "devices.deleted": "Thiet bi da duoc xoa",

  "inventory.title": "Ton kho",
  "inventory.description": "Theo doi ton kho",
  "inventory.new": "Muc ton kho moi",
  "inventory.empty": "Chua co ton kho",

  "suppliers.title": "Nha cung cap",
  "suppliers.description": "Quan ly nha cung cap",
  "suppliers.new": "Nha cung cap moi",
  "suppliers.empty": "Chua co nha cung cap",
  "suppliers.deleted": "Nha cung cap da duoc xoa"
}
```

### `frontend/src/i18n/locales/en/wms.json`

```json
{
  "products.title": "Products",
  "products.description": "Manage product catalog",
  "products.new": "New product",
  "products.edit": "Edit product",
  "products.created": "Product created",
  "products.updated": "Product updated",
  "products.deleted": "Product deleted",
  "products.createFailed": "Failed to create product",
  "products.updateFailed": "Failed to update product",
  "products.empty": "No products yet",
  "products.name": "Name",
  "products.sku": "SKU",
  "products.category": "Category",
  "products.unit": "Unit",
  "products.serialTracked": "Serial number tracked",
  "products.allCategories": "All categories",
  "products.equipment": "Equipment",
  "products.accessory": "Accessory",
  "products.saveChanges": "Save changes",
  "products.createProduct": "Create product",
  "products.saving": "Saving...",

  "warehouses.title": "Warehouses",
  "warehouses.description": "Manage warehouse locations",
  "warehouses.new": "New warehouse",
  "warehouses.empty": "No warehouses yet",
  "warehouses.deleted": "Warehouse deleted",

  "devices.title": "Devices",
  "devices.description": "Manage devices and equipment",
  "devices.new": "New device",
  "devices.empty": "No devices yet",
  "devices.deleted": "Device deleted",

  "inventory.title": "Inventory",
  "inventory.description": "Track inventory levels",
  "inventory.new": "New inventory item",
  "inventory.empty": "No inventory yet",

  "suppliers.title": "Suppliers",
  "suppliers.description": "Manage suppliers",
  "suppliers.new": "New supplier",
  "suppliers.empty": "No suppliers yet",
  "suppliers.deleted": "Supplier deleted"
}
```

### `frontend/src/i18n/locales/vi/hrm.json`

```json
{
  "employees.title": "Nhan vien",
  "employees.description": "Quan ly nhan su va nhan vien",
  "employees.new": "Nhan vien moi",
  "employees.empty": "Chua co nhan vien",
  "employees.deleted": "Nhan vien da duoc xoa",
  "employees.name": "Ten",
  "employees.email": "Email",
  "employees.position": "Chuc vu",
  "employees.hireDate": "Ngay tuyen dung",

  "departments.title": "Phong ban",
  "departments.description": "Quan ly phong ban",
  "departments.new": "Phong ban moi",
  "departments.empty": "Chua co phong ban",
  "departments.deleted": "Phong ban da duoc xoa",

  "leave.title": "Nghi phep",
  "leave.description": "Quan ly yeu cau nghi phep",
  "leave.new": "Yeu cau nghi phep moi",
  "leave.empty": "Chua co yeu cau nghi phep",

  "payroll.title": "Bang luong",
  "payroll.description": "Quan ly bang luong",
  "payroll.new": "Bang luong moi",
  "payroll.empty": "Chua co bang luong"
}
```

### `frontend/src/i18n/locales/en/hrm.json`

```json
{
  "employees.title": "Employees",
  "employees.description": "Manage workforce and personnel",
  "employees.new": "New employee",
  "employees.empty": "No employees yet",
  "employees.deleted": "Employee deleted",
  "employees.name": "Name",
  "employees.email": "Email",
  "employees.position": "Position",
  "employees.hireDate": "Hire Date",

  "departments.title": "Departments",
  "departments.description": "Manage departments",
  "departments.new": "New department",
  "departments.empty": "No departments yet",
  "departments.deleted": "Department deleted",

  "leave.title": "Leave",
  "leave.description": "Manage leave requests",
  "leave.new": "New leave request",
  "leave.empty": "No leave requests yet",

  "payroll.title": "Payroll",
  "payroll.description": "Manage payroll",
  "payroll.new": "New payroll",
  "payroll.empty": "No payroll records yet"
}
```

### `frontend/src/i18n/locales/vi/crm.json`

```json
{
  "contacts.title": "Lien he",
  "contacts.description": "Quan ly khach hang va doi tac",
  "contacts.new": "Lien he moi",
  "contacts.empty": "Chua co lien he",
  "contacts.deleted": "Lien he da duoc xoa",
  "contacts.name": "Ten",
  "contacts.email": "Email",
  "contacts.phone": "Dien thoai",
  "contacts.company": "Cong ty",

  "deals.title": "Giao dich",
  "deals.description": "Theo doi quy trinh ban hang va tien do giao dich",
  "deals.new": "Giao dich moi",
  "deals.empty": "Chua co giao dich",
  "deals.deleted": "Giao dich da duoc xoa",
  "deals.titleLabel": "Tieu de",
  "deals.value": "Gia tri",
  "deals.stage": "Giai doan",
  "deals.contact": "Lien he",
  "deals.allStages": "Tat ca giai doan",
  "deals.stage.lead": "Tiep can",
  "deals.stage.qualified": "Du dieu kien",
  "deals.stage.proposal": "De xuat",
  "deals.stage.negotiation": "Dam phan",
  "deals.stage.closedWon": "Thanh cong",
  "deals.stage.closedLost": "That bai"
}
```

### `frontend/src/i18n/locales/en/crm.json`

```json
{
  "contacts.title": "Contacts",
  "contacts.description": "Manage customers and business contacts",
  "contacts.new": "New contact",
  "contacts.empty": "No contacts yet",
  "contacts.deleted": "Contact deleted",
  "contacts.name": "Name",
  "contacts.email": "Email",
  "contacts.phone": "Phone",
  "contacts.company": "Company",

  "deals.title": "Deals",
  "deals.description": "Track sales pipeline and deal progress",
  "deals.new": "New deal",
  "deals.empty": "No deals yet",
  "deals.deleted": "Deal deleted",
  "deals.titleLabel": "Title",
  "deals.value": "Value",
  "deals.stage": "Stage",
  "deals.contact": "Contact",
  "deals.allStages": "All stages",
  "deals.stage.lead": "Lead",
  "deals.stage.qualified": "Qualified",
  "deals.stage.proposal": "Proposal",
  "deals.stage.negotiation": "Negotiation",
  "deals.stage.closedWon": "Closed Won",
  "deals.stage.closedLost": "Closed Lost"
}
```

## Implementation Steps

1. Create directory structure: `frontend/src/i18n/locales/{vi,en}/`
2. Create all 10 JSON files with content above
3. Verify all JSON files are valid (no trailing commas, proper escaping)
4. Run `tsc -b` to verify TypeScript can resolve JSON imports

## Todo List

- [ ] Create `frontend/src/i18n/locales/vi/common.json`
- [ ] Create `frontend/src/i18n/locales/en/common.json`
- [ ] Create `frontend/src/i18n/locales/vi/pms.json`
- [ ] Create `frontend/src/i18n/locales/en/pms.json`
- [ ] Create `frontend/src/i18n/locales/vi/wms.json`
- [ ] Create `frontend/src/i18n/locales/en/wms.json`
- [ ] Create `frontend/src/i18n/locales/vi/hrm.json`
- [ ] Create `frontend/src/i18n/locales/en/hrm.json`
- [ ] Create `frontend/src/i18n/locales/vi/crm.json`
- [ ] Create `frontend/src/i18n/locales/en/crm.json`
- [ ] Validate all JSON syntax
- [ ] Verify TypeScript compilation passes

## Success Criteria
- All 10 JSON files exist with matching key sets (vi and en have same keys)
- JSON is valid and parseable
- TypeScript imports compile without errors
- Keys cover every hardcoded string identified in the codebase

## Risk Assessment
- **Missing strings**: Strings may be missed during initial extraction. Phase 3 will catch these during integration. Add keys as needed.
- **Vietnamese accuracy**: Vietnamese translations should be reviewed by a native speaker after initial implementation. The diacritics-free versions above are placeholders -- real Vietnamese with diacritics (e.g., "Xin chao" -> "Xin chao") should be applied.

## Security Considerations
- Translation files contain no sensitive data
- No user input is stored in translation files
