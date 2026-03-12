USER STORIES & ACCEPTANCE CRITERIA
Hệ thống Quản lý Dự án (PMS)
Project Management System
Version: 1.0  |  Ngày tạo: 2026-03-12
Dựa trên PRD v1.0 — 16 Data Models, 15+ Frontend Pages
 
Tổng quan User Stories
Tài liệu này chứa 38 user stories được tổ chức thành 10 epics, bao phủ toàn bộ chức năng của hệ thống PMS theo PRD. Mỗi story bao gồm Acceptance Criteria (Given-When-Then), UI Requirements và Technical Notes.
Chú giải Priority
P0 - Must Have (MVP blocker)  |  P1 - Should Have (Important)  |  P2 - Nice to Have (Enhancement)

ID	User Story	Epic	Priority	Status	Sprint
US-001	Tạo dự án mới	Project Management	P0	⚠️ Partial	Sprint 1
US-002	Xem danh sách dự án	Project Management	P0	✅ Done	Sprint 1
US-003	Chỉnh sửa thông tin dự án	Project Management	P0	✅ Done	Sprint 1
US-004	Lưu trữ / Xóa dự án	Project Management	P1	✅ Done	Sprint 2
US-005	Quản lý thành viên dự án	Project Management	P0	✅ Done	Sprint 1
US-006	Xem thống kê dự án	Project Management	P1	✅ Done	Sprint 3
US-007	Tạo và quản lý Section	Section Management	P0	✅ Done	Sprint 1
US-008	Thiết lập WIP Limit	Section Management	P2	✅ Done	Sprint 4
US-009	Tạo task mới	Task Management	P0	⚠️ Partial	Sprint 1
US-010	Xem và chỉnh sửa task	Task Management	P0	✅ Done	Sprint 1
US-011	Kéo thả task trên Kanban Board	Task Management	P0	✅ Done	Sprint 2
US-012	Tạo Subtask	Task Management	P0	✅ Done	Sprint 2
US-013	Thiết lập Task Dependency	Task Management	P1	✅ Done	Sprint 3
US-014	Gắn Tag cho Task	Task Management	P1	✅ Done	Sprint 2
US-015	Theo dõi Task (Follow)	Task Management	P2	✅ Done	Sprint 3
US-016	Recurring Task (Task lặp lại)	Task Management	P1	✅ Done	Sprint 4
US-017	Tìm kiếm task (Full-text Search)	Task Management	P0	✅ Done	Sprint 2
US-018	Hoàn thành Task	Task Management	P0	✅ Done	Sprint 1
US-019	Tạo Sprint	Agile / Sprint Management	P0	✅ Done	Sprint 2
US-020	Sprint Planning - Di chuyển task từ Backlog	Agile / Sprint Management	P0	✅ Done	Sprint 2
US-021	Start và Complete Sprint	Agile / Sprint Management	P0	✅ Done	Sprint 3
US-022	Sprint Board	Agile / Sprint Management	P0	✅ Done	Sprint 3
US-023	Burndown Chart	Agile / Sprint Management	P1	✅ Done	Sprint 4
US-024	Velocity Chart	Agile / Sprint Management	P1	✅ Done	Sprint 5
US-025	Tạo Goal	Goals & OKR	P1	✅ Done	Sprint 3
US-026	Liên kết Goal với Projects và Tasks	Goals & OKR	P1	✅ Done	Sprint 4
US-027	Theo dõi và cập nhật trạng thái Goal	Goals & OKR	P1	✅ Done	Sprint 4
US-028	Bình luận trên Task	Collaboration	P0	✅ Done	Sprint 2
US-029	Đính kèm file vào Task	Collaboration	P1	✅ Done	Sprint 3
US-030	Xem Activity Log	Collaboration	P1	✅ Done	Sprint 3
US-031	Tạo Custom Field Definition	Custom Fields	P1	✅ Done	Sprint 4
US-032	Nhập giá trị Custom Field trên Task	Custom Fields	P1	✅ Done	Sprint 4
US-033	Tạo và quản lý Tags	Tag Management	P1	✅ Done	Sprint 2
US-034	Phân quyền theo Role	RBAC & Permissions	P0	✅ Done	Sprint 1
US-035	PMS Dashboard	Dashboard & Views	P0	✅ Done	Sprint 3
US-036	My Tasks	Dashboard & Views	P0	✅ Done	Sprint 2
US-037	Calendar View	Dashboard & Views	P2	✅ Done	Sprint 5
US-038	Timeline / Gantt View	Dashboard & Views	P2	✅ Done	Sprint 6
 
Epic 1: Project Management
Quản lý toàn bộ vòng đời dự án: khởi tạo, cấu hình, lưu trữ và xóa dự án trong workspace.

US-001: Tạo dự án mới
Priority	P0 - Must Have
Persona	Project Owner
Epic	Epic 1: Project Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Project Owner
I want to create a new project with name, description, type (kanban/list/board) and visibility
So that my team has a structured workspace to manage tasks

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo dự án thành công	Project Owner đang ở Workspace Dashboard	Nhập tên, mô tả, chọn loại kanban, visibility = private và nhấn Create	Dự án mới được tạo với đầy đủ thông tin, hiển thị trong danh sách Projects	⬜
AC2	Thiếu tên dự án	Project Owner đang ở form tạo dự án	Để trống trường tên và nhấn Create	Hiển thị lỗi validation: 'Tên dự án là bắt buộc'	⬜
AC3	Chọn loại dự án	Project Owner đang tạo dự án	Chọn lần lượt kanban, list, board	Mỗi loại tạo project_type tương ứng và giao diện mặc định phù hợp	⬜
AC4	Tự động gán owner	Project Owner tạo dự án thành công	Dự án được tạo	User tạo dự án tự động được gán role = owner trong ProjectMembership	⬜

