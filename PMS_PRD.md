# PRD – HỆ THỐNG QUẢN LÝ DỰ ÁN (PMS)

## 1. Tổng quan sản phẩm

### 1.1 Tên sản phẩm

Hệ thống Quản lý Dự án (Project Management System — PMS)

### 1.2 Mục tiêu sản phẩm

- Quản lý toàn bộ vòng đời dự án từ lập kế hoạch đến hoàn thành
- Hỗ trợ cả phương pháp Agile (sprint, backlog, velocity) và truyền thống (kanban, list)
- Tăng năng suất nhóm 40-60% qua task automation và real-time collaboration
- Theo dõi tiến độ mục tiêu (Goals) liên kết với dự án và task
- Sẵn sàng tích hợp AI Agent và MCP protocol

### 1.3 Implementation Status

**FULLY IMPLEMENTED** - All core project management functions and 16 data models are production-ready.

---

# 2. Phạm vi hệ thống

Hệ thống bao gồm 4 nhóm chính:

1. **Project & Task Management** - Projects, sections, tasks, subtasks, dependencies, drag-drop ordering
2. **Agile Tools** - Sprints, epics, story points, backlog, burndown charts, velocity tracking
3. **Goals & OKR** - Workspace-level goals linked to projects and tasks with auto-calculated progress
4. **Collaboration** - Comments (rich-text), attachments, activity logs, tags, task followers, custom fields

---

# 3. Vai trò người dùng

| Vai trò           | Quyền                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Workspace Admin   | Full access to all projects in workspace; manage members, tags, goals              |
| Project Owner     | Full CRUD on project, sections, tasks; manage memberships and custom fields        |
| Editor            | Create/edit/delete tasks and comments; manage sections                             |
| Commenter         | View tasks; add comments only; cannot edit tasks                                   |
| Viewer            | Read-only access to project content; cannot create or modify anything              |

---

# 4. Core Data Models (16 Implemented)

## 4.1 Project

**Mô tả**: Master record for a project within a workspace.

