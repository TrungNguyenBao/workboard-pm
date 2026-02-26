# Asana Feature Analysis for WorkBoard v1
**Researcher report | 2026-02-25**

## 1. Core Task/Project Entities

**Workspace** - top-level container; users belong to one or more workspaces.
**Team** - sub-group inside a workspace; controls who sees which projects.
**Project** - named collection of tasks; belongs to a team; has a color/icon.
**Section** - named grouping inside a project (e.g. "To Do", "In Progress"); ordered list.
**Task** - primary work unit; lives in one or more projects (multi-homing); fields below.
**Subtask** - task whose parent is another task; can have subtasks (recursive, but UI limits depth).
**Tag** - freeform labels; many-to-many with tasks; workspace-scoped.

### Task fields
- Title (required), Description (rich text)
- Assignee (single user), Followers (multiple users)
- Due date + optional due time; Start date
- Priority: none / low / medium / high
- Section placement (which section within which project)
- Tags (multiple), Attachments (files/links)
- Dependencies: blocked-by / blocking (task-to-task links)

## 2. Views

| View | V1 | Stretch |
|---|---|---|
| List view | YES | - |
| Board (Kanban) | YES | - |
| Calendar view | YES | - |
| Timeline / Gantt | NO | v2 |
| Dashboard / Home | YES (simplified) | full widgets v2 |
| Portfolios | NO | v3 |

**List view**: tasks grouped by section; expandable subtasks; inline editing.
**Board view**: columns = sections; drag cards; card shows assignee, due date, priority badge.
**Calendar view**: tasks placed by due date; click day to create; drag to reschedule.

## 3. Collaboration

- Comments on tasks — threaded; @mentions; timestamped
- Activity feed — system events + user comments in chronological log
- @mentions — notify user in comment; link tasks inline
- Task followers — notify without being assignee
- File attachments — local upload or URL; store name, size, uploader, timestamp
- Reactions on comments — v2 stretch

## 4. Notifications

- In-app notification bell — assigned, mentioned, followed task updated, due soon
- Real-time updates — task changes broadcast live (WebSocket/SSE)
- Email on mention — immediate when @mentioned
- Due-date reminders — notify assignee 1 day before (configurable)
- Email digest — v2 stretch

## 5. Team & Workspace Management

- Workspace: owner + admins
- Team: members; project access defaults to team members
- Roles: Admin / Member / Guest (limited to explicit projects)
- Invitations: email invite + token-based join link

## 6. RBAC — Project-Level

| Role | See | Add/Edit | Manage Sections | Settings | Add Members |
|---|---|---|---|---|---|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓ | ✗ | ✗ |
| Commenter | ✓ | Comment only | ✗ | ✗ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ | ✗ |

Project visibility: Private / Team / Public (workspace).

## 7. My Tasks / Dashboard

- My Tasks — assigned to me, grouped: Overdue / Today / Upcoming / Later
- Recently assigned — newly assigned, not yet triaged
- Upcoming deadlines widget — next 7 days
- Project progress — % complete per project
- Full customizable widget dashboard — v2

## 8. Search & Filtering

- Global search — full-text: titles, descriptions, comments
- Filters: assignee, project, section, tag, due date range, status, priority
- Project filter bar — filter current view
- Sort (list view): due date, assignee, priority, created date
- Saved filters — v2

## 9. Keyboard Shortcuts & Quick-Add

- Global quick-add task from anywhere
- Enter on row → open task detail
- Ctrl+Z — undo (limited: delete, complete)
- ? — shortcuts overlay
- Inline "+ Add task" per section (no modal needed)

## 10. Data Model

```
Workspace
  └── Team
        └── Project
              └── Section (ordered)
                    └── Task
                          ├── Subtask (recursive, parent_id)
                          ├── Comment (@mentions)
                          ├── Attachment
                          └── Tag (M:M)
User
  ├── WorkspaceMembership (admin/member/guest)
  ├── ProjectMembership (owner/editor/commenter/viewer)
  └── Notification (event, read/unread, entity ref)
Task ──dependency──► Task (blocked_by/blocking)
```

Notes:
- Tasks: single project for v1 (skip multi-homing complexity)
- Priority: hardcoded enum (none/low/medium/high)
- Soft delete: `deleted_at` timestamp
- `position` float on Task/Section for drag-drop reordering

## V1 Scope

**Must ship:** List view, Board view, Calendar view, My Tasks, Global search+filter, Task CRUD + subtasks, Comments + @mentions, Followers, File attachments, In-app notifications, Real-time (SSE/WS), Workspace + Team mgmt, RBAC, Keyboard shortcuts, Tags, Due dates, Assignee, Priority.

**V2:** Timeline/Gantt, Full dashboard widgets, Saved filters, Email digest, Custom fields.

**V3+:** Automations, Goals, Workload view, Time tracking.

## Unresolved Questions

1. Single-project tasks (simpler) vs multi-homing — recommend single for v1
2. Rich text descriptions: Tiptap WYSIWYG or Markdown-only?
3. File storage: local disk / MinIO vs S3/Cloudinary?
4. Email service for mentions: Resend vs SendGrid vs Postmark?
5. Subtask depth: enforce max 3 levels?
6. Single workspace per instance or multi-tenant?