UI Requirements:
•	Input: Name (text, required, max 255), Description (textarea), Type (select: kanban/list/board), Visibility (select: team/private/public)
•	Button: Create Project (primary), Cancel (secondary)
•	Color picker và Icon selector (optional)

Technical Notes:
• POST /api/v1/pms/workspaces/{workspace_id}/projects
• DB: Insert Project + ProjectMembership (role=owner)
• Validation: name required, workspace_id valid


US-002: Xem danh sách dự án
Priority	P0 - Must Have
Persona	Team Member
Epic	Epic 1: Project Management
Sprint	Sprint 1
Estimate	3 SP

User Story:
As a Team Member
I want to view all projects I have access to in my workspace
So that I can quickly navigate to the project I need to work on

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị danh sách	User đã đăng nhập và có quyền truy cập workspace	Mở trang Projects List	Hiển thị danh sách tất cả dự án user có quyền truy cập, với tên, icon, màu sắc, số task	⬜
AC2	Lọc theo visibility	Danh sách dự án đang hiển thị	Lọc theo visibility = public	Chỉ hiển thị các dự án có visibility = public	⬜
AC3	Dự án archived bị ẩn	Có dự án đã được archived	Mở danh sách Projects	Dự án archived không hiển thị trong danh sách mặc định	⬜

UI Requirements:
•	Danh sách dạng card/grid với project name, color, icon
•	Filter: visibility, archived status
•	Search bar lọc theo tên

Technical Notes:
• GET /api/v1/pms/workspaces/{workspace_id}/projects
• Filter: visibility, is_archived
• RBAC: chỉ trả về projects user có membership


US-003: Chỉnh sửa thông tin dự án
Priority	P0 - Must Have
Persona	Project Owner
Epic	Epic 1: Project Management
Sprint	Sprint 1
Estimate	3 SP

User Story:
As a Project Owner
I want to edit project details (name, description, color, icon, visibility)
So that I can keep project information accurate and up-to-date

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Cập nhật thành công	Project Owner đang ở trang Project Detail	Thay đổi tên dự án và nhấn Save	Tên dự án được cập nhật, ActivityLog ghi nhận thay đổi	⬜
AC2	Không có quyền	User có role = Editor	Thử chỉnh sửa project settings	Hiển thị thông báo 'Bạn không có quyền chỉnh sửa thông tin dự án'	⬜

UI Requirements:
•	Form edit với các trường tương tự form tạo
•	Button: Save, Cancel

Technical Notes:
• PATCH /api/v1/pms/projects/{project_id}
• RBAC: chỉ owner + workspace admin
• ActivityLog: ghi nhận changes (JSONB diff)


US-004: Lưu trữ / Xóa dự án
Priority	P1 - Should Have
Persona	Project Owner
Epic	Epic 1: Project Management
Sprint	Sprint 2
Estimate	3 SP

User Story:
As a Project Owner
I want to archive or delete projects that are completed or no longer needed
So that the workspace stays organized and uncluttered

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Archive dự án	Project Owner ở trang Project Detail	Nhấn Archive Project	Dự án chuyển is_archived = true, ẩn khỏi danh sách mặc định	⬜
AC2	Restore dự án	Dự án đã bị archived	Nhấn Restore Project	is_archived = false, dự án hiển thị lại trong danh sách	⬜
AC3	Xóa dự án vĩnh viễn	Project Owner xác nhận xóa	Nhấn Delete và confirm	Dự án cùng tất cả sections, tasks, comments bị xóa vĩnh viễn	⬜

UI Requirements:
•	Button: Archive (warning), Delete (danger) với confirmation dialog
•	Archived filter trong Projects List

Technical Notes:
• PATCH /api/v1/pms/projects/{project_id} (archive)
• DELETE /api/v1/pms/projects/{project_id}
• Cascade delete: sections, tasks, comments, attachments


US-005: Quản lý thành viên dự án
Priority	P0 - Must Have
Persona	Project Owner
Epic	Epic 1: Project Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Project Owner
I want to invite members and assign roles (editor/commenter/viewer) to my project
So that team members have appropriate access levels

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Mời thành viên	Project Owner ở Project Settings > Members	Tìm kiếm user và gán role = Editor, nhấn Invite	User mới xuất hiện trong danh sách thành viên với role Editor	⬜
AC2	Thay đổi role	Thành viên hiện có role = Editor	Đổi role sang Commenter	Role được cập nhật, quyền thay đổi tương ứng	⬜
AC3	Xóa thành viên	Thành viên đang trong dự án	Nhấn Remove Member	User bị xóa khỏi ProjectMembership, mất quyền truy cập	⬜
AC4	Không thể xóa owner cuối	Dự án chỉ còn 1 owner	Thử xóa owner đó	Hiển thị lỗi: cần ít nhất 1 owner cho dự án	⬜

UI Requirements:
•	User search/autocomplete
•	Role dropdown: owner, editor, commenter, viewer
•	Danh sách thành viên với avatar, tên, role

Technical Notes:
• POST/PATCH/DELETE ProjectMembership
• RBAC: chỉ owner + workspace admin
• Constraint: ít nhất 1 owner per project


US-006: Xem thống kê dự án
Priority	P1 - Should Have
Persona	Project Owner
Epic	Epic 1: Project Management
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Project Owner
I want to view project statistics (total tasks, completion rate, overdue tasks)
So that I can monitor overall project health at a glance

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị stats	Dự án có 20 tasks, 12 complete, 3 overdue	Mở Project Stats	Hiển thị: Total 20, Completed 12 (60%), Overdue 3, In Progress 5	⬜
AC2	Dự án trống	Dự án không có task nào	Mở Project Stats	Hiển thị: Total 0, Completed 0 (0%) với empty state message	⬜