| Field        | Type    | Description                          |
| ------------ | ------- | ------------------------------------ |
| id           | UUID    | Project ID                           |
| workspace_id | UUID    | Workspace                            |
| team_id      | UUID    | Team (optional)                      |
| owner_id     | UUID    | Project owner                        |
| name         | String  | Tên dự án                            |
| description  | String  | Mô tả dự án                          |
| color        | String  | Màu sắc (#hex)                       |
| icon         | String  | Icon (optional)                      |
| visibility   | Enum    | team, private, public                |
| is_archived  | Boolean | Lưu trữ                              |
| project_type | Enum    | kanban, list, board                  |

---

## 4.2 ProjectMembership

**Mô tả**: Role-based membership of users within a project.

| Field      | Type | Description                          |
| ---------- | ---- | ------------------------------------ |
| id         | UUID | Membership ID                        |
| project_id | UUID | Project                              |
| user_id    | UUID | Member                               |
| role       | Enum | owner, editor, commenter, viewer     |

---

## 4.3 Section

**Mô tả**: Columns or groupings within a project (e.g., Kanban columns).

| Field      | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| id         | UUID    | Section ID                           |
| project_id | UUID    | Project                              |
| name       | String  | Tên cột/nhóm                         |
| color      | String  | Màu sắc                              |
| position   | Float   | Vị trí (fractional indexing)         |
| wip_limit  | Integer | Giới hạn WIP                         |

---

## 4.4 Task

**Mô tả**: Core work item with full agile and recurring task support.

| Field                 | Type     | Description                          |
| --------------------- | -------- | ------------------------------------ |
| id                    | UUID     | Task ID                              |
| project_id            | UUID     | Project                              |
| section_id            | UUID     | Section (optional)                   |
| assignee_id           | UUID     | Người được giao                      |
| created_by_id         | UUID     | Người tạo                            |
| parent_id             | UUID     | Parent task (subtasks)               |
| title                 | String   | Tiêu đề task                         |
| description           | Text     | Mô tả chi tiết                       |
| status                | Enum     | incomplete, complete                 |
| priority              | Enum     | none, low, medium, high, urgent      |
| position              | Float    | Vị trí (fractional indexing)         |
| start_date            | DateTime | Ngày bắt đầu                         |
| due_date              | DateTime | Ngày hết hạn                         |
| completed_at          | DateTime | Ngày hoàn thành                      |
| recurrence_rule       | String   | Quy tắc lặp lại                      |
| recurrence_cron_expr  | String   | Cron expression                      |
| recurrence_end_date   | DateTime | Ngày kết thúc lặp                    |
| parent_recurring_id   | UUID     | Parent recurring task                |
| last_generated_date   | DateTime | Ngày tạo task lặp cuối               |
| search_vector         | TSVECTOR | Full-text search                     |
| custom_fields         | JSONB    | Trường tùy chỉnh                     |
| sprint_id             | UUID     | Sprint (agile)                       |
| epic_id               | UUID     | Epic parent                          |
| story_points          | Integer  | Điểm story (agile)                   |
| task_type             | Enum     | task, bug, story, epic               |

---

## 4.5 TaskDependency

**Mô tả**: Blocking relationships between tasks.

| Field           | Type | Description      |
| --------------- | ---- | ---------------- |
| id              | UUID | Dependency ID    |
| blocking_task_id| UUID | Task chặn        |
| blocked_task_id | UUID | Task bị chặn     |

---

## 4.6 TaskTag

**Mô tả**: Join table linking tasks to tags (many-to-many).

| Field   | Type | Description |
| ------- | ---- | ----------- |
| task_id | UUID | Task        |
| tag_id  | UUID | Tag         |

---

## 4.7 TaskFollower

**Mô tả**: Join table for users following a task for notifications.

| Field   | Type | Description |
| ------- | ---- | ----------- |
| task_id | UUID | Task        |
| user_id | UUID | Follower    |

---

## 4.8 Sprint

**Mô tả**: Time-boxed agile sprint within a project.

| Field          | Type     | Description                       |
| -------------- | -------- | --------------------------------- |
| id             | UUID     | Sprint ID                         |
| project_id     | UUID     | Project                           |
| name           | String   | Tên sprint                        |
| goal           | Text     | Mục tiêu sprint                   |
| start_date     | DateTime | Ngày bắt đầu                      |
| end_date       | DateTime | Ngày kết thúc                     |
| status         | Enum     | planning, active, completed       |
| created_by_id  | UUID     | Người tạo                         |

---

## 4.9 Goal

**Mô tả**: Workspace-level objectives with progress tracking (OKR-style).

| Field               | Type     | Description                                 |
| ------------------- | -------- | ------------------------------------------- |
| id                  | UUID     | Goal ID                                     |
| workspace_id        | UUID     | Workspace                                   |
| owner_id            | UUID     | Người sở hữu                                |
| title               | String   | Tiêu đề mục tiêu                            |
| description         | Text     | Mô tả                                       |
| status              | Enum     | on_track, at_risk, off_track, achieved      |
| progress_value      | Float    | Tiến độ (0-100)                             |
| calculation_method  | Enum     | manual, automatic                           |
| color               | String   | Màu sắc                                     |
| due_date            | DateTime | Ngày hết hạn                                |

---

## 4.10 GoalProjectLink

**Mô tả**: Join table linking goals to contributing projects.

| Field      | Type | Description |
| ---------- | ---- | ----------- |
| goal_id    | UUID | Goal        |
| project_id | UUID | Project     |

---

## 4.11 GoalTaskLink

**Mô tả**: Join table linking goals to contributing tasks.

| Field   | Type | Description |
| ------- | ---- | ----------- |
| goal_id | UUID | Goal        |
| task_id | UUID | Task        |

---

## 4.12 CustomFieldDefinition

**Mô tả**: Project-specific custom field definitions.

| Field        | Type    | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| id           | UUID    | Field definition ID                                |
| project_id   | UUID    | Project                                            |
| created_by_id| UUID    | Người tạo                                          |
| name         | String  | Tên trường                                         |
| field_type   | Enum    | text, number, date, select, multi_select, checkbox |
| required     | Boolean | Bắt buộc                                           |
| description  | String  | Mô tả                                              |
| options      | JSONB   | Tùy chọn (cho select/multi_select)                 |
| position     | Float   | Vị trí hiển thị                                    |

---

## 4.13 Comment

**Mô tả**: Rich-text comments on tasks (Tiptap editor).

| Field     | Type | Description                             |
| --------- | ---- | --------------------------------------- |
| id        | UUID | Comment ID                              |
| task_id   | UUID | Task                                    |
| author_id | UUID | Tác giả                                 |
| body      | Text | Nội dung (rich-text HTML/JSON Tiptap)   |
| body_text | Text | Plain text (for search)                 |

---

## 4.14 Attachment

**Mô tả**: File attachments on tasks.

| Field          | Type    | Description            |
| -------------- | ------- | ---------------------- |
| id             | UUID    | Attachment ID          |
| task_id        | UUID    | Task                   |
| uploaded_by_id | UUID    | Người tải lên          |
| filename       | String  | Tên file               |
| storage_path   | String  | Đường dẫn lưu trữ      |
| mime_type      | String  | MIME type              |
| size_bytes     | Integer | Kích thước (bytes)     |

---

## 4.15 ActivityLog

**Mô tả**: Audit trail for all changes in projects and tasks.

| Field       | Type   | Description            |
| ----------- | ------ | ---------------------- |
| id          | UUID   | Log ID                 |
| workspace_id| UUID   | Workspace              |
| project_id  | UUID   | Project (optional)     |
| entity_type | String | Loại thực thể          |
| entity_id   | UUID   | ID thực thể            |
| actor_id    | UUID   | Người thực hiện        |
| action      | String | Hành động              |
| changes     | JSONB  | Chi tiết thay đổi      |

---

## 4.16 Tag

**Mô tả**: Workspace-level labels for categorizing tasks.

| Field        | Type   | Description  |
| ------------ | ------ | ------------ |
| id           | UUID   | Tag ID       |
| workspace_id | UUID   | Workspace    |
| name         | String | Tên tag      |
| color        | String | Màu sắc      |

---

# 5. API Endpoints

## Project Management

```
POST   /api/v1/pms/workspaces/{workspace_id}/projects       # Create project
GET    /api/v1/pms/workspaces/{workspace_id}/projects       # List projects
GET    /api/v1/pms/projects/{project_id}                    # Get detail
PATCH  /api/v1/pms/projects/{project_id}                    # Update project
DELETE /api/v1/pms/projects/{project_id}                    # Delete project
GET    /api/v1/pms/projects/{project_id}/stats              # Project statistics
```

## Section Management

```
GET    /api/v1/pms/projects/{project_id}/sections           # List sections
POST   /api/v1/pms/projects/{project_id}/sections           # Create section
PATCH  /api/v1/pms/projects/{project_id}/sections/{id}      # Update section
DELETE /api/v1/pms/projects/{project_id}/sections/{id}      # Delete section
```

## Task Management

```
POST   /api/v1/pms/projects/{project_id}/tasks              # Create task
GET    /api/v1/pms/projects/{project_id}/tasks              # List tasks
GET    /api/v1/pms/projects/{project_id}/tasks/search       # Full-text search
GET    /api/v1/pms/projects/{project_id}/tasks/{id}         # Get task
PATCH  /api/v1/pms/projects/{project_id}/tasks/{id}         # Update task
DELETE /api/v1/pms/projects/{project_id}/tasks/{id}         # Delete task
PATCH  /api/v1/pms/projects/{project_id}/tasks/{id}/move    # Move/reorder task
GET    /api/v1/pms/projects/{project_id}/tasks/{id}/tags    # Get task tags
POST   /api/v1/pms/projects/{project_id}/tasks/{id}/tags/{tag_id}    # Add tag
DELETE /api/v1/pms/projects/{project_id}/tasks/{id}/tags/{tag_id}    # Remove tag
POST   /api/v1/pms/projects/{project_id}/tasks/{id}/followers        # Follow task
DELETE /api/v1/pms/projects/{project_id}/tasks/{id}/followers        # Unfollow task
```

## Sprint Management

```
POST   /api/v1/pms/projects/{project_id}/sprints            # Create sprint
GET    /api/v1/pms/projects/{project_id}/sprints            # List sprints
GET    /api/v1/pms/projects/{project_id}/sprints/{id}       # Get sprint
PATCH  /api/v1/pms/projects/{project_id}/sprints/{id}       # Update sprint
DELETE /api/v1/pms/projects/{project_id}/sprints/{id}       # Delete sprint
POST   /api/v1/pms/projects/{project_id}/sprints/{id}/start     # Start sprint
POST   /api/v1/pms/projects/{project_id}/sprints/{id}/complete  # Complete sprint
GET    /api/v1/pms/projects/{project_id}/sprints/{id}/board     # Sprint board
GET    /api/v1/pms/projects/{project_id}/backlog                # Backlog items
GET    /api/v1/pms/projects/{project_id}/sprints/{id}/burndown  # Burndown chart
GET    /api/v1/pms/projects/{project_id}/velocity               # Velocity chart
```

## Goal Management

```
POST   /api/v1/pms/workspaces/{workspace_id}/goals              # Create goal
GET    /api/v1/pms/workspaces/{workspace_id}/goals              # List goals
GET    /api/v1/pms/workspaces/{workspace_id}/goals/{id}         # Get goal
PATCH  /api/v1/pms/workspaces/{workspace_id}/goals/{id}         # Update goal
DELETE /api/v1/pms/workspaces/{workspace_id}/goals/{id}         # Delete goal
POST   /api/v1/pms/workspaces/{workspace_id}/goals/{id}/projects         # Link project
DELETE /api/v1/pms/workspaces/{workspace_id}/goals/{id}/projects/{pid}   # Unlink project
POST   /api/v1/pms/workspaces/{workspace_id}/goals/{id}/tasks            # Link task
DELETE /api/v1/pms/workspaces/{workspace_id}/goals/{id}/tasks/{tid}      # Unlink task
GET    /api/v1/pms/workspaces/{workspace_id}/goals/{id}/projects         # List linked projects
GET    /api/v1/pms/workspaces/{workspace_id}/goals/{id}/tasks            # List linked tasks
```

## Comment Management

```
POST   /api/v1/pms/projects/{project_id}/tasks/{task_id}/comments        # Create comment
GET    /api/v1/pms/projects/{project_id}/tasks/{task_id}/comments        # List comments
PATCH  /api/v1/pms/projects/{project_id}/tasks/{task_id}/comments/{id}   # Update comment
DELETE /api/v1/pms/projects/{project_id}/tasks/{task_id}/comments/{id}   # Delete comment
```

## Attachment Management

```
POST   /api/v1/pms/projects/{project_id}/tasks/{task_id}/attachments                 # Upload
GET    /api/v1/pms/projects/{project_id}/tasks/{task_id}/attachments                 # List
GET    /api/v1/pms/projects/{project_id}/tasks/{task_id}/attachments/{id}/download   # Download
DELETE /api/v1/pms/projects/{project_id}/tasks/{task_id}/attachments/{id}            # Delete
```

## Custom Fields

```
POST   /api/v1/pms/projects/{project_id}/custom-fields       # Create definition
GET    /api/v1/pms/projects/{project_id}/custom-fields       # List definitions
PATCH  /api/v1/pms/projects/{project_id}/custom-fields/{id}  # Update definition
DELETE /api/v1/pms/projects/{project_id}/custom-fields/{id}  # Delete definition
```

## Activity Log

```
GET    /api/v1/pms/projects/{project_id}/activity            # Project activity
GET    /api/v1/pms/tasks/{task_id}/activity                  # Task activity
```

## Tag Management

```
POST   /api/v1/pms/workspaces/{workspace_id}/tags            # Create tag
GET    /api/v1/pms/workspaces/{workspace_id}/tags            # List tags
```

---

# 6. Frontend Pages (15+)

| Page               | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| PMS Dashboard      | KPI cards, task distribution, burndown preview            |
| My Tasks           | Personal task list across all projects                    |
| Projects List      | Browse and manage projects in workspace                   |
| Project Detail     | Sections, tasks, timeline view                            |
| Kanban Board       | Drag-drop task board organized by sections                |
| Task Detail        | Full task with comments, attachments, custom fields       |
| Sprint Board       | Sprint-scoped kanban view                                 |
| Backlog            | Unassigned tasks for sprint planning                      |
| Burndown Chart     | Sprint progress visualization                             |
| Velocity Chart     | Team velocity across sprints                              |
| Goals List         | Workspace goals with progress bars                        |
| Goal Detail        | Goal with linked projects and tasks                       |
| Custom Fields      | Configure project-specific custom fields                  |
| Calendar View      | Task timeline and due dates on calendar                   |
| Timeline / Gantt   | Project timeline visualization with task dependencies     |

---

# 7. Key Features Implemented

## Project Management

* Three project types: **kanban** (drag-drop columns), **list** (flat view), **board** (grid)
* Project visibility: team, private, public
* Archive/restore projects
* Project-level statistics endpoint (task counts, completion rate)
* Color and icon customization per project

## Task Management

* Full CRUD with fractional indexing positions for drag-drop reordering
* Task priorities: none, low, medium, high, urgent
* Task types: task, bug, story, epic
* Subtasks via `parent_id` self-referential relationship
* Task dependencies (blocking/blocked relationships)
* Move/reorder across sections with position recalculation
* Tags and multi-tag support per task
* Task followers (subscribe to notifications)

## Recurring Tasks

* Cron-expression-based recurrence rules
* Configurable recurrence end date
* Auto-generated recurring task instances tracked via `parent_recurring_id`
* `last_generated_date` to prevent duplicate generation

## Agile Tools

* **Sprints**: planning → active → completed lifecycle
* **Backlog**: tasks not assigned to any sprint
* **Story points** on tasks for capacity planning
* **Epics**: tasks with `task_type = epic` act as parent containers
* **Burndown chart**: remaining story points over sprint timeline
* **Velocity chart**: completed story points per sprint

## Full-Text Search

* PostgreSQL `tsvector` trigger on task `title` + `description`
* Indexed search via `/tasks/search` endpoint
* Supports phrase and keyword queries

## Goals & OKR

* Workspace-level goals with status: on_track, at_risk, off_track, achieved
* Two calculation methods: **manual** (direct update) or **automatic** (derived from linked tasks)
* Link goals to multiple projects and tasks
* Progress value (0-100) with color indicator

## Custom Fields

* Six field types: text, number, date, select, multi_select, checkbox
* Per-project field definitions with ordering via `position`
* Field values stored as `JSONB` on tasks for schema flexibility
* Required field validation support

## Collaboration

* **Rich-text comments** via Tiptap editor (HTML/JSON body)
* `body_text` plain-text mirror for search
* **File attachments**: upload, download, MIME type tracking, size in bytes
* **Activity log**: every change recorded with actor, action, and JSONB diff

## RBAC

* Project roles: owner, editor, commenter, viewer
* Workspace admin overrides project-level roles
* Commenter role: read + comment only, no task edits
* Viewer role: strict read-only

---

# 8. Task Lifecycle Workflow

```
Task Created (status: incomplete)
    |
    ├── Assigned to member
    ├── Priority set (none/low/medium/high/urgent)
    ├── Due date and start date configured
    ├── Added to Section (Kanban column)
    ├── Tagged and followed
    |
    ├── Moved across Sections (drag-drop, fractional index)
    ├── Comments added (rich-text)
    ├── Attachments uploaded
    ├── Custom fields filled
    |
    ├── [Optional] Added to Sprint
    ├── [Optional] Linked to Epic (epic_id)
    ├── [Optional] Dependencies set (blocking/blocked)
    ├── [Optional] Subtasks created (parent_id)
    |
    └── Marked Complete (status: complete, completed_at set)
            |
            └── [If recurring] Next instance auto-generated via cron
```

---

# 9. Sprint Workflow

```
Sprint Created (status: planning)
    |
    ├── Tasks moved from Backlog to Sprint
    ├── Story points assigned to tasks
    ├── Sprint goal defined
    |
Sprint Started (status: active)
    |
    ├── Sprint Board active (kanban scoped to sprint)
    ├── Burndown chart tracks remaining points daily
    ├── Tasks completed → story points decrease
    |
Sprint Completed (status: completed)
    |
    ├── Incomplete tasks moved back to Backlog
    ├── Velocity recorded (total completed story points)
    └── Velocity Chart updated for historical comparison
```

---

# 10. Role-Based Permissions

| Feature                | Workspace Admin | Project Owner | Editor  | Commenter | Viewer  |
| ---------------------- | --------------- | ------------- | ------- | --------- | ------- |
| Create/delete project  | Yes             | No            | No      | No        | No      |
| Manage memberships     | Yes             | Yes           | No      | No        | No      |
| Create/edit tasks      | Yes             | Yes           | Yes     | No        | No      |
| Delete tasks           | Yes             | Yes           | Yes     | No        | No      |
| Move/reorder tasks     | Yes             | Yes           | Yes     | No        | No      |
| Add comments           | Yes             | Yes           | Yes     | Yes       | No      |
| Upload attachments     | Yes             | Yes           | Yes     | No        | No      |
| Manage sections        | Yes             | Yes           | Yes     | No        | No      |
| Manage custom fields   | Yes             | Yes           | No      | No        | No      |
| Manage sprints         | Yes             | Yes           | Yes     | No        | No      |
| View project/tasks     | Yes             | Yes           | Yes     | Yes       | Yes     |
| Manage goals           | Yes             | No            | No      | No        | No      |
| Manage tags            | Yes             | No            | No      | No        | No      |

---

# 11. Success Metrics

- 100% task lifecycle số hóa, không dùng Excel
- Giảm 50% thời gian họp standup nhờ Kanban board real-time
- 100% sprint planning qua backlog và story points
- Burndown và velocity accuracy > 95%
- Full-text search response < 200ms
- Goal progress tự động cập nhật khi task hoàn thành (automatic mode)

---

# 12. Future Enhancements

* AI agent tự động gợi ý assignee và deadline dựa trên workload
* Natural language task creation (Agent MCP integration)
* Gantt chart với critical path highlighting
* Time tracking per task (actual vs estimated)
* Advanced reporting (project health, SLA compliance)
* Slack/Teams notification integration
* Git integration (link commits to tasks)
* Mobile app với offline task management

---

# End of Document