UI Requirements:
•	KPI cards: total tasks, completion %, overdue count
•	PMS Dashboard tổng hợp

Technical Notes:
• GET /api/v1/pms/projects/{project_id}/stats
• Aggregation query trên Task table


 
Epic 2: Section Management
Quản lý sections (cột/nhóm) trong dự án để tổ chức task theo quy trình làm việc (VD: Backlog, In Progress, Review, Done).

US-007: Tạo và quản lý Section
Priority	P0 - Must Have
Persona	Editor
Epic	Epic 2: Section Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As an Editor
I want to create, rename, reorder and delete sections in a project
So that I can organize the workflow stages for my team

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo section mới	Editor ở Kanban Board	Nhấn + Add Section, nhập tên 'In Review'	Section mới xuất hiện ở cuối board với tên 'In Review'	⬜
AC2	Đổi tên section	Section 'Todo' đang hiển thị	Double-click tên section, đổi thành 'Backlog'	Tên section được cập nhật thành 'Backlog'	⬜
AC3	Kéo thả sắp xếp	Board có 4 sections	Kéo section 'Review' từ vị trí 3 sang vị trí 2	Thứ tự sections cập nhật, position (fractional indexing) thay đổi	⬜
AC4	Xóa section có task	Section 'Old' có 5 tasks	Nhấn Delete Section	Hiển thị cảnh báo: tasks sẽ bị di chuyển về section khác hoặc unassigned	⬜

UI Requirements:
•	Inline edit cho tên section
•	Drag handle cho reorder
•	Color picker cho section
•	WIP limit setting

Technical Notes:
• POST/PATCH/DELETE /api/v1/pms/projects/{project_id}/sections
• Fractional indexing cho position
• RBAC: Editor trở lên


US-008: Thiết lập WIP Limit
Priority	P2 - Nice to Have
Persona	Project Owner
Epic	Epic 2: Section Management
Sprint	Sprint 4
Estimate	2 SP

User Story:
As a Project Owner
I want to set Work-In-Progress limits on sections
So that the team follows Kanban discipline and avoids overloading any stage

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Đặt WIP limit	Section 'In Progress' không có WIP limit	Đặt wip_limit = 5	Section hiển thị counter: 3/5 tasks	⬜
AC2	Vượt WIP limit	Section có wip_limit = 5 và đã có 5 tasks	Kéo thêm 1 task vào section	Hiển thị cảnh báo visual (highlight đỏ), nhưng vẫn cho phép thêm	⬜

UI Requirements:
•	WIP limit input trong section settings
•	Visual indicator khi gần/vượt limit

Technical Notes:
• PATCH section wip_limit
• Frontend validation + visual warning


 
Epic 3: Task Management
Quản lý toàn bộ vòng đời task: tạo, phân công, theo dõi, hoàn thành. Bao gồm subtasks, dependencies, tags, recurring tasks.

US-009: Tạo task mới
Priority	P0 - Must Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As an Editor
I want to create a new task with title, description, priority, due date and assignee
So that work items are properly defined and assigned to team members

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo task đầy đủ	Editor ở Kanban Board, section 'Todo'	Nhập title, description, priority = High, due_date, assignee và nhấn Create	Task mới xuất hiện trong section 'Todo' với đầy đủ thông tin	⬜
AC2	Tạo task nhanh	Editor ở Kanban Board	Chỉ nhập title và nhấn Enter	Task được tạo với title, các trường khác = mặc định (priority=none, no assignee)	⬜
AC3	Title trống	Editor đang tạo task	Để trống title và nhấn Create	Hiển thị lỗi: 'Tiêu đề task là bắt buộc'	⬜
AC4	Full-text search vector	Task được tạo với title + description	Task được save vào DB	search_vector (tsvector) được tự động tạo từ title + description	⬜

UI Requirements:
•	Input: Title (text, required), Description (rich-text editor), Priority (select), Due date (date picker), Assignee (user select)
•	Quick add: chỉ title + Enter
•	Task type selector: task/bug/story/epic

Technical Notes:
• POST /api/v1/pms/projects/{project_id}/tasks
• DB trigger: auto-generate search_vector
• Fractional indexing cho position


US-010: Xem và chỉnh sửa task
Priority	P0 - Must Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As an Editor
I want to view task details and edit any field
So that I can keep task information current as work progresses

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Mở Task Detail	Task tồn tại trong project	Click vào task trên board/list	Hiển thị Task Detail panel/page với tất cả thông tin, comments, attachments	⬜
AC2	Cập nhật priority	Task đang có priority = Low	Đổi priority sang Urgent	Priority cập nhật, ActivityLog ghi nhận thay đổi	⬜
AC3	Commenter không thể edit	User có role = Commenter	Thử thay đổi title của task	Các field bị disabled, chỉ cho phép xem và comment	⬜

UI Requirements:
•	Task Detail panel: title, description, status, priority, dates, assignee, tags, custom fields
•	Inline editing cho từng field
•	Tab: Comments, Attachments, Activity

Technical Notes:
• GET /api/v1/pms/projects/{project_id}/tasks/{id}
• PATCH /api/v1/pms/projects/{project_id}/tasks/{id}
• ActivityLog auto-generated on changes


US-011: Kéo thả task trên Kanban Board
Priority	P0 - Must Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 2
Estimate	8 SP

User Story:
As an Editor
I want to drag and drop tasks between sections on the Kanban Board
So that I can visually update task status as work progresses

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Di chuyển giữa sections	Task ở section 'In Progress'	Kéo task sang section 'Review'	Task di chuyển sang 'Review', section_id và position cập nhật	⬜
AC2	Sắp xếp trong section	Section có 5 tasks	Kéo task từ vị trí 4 lên vị trí 2	Thứ tự task thay đổi, position (fractional indexing) tính lại	⬜
AC3	Viewer không thể kéo	User có role = Viewer	Thử kéo task	Drag bị disabled, cursor không chuyển thành grab	⬜

UI Requirements:
•	Drag-and-drop interface trên Kanban Board
•	Visual feedback khi kéo (ghost card, drop zone highlight)
•	Smooth animation khi reorder

Technical Notes:
• PATCH /api/v1/pms/projects/{project_id}/tasks/{id}/move
• Fractional indexing: position = (prev + next) / 2
• Optimistic UI update + rollback on error


US-012: Tạo Subtask
Priority	P0 - Must Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 2
Estimate	3 SP

User Story:
As an Editor
I want to create subtasks under a parent task
So that I can break down complex work items into smaller actionable steps

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo subtask	Editor đang xem Task Detail của parent task	Nhấn + Add Subtask, nhập title	Subtask tạo với parent_id = parent task ID, hiển thị nested dưới parent	⬜
AC2	Hiển thị tiến độ	Parent task có 3 subtasks, 1 complete	Xem parent task trên board	Hiển thị progress: 1/3 subtasks complete	⬜

UI Requirements:
•	Subtask list trong Task Detail
•	Progress bar cho parent task
•	Indent visual cho subtasks

Technical Notes:
• POST task với parent_id
• Self-referential relationship trên Task table
• Aggregation query cho subtask progress


US-013: Thiết lập Task Dependency
Priority	P1 - Should Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 3
Estimate	5 SP

User Story:
As an Editor
I want to set blocking dependencies between tasks
So that the team understands task execution order and avoids working on blocked items

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo dependency	Task A và Task B tồn tại	Đặt Task A blocking Task B	TaskDependency record tạo, Task B hiển thị badge 'Blocked by Task A'	⬜
AC2	Circular dependency	Task A blocks Task B	Thử đặt Task B blocks Task A	Hiển thị lỗi: 'Không thể tạo circular dependency'	⬜
AC3	Xóa dependency	Task A đang blocking Task B	Xóa dependency	Task B không còn bị blocked, badge biến mất	⬜

UI Requirements:
•	Dependency selector trong Task Detail
•	Visual indicator 'Blocked' trên task card
•	Timeline/Gantt view hiển thị dependencies

Technical Notes:
• TaskDependency model: blocking_task_id, blocked_task_id
• Validation: check circular dependency trước khi tạo
• DELETE dependency endpoint


US-014: Gắn Tag cho Task
Priority	P1 - Should Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 2
Estimate	3 SP

User Story:
As an Editor
I want to add tags to tasks for categorization
So that I can filter and organize tasks by topic, type or any custom label

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Thêm tag	Task và Tag 'Frontend' tồn tại	Thêm tag 'Frontend' vào task	Tag hiển thị trên task card với màu sắc tương ứng	⬜
AC2	Multi-tag	Task đã có tag 'Frontend'	Thêm tag 'Urgent'	Task hiển thị cả 2 tags	⬜
AC3	Lọc theo tag	Nhiều task có các tags khác nhau	Lọc board theo tag 'Frontend'	Chỉ hiển thị tasks có tag 'Frontend'	⬜

UI Requirements:
•	Tag chips trên task card
•	Tag multi-select trong Task Detail
•	Filter by tag trên Board/List

Technical Notes:
• POST/DELETE /tasks/{id}/tags/{tag_id}
• TaskTag join table (many-to-many)
• GET tasks with tag filter


US-015: Theo dõi Task (Follow)
Priority	P2 - Nice to Have
Persona	Team Member
Epic	Epic 3: Task Management
Sprint	Sprint 3
Estimate	2 SP

User Story:
As a Team Member
I want to follow tasks I'm interested in
So that I receive notifications when there are updates

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Follow task	User đang xem Task Detail	Nhấn Follow	User thêm vào TaskFollower, nhận thông báo khi có changes	⬜
AC2	Unfollow	User đang follow task	Nhấn Unfollow	User bị xóa khỏi TaskFollower, ngừng nhận thông báo	⬜

UI Requirements:
•	Follow/Unfollow toggle button
•	Follower count/list trong Task Detail

Technical Notes:
• POST/DELETE /tasks/{id}/followers
• TaskFollower join table


US-016: Recurring Task (Task lặp lại)
Priority	P1 - Should Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 4
Estimate	5 SP

User Story:
As an Editor
I want to create recurring tasks with cron-based schedules
So that repetitive work is automatically generated on schedule

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo recurring task	Editor tạo task mới	Bật recurrence, chọn 'Hàng tuần vào thứ 2'	Task có recurrence_rule và recurrence_cron_expr được set	⬜
AC2	Auto-generate	Recurring task đến ngày lặp	Hệ thống chạy job tạo task	Task mới tạo với parent_recurring_id = task gốc, last_generated_date cập nhật	⬜
AC3	End recurrence	Recurring task có end_date = 2026-06-30	Ngày 2026-07-01	Không tạo thêm task instance mới	⬜

UI Requirements:
•	Recurrence selector: daily/weekly/monthly/custom cron
•	End date picker
•	Badge 'Recurring' trên task card

Technical Notes:
• Cron expression parser
• Background job auto-generate tasks
• parent_recurring_id + last_generated_date tracking


US-017: Tìm kiếm task (Full-text Search)
Priority	P0 - Must Have
Persona	Team Member
Epic	Epic 3: Task Management
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Team Member
I want to search tasks by keyword across title and description
So that I can quickly find relevant tasks without manually browsing

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tìm kiếm cơ bản	Dự án có 50 tasks	Nhập keyword 'login' vào search box	Hiển thị tất cả tasks có 'login' trong title hoặc description	⬜
AC2	Không có kết quả	Dự án có 50 tasks	Nhập keyword không match	Hiển thị empty state: 'Không tìm thấy task phù hợp'	⬜
AC3	Performance	Dự án có 1000+ tasks	Thực hiện search	Kết quả trả về trong < 200ms	⬜

UI Requirements:
•	Search bar trên đầu trang project
•	Kết quả hiển thị inline với highlight keyword

Technical Notes:
• GET /api/v1/pms/projects/{project_id}/tasks/search?q=keyword
• PostgreSQL tsvector + GIN index
• Response time < 200ms


US-018: Hoàn thành Task
Priority	P0 - Must Have
Persona	Editor
Epic	Epic 3: Task Management
Sprint	Sprint 1
Estimate	2 SP

User Story:
As an Editor
I want to mark a task as complete
So that the team knows the work item is done and progress is tracked

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Mark complete	Task có status = incomplete	Nhấn checkbox hoàn thành	status = complete, completed_at = timestamp hiện tại	⬜
AC2	Reopen task	Task có status = complete	Nhấn uncheck	status = incomplete, completed_at = null	⬜
AC3	Recurring task complete	Recurring task được mark complete	Hoàn thành task	Task complete + hệ thống tạo task instance tiếp theo	⬜

UI Requirements:
•	Checkbox hoàn thành trên task card và detail
•	Strikethrough effect khi complete

Technical Notes:
• PATCH task status + completed_at
• Trigger: auto-generate next recurring instance


 
Epic 4: Agile / Sprint Management
Hỗ trợ phương pháp Agile: Sprint planning, backlog management, burndown charts, velocity tracking.

US-019: Tạo Sprint
Priority	P0 - Must Have
Persona	Project Owner
Epic	Epic 4: Agile / Sprint Management
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Project Owner
I want to create a new sprint with name, goal, start/end dates
So that the team has a time-boxed iteration to commit work to

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo sprint thành công	Project Owner ở Sprint Management	Nhập tên, goal, start_date, end_date và nhấn Create	Sprint mới tạo với status = planning	⬜
AC2	Ngày chồng chéo	Sprint 1 active từ 1/3 - 15/3	Tạo Sprint 2 bắt đầu 10/3	Hiển thị cảnh báo: ngày chồng chéo với Sprint 1	⬜
AC3	Thiếu ngày	Đang tạo sprint	Không nhập end_date	Hiển thị lỗi validation: 'Ngày kết thúc là bắt buộc'	⬜

UI Requirements:
•	Form: Sprint name, Goal (textarea), Start date, End date
•	Sprint list với status badges

Technical Notes:
• POST /api/v1/pms/projects/{project_id}/sprints
• Status lifecycle: planning → active → completed
• Validation: date range


US-020: Sprint Planning - Di chuyển task từ Backlog
Priority	P0 - Must Have
Persona	Editor
Epic	Epic 4: Agile / Sprint Management
Sprint	Sprint 2
Estimate	5 SP

User Story:
As an Editor
I want to move tasks from Backlog into a Sprint
So that the team commits to a set of work items for the iteration

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Thêm task vào sprint	Backlog có 20 tasks, Sprint đang planning	Chọn 5 tasks và kéo vào Sprint	5 tasks có sprint_id = Sprint ID, hiển thị trong Sprint Board	⬜
AC2	Xem backlog	Có tasks chưa gán sprint	Mở Backlog page	Hiển thị tất cả tasks có sprint_id = null	⬜
AC3	Gán story points	Task được thêm vào sprint	Đặt story_points = 5	Story points hiển thị trên task card, tổng points sprint cập nhật	⬜

UI Requirements:
•	Backlog view với drag-to-sprint
•	Story points input trên task
•	Sprint capacity bar (total story points)

Technical Notes:
• PATCH task sprint_id
• GET /api/v1/pms/projects/{project_id}/backlog
• Sprint board: filter tasks by sprint_id


US-021: Start và Complete Sprint
Priority	P0 - Must Have
Persona	Project Owner
Epic	Epic 4: Agile / Sprint Management
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Project Owner
I want to start and complete sprints
So that the team follows a disciplined iteration cycle

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Start sprint	Sprint status = planning, có tasks	Nhấn Start Sprint	Sprint status = active, Sprint Board hiển thị	⬜
AC2	Complete sprint	Sprint status = active	Nhấn Complete Sprint	Sprint status = completed, tasks chưa done chuyển về Backlog	⬜
AC3	Sprint trống không start	Sprint không có task	Thử Start Sprint	Hiển thị cảnh báo: 'Sprint phải có ít nhất 1 task'	⬜

UI Requirements:
•	Start Sprint button (chỉ hiển thị khi planning)
•	Complete Sprint button (chỉ hiển thị khi active)
•	Confirmation dialog khi complete với danh sách tasks chưa done

Technical Notes:
• POST /sprints/{id}/start
• POST /sprints/{id}/complete
• Auto-move incomplete tasks back to backlog (sprint_id = null)


US-022: Sprint Board
Priority	P0 - Must Have
Persona	Team Member
Epic	Epic 4: Agile / Sprint Management
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Team Member
I want to view and interact with the Sprint Board (kanban scoped to active sprint)
So that I can see sprint progress and update my task status

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị Sprint Board	Sprint active có 10 tasks	Mở Sprint Board	Hiển thị Kanban Board chỉ với tasks thuộc sprint này, grouped by sections	⬜
AC2	Kéo thả trên Sprint Board	Task ở section 'In Progress'	Kéo sang 'Done'	Task cập nhật section, burndown chart cập nhật	⬜

UI Requirements:
•	Kanban Board filtered by sprint
•	Sprint goal hiển thị trên header
•	Sprint progress bar

Technical Notes:
• GET /api/v1/pms/projects/{project_id}/sprints/{id}/board
• Real-time update khi task thay đổi


US-023: Burndown Chart
Priority	P1 - Should Have
Persona	Project Owner
Epic	Epic 4: Agile / Sprint Management
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Project Owner
I want to view the Burndown Chart for the active sprint
So that I can track remaining work and detect if the sprint is on track

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị burndown	Sprint active, có story points data	Mở Burndown Chart	Hiển thị chart với ideal line và actual remaining story points theo ngày	⬜
AC2	Cập nhật real-time	Task 5 SP được mark complete	Xem burndown chart	Actual line giảm 5 points tại ngày hiện tại	⬜

UI Requirements:
•	Line chart: x-axis = ngày, y-axis = story points
•	Ideal burndown line (linear)
•	Actual remaining line

Technical Notes:
• GET /sprints/{id}/burndown
• Daily snapshot of remaining story points
• Chart library: recharts hoặc chart.js


US-024: Velocity Chart
Priority	P1 - Should Have
Persona	Project Owner
Epic	Epic 4: Agile / Sprint Management
Sprint	Sprint 5
Estimate	3 SP

User Story:
As a Project Owner
I want to view the Velocity Chart across completed sprints
So that I can plan future sprint capacity based on historical data

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị velocity	3 sprints đã completed	Mở Velocity Chart	Bar chart hiển thị total completed story points cho mỗi sprint	⬜
AC2	Average velocity	5 sprints completed	Xem chart	Hiển thị đường trung bình velocity	⬜

UI Requirements:
•	Bar chart: mỗi bar = 1 sprint
•	Average velocity line
•	Sprint name labels

Technical Notes:
• GET /api/v1/pms/projects/{project_id}/velocity
• Aggregate completed story points per sprint


 
Epic 5: Goals & OKR
Thiết lập và theo dõi mục tiêu cấp workspace, liên kết với projects và tasks để đo lường tiến độ tự động.

US-025: Tạo Goal
Priority	P1 - Should Have
Persona	Workspace Admin
Epic	Epic 5: Goals & OKR
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Workspace Admin
I want to create workspace-level goals with title, description, due date and calculation method
So that the organization's objectives are clearly defined and measurable

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo goal manual	Admin ở Goals page	Tạo goal với calculation_method = manual	Goal tạo thành công, progress_value = 0, status = on_track	⬜
AC2	Tạo goal automatic	Admin tạo goal	Chọn calculation_method = automatic	Goal tạo thành công, progress tự động tính từ linked tasks	⬜

UI Requirements:
•	Form: Title, Description, Due date, Color, Calculation method (manual/automatic)
•	Goals List với progress bars

Technical Notes:
• POST /api/v1/pms/workspaces/{workspace_id}/goals
• Status enum: on_track, at_risk, off_track, achieved


US-026: Liên kết Goal với Projects và Tasks
Priority	P1 - Should Have
Persona	Workspace Admin
Epic	Epic 5: Goals & OKR
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Workspace Admin
I want to link goals to projects and specific tasks
So that goal progress is automatically calculated from actual work completion

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Link project to goal	Goal và Project tồn tại	Thêm project vào goal	GoalProjectLink record tạo, project hiển thị trong Goal Detail	⬜
AC2	Link task to goal	Goal và Task tồn tại	Thêm task vào goal	GoalTaskLink record tạo	⬜
AC3	Auto progress update	Goal (automatic) linked 10 tasks, 4 complete	Xem Goal Detail	progress_value = 40%	⬜

UI Requirements:
•	Project/Task selector trong Goal Detail
•	Progress bar auto-updated
•	Linked items list

Technical Notes:
• POST/DELETE GoalProjectLink, GoalTaskLink
• Auto-calculate: progress = (completed linked tasks / total linked tasks) * 100


US-027: Theo dõi và cập nhật trạng thái Goal
Priority	P1 - Should Have
Persona	Project Owner
Epic	Epic 5: Goals & OKR
Sprint	Sprint 4
Estimate	3 SP

User Story:
As a Project Owner
I want to update goal status (on_track / at_risk / off_track / achieved)
So that stakeholders have visibility into objective health

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Cập nhật status	Goal đang on_track	Đổi status sang at_risk	Status cập nhật, color indicator thay đổi tương ứng	⬜
AC2	Mark achieved	Goal progress = 100%	Đổi status sang achieved	Goal hiển thị achieved badge, không cho phép thêm links	⬜

UI Requirements:
•	Status dropdown với color indicators
•	Progress bar + manual slider (cho manual goals)

Technical Notes:
• PATCH /goals/{id}
• Validation: status transitions


 
Epic 6: Collaboration
Hỗ trợ cộng tác nhóm qua comments (rich-text), file attachments, activity logs và @mentions.

US-028: Bình luận trên Task
Priority	P0 - Must Have
Persona	Commenter
Epic	Epic 6: Collaboration
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Commenter
I want to add rich-text comments on tasks
So that I can discuss work items, ask questions and share context with the team

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo comment	User ở Task Detail > Comments tab	Viết comment với rich text (bold, code block) và nhấn Post	Comment hiển thị với body (HTML), author, timestamp	⬜
AC2	Sửa comment	User đã đăng comment	Nhấn Edit, thay đổi nội dung	Comment updated, hiển thị 'edited' indicator	⬜
AC3	Xóa comment	User đã đăng comment	Nhấn Delete, confirm	Comment bị xóa	⬜
AC4	Viewer không thể comment	User có role = Viewer	Thử viết comment	Comment form bị disabled	⬜

UI Requirements:
•	Tiptap rich-text editor
•	Comment list chronological
•	Edit/Delete actions cho comment của mình

Technical Notes:
• POST/PATCH/DELETE /tasks/{task_id}/comments
• body (rich-text HTML/JSON) + body_text (plain text for search)
• RBAC: Commenter trở lên


US-029: Đính kèm file vào Task
Priority	P1 - Should Have
Persona	Editor
Epic	Epic 6: Collaboration
Sprint	Sprint 3
Estimate	5 SP

User Story:
As an Editor
I want to upload and manage file attachments on tasks
So that related documents, designs and resources are centralized with the work item

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Upload file	Editor ở Task Detail	Kéo thả file hoặc nhấn Upload	File được upload, hiển thị filename, size, mime_type	⬜
AC2	Download file	Task có file đính kèm	Nhấn Download	File được tải về máy	⬜
AC3	Xóa attachment	Task có file đính kèm, user = Editor	Nhấn Delete trên attachment	File bị xóa khỏi storage và DB	⬜

UI Requirements:
•	Drag-and-drop upload zone
•	Attachment list: filename, size, uploaded_by, date
•	Download + Delete actions

Technical Notes:
• POST /tasks/{task_id}/attachments (multipart upload)
• GET /attachments/{id}/download
• Storage: local filesystem hoặc S3


US-030: Xem Activity Log
Priority	P1 - Should Have
Persona	Team Member
Epic	Epic 6: Collaboration
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Team Member
I want to view the activity log of changes on a project or task
So that I can understand what changed, who changed it and when

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Task activity	Task đã có nhiều thay đổi	Mở Task Detail > Activity tab	Hiển thị timeline: actor, action, changes (JSONB diff) theo thứ tự mới nhất	⬜
AC2	Project activity	Project có nhiều hoạt động	Mở Project Activity page	Hiển thị tất cả hoạt động trong project: task created/updated/completed, comments...	⬜

UI Requirements:
•	Activity timeline với avatar, action description, timestamp
•	Filter by action type

Technical Notes:
• GET /projects/{project_id}/activity
• GET /tasks/{task_id}/activity
• ActivityLog: entity_type, entity_id, actor_id, action, changes (JSONB)


 
Epic 7: Custom Fields
Cho phép Project Owner định nghĩa các trường tùy chỉnh riêng cho từng dự án, hỗ trợ nhiều kiểu dữ liệu.

US-031: Tạo Custom Field Definition
Priority	P1 - Should Have
Persona	Project Owner
Epic	Epic 7: Custom Fields
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Project Owner
I want to define custom fields for my project with various data types
So that the team can track project-specific information beyond standard task fields

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo text field	Project Owner ở Custom Fields settings	Tạo field 'Customer Name', type = text, required = true	Field definition tạo, hiển thị trên tất cả task forms	⬜
AC2	Tạo select field	Đang tạo custom field	Type = select, options = ['Frontend', 'Backend', 'QA']	Select field với dropdown options hiển thị trên tasks	⬜
AC3	6 field types	Project Owner tạo fields	Tạo lần lượt: text, number, date, select, multi_select, checkbox	Tất cả 6 loại field hoạt động đúng với input tương ứng	⬜

UI Requirements:
•	Custom Fields config page
•	Field type selector, options builder (cho select/multi_select)
•	Required toggle, position ordering

Technical Notes:
• POST /projects/{project_id}/custom-fields
• CustomFieldDefinition: field_type enum, options (JSONB)
• Task custom_fields (JSONB) lưu giá trị


US-032: Nhập giá trị Custom Field trên Task
Priority	P1 - Should Have
Persona	Editor
Epic	Epic 7: Custom Fields
Sprint	Sprint 4
Estimate	3 SP

User Story:
As an Editor
I want to fill in custom field values when editing a task
So that project-specific data is captured alongside standard task information

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Điền giá trị	Task có custom field 'Budget' (number)	Nhập 50000 vào field Budget	Giá trị lưu trong task.custom_fields JSONB	⬜
AC2	Required validation	Custom field 'Customer' required = true	Để trống field và save task	Hiển thị lỗi: 'Customer là bắt buộc'	⬜

UI Requirements:
•	Custom fields rendered trong Task Detail form
•	Dynamic input type dựa trên field_type

Technical Notes:
• PATCH task custom_fields (JSONB merge)
• Client-side + server-side validation cho required fields


 
Epic 8: Tag Management
Quản lý tags cấp workspace để phân loại và lọc tasks xuyên suốt các dự án.

US-033: Tạo và quản lý Tags
Priority	P1 - Should Have
Persona	Workspace Admin
Epic	Epic 8: Tag Management
Sprint	Sprint 2
Estimate	2 SP

User Story:
As a Workspace Admin
I want to create and manage workspace-level tags with name and color
So that the entire workspace has a consistent taxonomy for categorizing tasks

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo tag	Admin ở Tag Management	Nhập name = 'Bug', color = '#FF0000'	Tag tạo thành công, available cho tất cả projects trong workspace	⬜
AC2	Tag trùng tên	Tag 'Bug' đã tồn tại	Thử tạo tag 'Bug' lần nữa	Hiển thị lỗi: 'Tag name đã tồn tại'	⬜

UI Requirements:
•	Tag list với color swatches
•	Add/Edit tag form

Technical Notes:
• POST /api/v1/pms/workspaces/{workspace_id}/tags
• Unique constraint: (workspace_id, name)


 
Epic 9: RBAC & Permissions
Đảm bảo phân quyền Role-Based Access Control nhất quán trên toàn hệ thống.

US-034: Phân quyền theo Role
Priority	P0 - Must Have
Persona	Workspace Admin
Epic	Epic 9: RBAC & Permissions
Sprint	Sprint 1
Estimate	8 SP

User Story:
As a Workspace Admin
I want the system to enforce role-based permissions (owner/editor/commenter/viewer)
So that users can only perform actions appropriate to their access level

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Editor tạo task	User có role = Editor	Tạo task mới	Task tạo thành công	⬜
AC2	Commenter chỉ comment	User có role = Commenter	Thử tạo task	403 Forbidden - không có quyền	⬜
AC3	Viewer chỉ xem	User có role = Viewer	Thử thêm comment	403 Forbidden - không có quyền	⬜
AC4	Workspace Admin override	User là Workspace Admin nhưng không phải member của project	Truy cập project và tạo task	Truy cập thành công - Workspace Admin có full access	⬜

UI Requirements:
•	Permission-based UI rendering (ẩn/disable buttons theo role)
•	Error toast khi bị denied

Technical Notes:
• Middleware RBAC check trên mỗi API endpoint
• Permission matrix: 5 roles × N actions
• Workspace Admin overrides project-level roles


 
Epic 10: Dashboard & Views
Các trang tổng quan và view khác nhau: Dashboard, My Tasks, Calendar, Timeline/Gantt.

US-035: PMS Dashboard
Priority	P0 - Must Have
Persona	Team Member
Epic	Epic 10: Dashboard & Views
Sprint	Sprint 3
Estimate	8 SP

User Story:
As a Team Member
I want to see a dashboard with KPI cards, task distribution and burndown preview
So that I have an at-a-glance overview of all my projects and workload

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	KPI cards	User có tasks trong nhiều dự án	Mở PMS Dashboard	Hiển thị: Total tasks, Overdue tasks, Completed this week, Active sprints	⬜
AC2	Task distribution	User thuộc 3 dự án	Xem Dashboard	Chart phân bổ tasks theo dự án và priority	⬜

UI Requirements:
•	KPI cards row
•	Task distribution pie/bar chart
•	Burndown mini-chart
•	Recent activity feed

Technical Notes:
• Aggregation queries across user's projects
• Dashboard API endpoint hoặc client-side aggregation


US-036: My Tasks
Priority	P0 - Must Have
Persona	Team Member
Epic	Epic 10: Dashboard & Views
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Team Member
I want to see all tasks assigned to me across all projects in one place
So that I can manage my personal workload efficiently

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị My Tasks	User được gán tasks ở 3 dự án khác nhau	Mở My Tasks page	Hiển thị tất cả tasks với assignee_id = current user, grouped by project	⬜
AC2	Filter và sort	My Tasks hiển thị 20 tasks	Lọc theo priority = High, sort by due_date	Chỉ hiển thị tasks High priority, sắp xếp theo due date gần nhất	⬜

UI Requirements:
•	Task list grouped by project
•	Filters: priority, status, due date range
•	Sort: due date, priority, created date

Technical Notes:
• GET tasks where assignee_id = current_user across all projects
• Cross-project query with RBAC filtering


US-037: Calendar View
Priority	P2 - Nice to Have
Persona	Team Member
Epic	Epic 10: Dashboard & Views
Sprint	Sprint 5
Estimate	5 SP

User Story:
As a Team Member
I want to view tasks on a calendar by their due dates
So that I can visualize my schedule and identify deadline conflicts

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị calendar	Dự án có tasks với due_date	Mở Calendar View	Tasks hiển thị trên calendar tại due_date tương ứng	⬜
AC2	Kéo thả đổi ngày	Task hiển thị trên calendar	Kéo task sang ngày khác	due_date cập nhật theo ngày mới	⬜

UI Requirements:
•	Month/Week/Day calendar view
•	Task cards trên calendar cells
•	Drag to reschedule

Technical Notes:
• Calendar component (react-big-calendar hoặc fullcalendar)
• PATCH task due_date on drag


US-038: Timeline / Gantt View
Priority	P2 - Nice to Have
Persona	Project Owner
Epic	Epic 10: Dashboard & Views
Sprint	Sprint 6
Estimate	8 SP

User Story:
As a Project Owner
I want to view tasks on a Gantt timeline with dependency arrows
So that I can visualize project schedule, critical path and task relationships

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị timeline	Tasks có start_date và due_date	Mở Timeline View	Tasks hiển thị dạng horizontal bars trên timeline	⬜
AC2	Dependency arrows	Task A blocks Task B	Xem Timeline	Mũi tên nối từ Task A sang Task B	⬜

UI Requirements:
•	Gantt chart với horizontal bars
•	Dependency arrows
•	Zoom: day/week/month

Technical Notes:
• Gantt chart library
• TaskDependency data cho arrows
• start_date + due_date cho bar positions


 
Tài liệu liên quan
•	PRD - Product Requirements Document (prd.md)
•	SOP - Quy trình vận hành tiêu chuẩn (sop.md)
•	Data Model - 16 implemented models
•	API Specs - RESTful endpoints
•	UI Specs - Frontend pages (15+)

Mỗi User Story được hoàn thành phải có tất cả Acceptance Criteria pass.
