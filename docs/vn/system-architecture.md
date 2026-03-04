# A-ERP — Kiến trúc Hệ thống (System Architecture)

**Cập nhật lần cuối:** 2026-03-03

---

## Tổng quan cấp cao (High-Level Overview)

```
Trình duyệt (React 18 + Vite)
        │  REST + SSE
        ▼
FastAPI (Python 3.12)
        │
        ├── Module routers  (/pms, /wms, /hrm, /crm)
        ├── Tầng Agent       (BaseAgent → domain stubs → orchestrator)
        ├── Giao thức MCP    (envelope, bus, context, policy)
        ├── PostgreSQL 15    (lưu trữ chính, FTS, đường dẫn LISTEN/NOTIFY có sẵn)
        ├── Redis 7          (ARQ background jobs, bộ nhớ cache phiên)
        └── Lưu trữ file     (local disk dev → MinIO/S3 prod)
```

Tất cả các thành phần chạy qua Docker Compose trong môi trường phát triển (development). Broker SSE hiện tại chạy trong cùng quy trình xử lý (in-process) (chưa sử dụng PostgreSQL LISTEN/NOTIFY; đường dẫn nâng cấp được dự kiến là Redis Pub/Sub cho nhiều instance).

---

## Cấu trúc thư mục (Directory Structure)

```
backend/
  app/
    api/v1/
      router.py          # tổng hợp các router dùng chung + router module
      routers/           # dùng chung: auth, health, workspaces, teams, notifications, sse, agents
    models/              # chỉ dùng chung: user, workspace, team, token, base, enums
    schemas/             # chỉ dùng chung: auth, workspace, team, pagination
    services/            # dùng chung: auth, workspace, notifications
    dependencies/        # dùng chung: auth, workspace RBAC, db session
    core/                # config, database engine, tiện ích bảo mật
    worker/              # định nghĩa các công việc nền ARQ
    modules/
      pms/               # Project Management System (Hệ thống quản lý dự án)
        routers/         # projects, sections, tasks, comments, attachments, tags, custom_fields, goals, activity
        services/        # task, project, comment, attachment, activity_log, recurring_tasks, custom_field, goal
        models/          # project, task, comment, attachment, tag, notification, activity_log, custom_field, goal
        schemas/         # project, task, comment, attachment, notification, activity_log, custom_field, goal
        dependencies/    # RBAC cấp dự án (require_project_role)
        router.py        # tổng hợp các router PMS dưới tiền tố /pms
      wms/               # Kho hàng - Warehouse Management System
        routers/         # warehouses, products, devices, suppliers, inventory_items
        services/        # warehouse, product, device, supplier, inventory_item
        models/          # warehouse, product, device, supplier, inventory_item
        schemas/         # warehouse, product, device, supplier, inventory_item
        router.py        # tổng hợp các router WMS dưới tiền tố /wms
      hrm/               # Nhân sự - Human Resource Management
        routers/         # departments, employees, leave_requests, payroll_records
        services/        # department, employee, leave_request, payroll_record
        models/          # department, employee, leave_type, leave_request, payroll_record
        schemas/         # department, employee, leave_request, payroll_record
        router.py        # tổng hợp các router HRM dưới tiền tố /hrm
      crm/               # Khách hàng - Customer Relationship Management
        routers/         # contacts, deals
        services/        # contact, deal
        models/          # contact, deal
        schemas/         # contact, deal
        router.py        # tổng hợp các router CRM dưới tiền tố /crm
    agents/              # Tầng điều phối Agent
      base.py            # abstract BaseAgent ABC
      registry.py        # đăng ký + tra cứu agent
      orchestrator.py    # định tuyến xuyên module (cross-module routing)
      {pms,wms,hrm,crm}_agent.py  # các stub domain agent
    mcp/                 # Tầng Model Context Protocol
      protocol.py        # Pydantic model cho MCPEnvelope
      bus.py             # in-process pub/sub event bus
      context.py         # bộ lưu trữ key-value dùng chung
      policy.py          # các quy tắc quản trị + log hệ thống (audit log)
  alembic/               # phiên bản migration
frontend/
  src/
    shared/
      components/
        shell/           # app-shell, sidebar, header, module-switcher, keyboard-shortcuts
        ui/              # các wrapper cho component shadcn
      lib/               # api, query-client, utils
    features/            # dùng chung: auth, notifications, search, settings, workspaces
    modules/
      pms/features/      # dashboard, projects, tasks, goals, custom-fields
      wms/features/      # warehouses, products, devices, suppliers, inventory; shared components (data-table, page-header, pagination)
      hrm/features/      # departments, employees, leave requests, payroll records; shared components (data-table, page-header, pagination)
      crm/features/      # contacts, deals (shared: data-table, page-header, pagination)
    stores/              # Zustand: auth, workspace, module
    app/                 # App.tsx, router.tsx
docker-compose.yml
Makefile
```

---

## Trách nhiệm của các tầng Backend

| Tầng (Layer)         | Vị trí (Location)                               | Trách nhiệm (Responsibility)                                                               |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Router (dùng chung)  | `api/v1/routers/`                               | Các điểm cuối HTTP dùng chung: auth, health, workspaces, teams, notifications, SSE, agents |
| Router (module)      | `modules/{mod}/routers/`                        | Các điểm cuối HTTP theo module, tiền tố là `/{mod}`                                        |
| Service (dùng chung) | `services/`                                     | Auth, workspace, SSE publish                                                               |
| Service (module)     | `modules/{mod}/services/`                       | Logic nghiệp vụ riêng của module, thao tác DB                                              |
| Model (dùng chung)   | `models/`                                       | Các bảng dùng chung: user, workspace, team, token                                          |
| Model (module)       | `modules/{mod}/models/`                         | Các bảng riêng theo module                                                                 |
| Schema               | `schemas/` + `modules/{mod}/schemas/`           | Cấu trúc request/response của Pydantic                                                     |
| Dependency           | `dependencies/` + `modules/{mod}/dependencies/` | Hàm tái sử dụng `Depends()` — chức năng auth, RBAC                                         |
| Core                 | `core/`                                         | Cấu hình app (`settings`), DB engine async, Helper hỗ trợ JWT/password                     |
| Worker               | `worker/`                                       | Công việc bất đồng bộ ARQ (email, các job lên lịch sẵn)                                    |
| Agent                | `agents/`                                       | Module domain agent stubs với capabilities, orchestrator cho định tuyến chéo module        |
| MCP                  | `mcp/`                                          | Giao thức truyền thông module nội bộ với audit                                             |

### Mẫu phân trang (Pagination Pattern)

Tất cả các module sử dụng sơ đồ **generic `PaginatedResponse`** cho thao tác danh sách:

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
```

Dùng trong các router như `GET /wms/products?limit=20&offset=0` → trả về `PaginatedResponse[ProductResponse]`.
Nằm tại `app/schemas/pagination.py` để tái sử dụng ở WMS, HRM, CRM modules.

---

## Mô hình Dữ liệu (Data Model)

### Các bảng cấu hình chung (Core Tables)

| Bảng (Table)        | Các cột chính (Key Columns)                                                                                             | Chú thích (Notes)                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `users`             | `id`, `email`, `name`, `avatar_url`, `hashed_password`                                                                  | Mật khẩu bcrypt                                                               |
| `workspaces`        | `id`, `name`, `slug`                                                                                                    | Phân tách cấp độ cao nhất                                                     |
| `workspace_members` | `workspace_id`, `user_id`, `role`                                                                                       | Các vai trò: admin / member / guest                                           |
| `teams`             | `id`, `workspace_id`, `name`                                                                                            | Nhóm con không bắt buộc trong workspace                                       |
| `projects`          | `id`, `workspace_id`, `name`, `visibility`                                                                              | Khả năng xem: private / team / public                                         |
| `project_members`   | `project_id`, `user_id`, `role`                                                                                         | Vai trò dự án: owner / editor / commenter / viewer                            |
| `sections`          | `id`, `project_id`, `name`, `position`                                                                                  | Cột Kanban / Section danh sách                                                |
| `tasks`             | `id`, `project_id`, `section_id`, `assignee_id`, `title`, `status`, `priority`, `position`, `due_date`, `search_vector` | Xóa mềm (Soft delete); Vị trí lập chỉ mục phân số (fractional index position) |
| `task_dependencies` | `blocking_task_id`, `blocked_task_id`                                                                                   | Ràng buộc duy nhất (Unique constraint)                                        |
| `task_followers`    | `task_id`, `user_id`                                                                                                    | Theo dõi và nhận thông báo theo kiện task                                     |
| `task_tags`         | `task_id`, `tag_id`                                                                                                     | Điểm giao Junction                                                            |
| `tags`              | `id`, `workspace_id`, `name`, `color`                                                                                   | Phạm vi theo workspace                                                        |
| `comments`          | `id`, `task_id`, `author_id`, `body`                                                                                    | Nội dung văn bản Rich text                                                    |
| `attachments`       | `id`, `task_id`, `filename`, `url`, `size`                                                                              | Upload file                                                                   |
| `notifications`     | `id`, `user_id`, `actor_id`, `type`, `title`, `is_read`                                                                 | Typed enum                                                                    |
| `activity_logs`     | `id`, `workspace_id`, `project_id`, `entity_type`, `entity_id`, `actor_id`, `action`, `changes`                         | Tracking dán thay đổi JSONB; cursor-paginated                                 |
| `refresh_tokens`    | `id`, `user_id`, `token_hash`, `expires_at`                                                                             | Cách dùng chiến lược cookie HttpOnly                                          |

### Các Bảng WMS (WMS Tables)

| Table             | Key Columns                                                             | Notes                                    |
| ----------------- | ----------------------------------------------------------------------- | ---------------------------------------- |
| `warehouses`      | `id`, `name`, `location`, `workspace_id`, `is_active`                   | Workspace-scoped                         |
| `wms_products`    | `id`, `sku`, `name`, `description`, `unit_price`, `workspace_id`        | Workspace-scoped                         |
| `wms_devices`     | `id`, `device_id`, `device_type`, `location`, `status`, `workspace_id`  | Workspace-scoped; track physical devices |
| `wms_suppliers`   | `id`, `name`, `email`, `phone`, `address`, `workspace_id`               | Workspace-scoped supplier registry       |
| `inventory_items` | `id`, `sku`, `name`, `quantity`, `unit`, `warehouse_id`, `workspace_id` | Khóa FK nối về warehouse                 |

### Các Bảng HRM (HRM Tables)

| Table             | Key Columns                                                                                                                                            | Notes                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `departments`     | `id`, `name`, `description`, `workspace_id`, `created_at`, `updated_at`                                                                                | Giới hạn Workspace-scoped                                                            |
| `employees`       | `id`, `name`, `email`, `position`, `hire_date`, `department_id`, `workspace_id`, `created_at`, `updated_at`                                            | Khóa ngoại FK về department; Optional FK tới user; tìm kiếm ILIKE tìm kiếm tên/email |
| `leave_types`     | `id`, `name`, `description`, `workspace_id`, `created_at`                                                                                              | Cấu hình danh mục loại phép nghỉ                                                     |
| `leave_requests`  | `id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `status` ('pending'/'approved'/'rejected'), `workspace_id`, `created_at`, `updated_at` | Hệ thống quy trình chờ admin duyệt; Cascade delete xóa chung khi employee bị xóa     |
| `payroll_records` | `id`, `employee_id`, `month`, `salary`, `deductions`, `bonus`, `workspace_id`, `created_at`, `updated_at`                                              | Chỉ giữ sổ; chưa thiết logic tự động tính số tiền; Cascade delete xóa theo employee  |

### Các Bảng CRM (CRM Tables)

| Table      | Key Columns                                                                               | Notes                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `contacts` | `id`, `name`, `email`, `phone`, `company`, `workspace_id`, `created_at`, `updated_at`     | Workspace-scoped; EmailStr validation; Tìm kiếm ILIKE search trên các trường name/email/company          |
| `deals`    | `id`, `title`, `value`, `stage`, `contact_id`, `workspace_id`, `created_at`, `updated_at` | FK về contact; Trạng thái mặc định stage='lead'; Lọc (filtering) được nhóm theo phạm vi workspace-scoped |

### Các thiết lập Index quan trọng (Key Indexes)

| Index                          | Table           | Mục đích (Purpose)                                                |
| ------------------------------ | --------------- | ----------------------------------------------------------------- |
| `ix_tasks_search_vector` (GIN) | `tasks`         | Tìm kiếm toàn văn (Full-text search)                              |
| `ix_tasks_project_position`    | `tasks`         | Truy vấn danh sách/bảng được sắp xếp (Ordered list/board queries) |
| `ix_tasks_section_position`    | `tasks`         | Sắp xếp trong phạm vi section                                     |
| `ix_activity_logs_entity`      | `activity_logs` | `(entity_type, entity_id)` — kiểm tra theo task history           |
| `ix_activity_logs_created_at`  | `activity_logs` | Cursor pagination phân trang liên kết                             |

---

## Luồng Xác thực (Authentication Flow)

```
Login → POST /auth/login
  → trả về: access_token (trong JSON body, lưu trên memory)
             refresh_token (qua HttpOnly cookie, hiệu lực thời gian sống 30-ngày expiry)

Request yêu cầu chứng thực:
  Authorization: Bearer <access_token>

Gia hạn mã Token refresh → POST /auth/refresh
  → đọc HttpOnly cookie
  → trả về access_token thẻ mới (new)
```

- Access token: Dùng JWT với vòng đời ngắn, tuyệt đối không được viết vào `localStorage`.
- Refresh token: Được cất giữ trong dạng `HttpOnly` cookie; lưu trữ dạng bảng băm hash trong bảng `refresh_tokens`.
- Mật khẩu: Chế độ bcrypt qua thư viện `passlib`.

---

## Mô hình Phân quyền RBAC (RBAC Model)

Bao gồm hai chiều vai trò (role dimensions) được dùng để check xác thực cho mỗi một lượt request:

| Chiều kiểm tra | Vai trò từ thấp → cao               | Kiểm chứng độc quyền qua hàm                   |
| -------------- | ----------------------------------- | ---------------------------------------------- |
| Workspace      | guest → member → admin              | Cấu hình `require_workspace_role()` dependency |
| Project        | viewer → commenter → editor → owner | Cấu hình `require_project_role()` dependency   |

Vai trò `require_project_role("viewer")` xem là điểm kiểm cổng cửa minimum gate thấp nhất cần cho toàn bộ API activity endpoints.

---

## Tính năng Thời gian thực (Real-time SSE)

```
Client                         Server
  │── GET /sse?workspace_id ──▶ SSE endpoint bắt đầu đăng ký đón luồng queue
  │◀── event: stream ──────────
  │                             Bất kỳ cấu service nào gọi publish(workspace_id, event)
  │◀── data: {"type": ...} ─── Luồng gửi đến luồng tất cả các khối theo subscribe
```

- Hệ thống phân luồng Broker (in-process): sử dụng `dict[workspace_id → set[asyncio.Queue]]` trong tập tin `services/notifications.py`.
- Mỗi không gian làm việc (workspace) có những tập hợp subscriber riêng biệt cách ly vùng kín.
- Hiệu suất Consumer bị chậm nạp (Slow consumers): dữ liệu bị tự bỏ dropped khi cấu queue tải hàng đã đầy nhấp luồng full nấc chặn ngưỡng (maxsize=100), ko có xử lý chặn dồn kênh.
- Chỉ có event type hiện có bắn ra SSE event là: `notification`, `activity_created`.
- Tầng giao diện Frontend xử lí event trong: `use-sse.ts` qua cơ chế ngắt nháy invalidation làm mới dữ liệu lại của thư viên kẹp dán TanStack Query invalidation.
- Nâng cấp: Nâng hạ tầng lên Redis Pub/Sub sẽ cần thêm khi scale chạy nhiều instance.

---

## Activity Log (Nhật ký sự kiện)

Module nhật ký sự kiện activity log lưu toàn bộ thông tin audit log append-only theo phạm vi workspace.

### Ghi Dữ liệu Path

```
hàm API service function (task / comment / project)
  └── create_activity(db, workspace_id, project_id, entity_type, entity_id,
                       actor_id, action, changes)
         ├── lệnh INSERT INTO bảng activity_logs
         └── tạo luồng SSE publish thông báo (workspace_id, {type: "activity_created", ...})
```

Thông tin thay đổi `changes` sẽ mang hình thức gõ tự do form JSONB format. Quy định bắt gặp riêng (Convention) được cấu hình dịch vụ task: `{"field": {"old": ..., "new": ...}}` sử dụng cập nhật thông báo (update events).

### Đọc Dữ liệu Read Path

```
GET /projects/{project_id}/activity?limit=50&cursor=<uuid>
GET /projects/{project_id}/tasks/{task_id}/activity?limit=20

hàm xử lý list_activity(db, project_id | entity_type + entity_id, limit, cursor)
  └── lồng qua câu UPDATE SQL gõ lệnh SELECT … ORDER BY created_at DESC LIMIT n
      (giới hạn cursor: WHERE created_at < cursor_entry.created_at)
```

Schema kết quả nhận Response định chuẩn form shape (`ActivityLogResponse`):

| Thuộc tính (Field) | Hệ Loại Dữ Liệu (Type) | Nguồn cấp trích xuất (Source)                                                              |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------ |
| `id`               | `UUID`                 | `activity_logs.id`                                                                         |
| `entity_type`      | `str`                  | e.g. `"task"`, `"project"`, `"comment"`                                                    |
| `entity_id`        | `UUID`                 |                                                                                            |
| `action`           | `str`                  | e.g. `"created"`, `"updated"`, `"deleted"`                                                 |
| `changes`          | `dict \| null`         | Phân khung biến dạng mảng JSONB field                                                      |
| `actor_name`       | `str`                  | Lazy/Eager load lôi vào kết hợp nấc gộp load nẩy qua hàm `selectinload(ActivityLog.actor)` |
| `actor_avatar_url` | `str \| null`          |                                                                                            |
| `created_at`       | `datetime`             |                                                                                            |

---

## Kiến trúc Frontend

### Quản lý Trạng thái (State Management)

| Mối quan tâm                                                  | Công cụ (Tool)        | Vị trí (Location)                                   |
| ------------------------------------------------------------- | --------------------- | --------------------------------------------------- |
| Server state (kiểm soát nhiệm vụ, dự án, thông tin tài khoản) | TanStack Query v5     | `modules/*/features/*/hooks/` + `features/*/hooks/` |
| Global auth + quản lý không gian tải tài nguyên (workspace)   | Zustand               | `stores/auth.store.ts`, `stores/workspace.store.ts` |
| Quản lý thiết lập module hiển thị (module active state)       | Zustand               | `stores/module.store.ts`                            |
| Các Form components input nhập                                | React Hook Form + Zod | Khắc dấu inline tuỳ cấu gắn form component          |

### Thư viện thành phần (UI & Interaction Libraries)

| Thành phần                                              | Thư viện (Library)                                     | Tình trạng áp dụng (Usage)                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Phản ứng kéo và rê (Drag-and-drop)                      | `@dnd-kit` (core, mảng linh hoạt tiện lợi)             | Layout Kanban chức năng chắp kéo thả, tính nấc chỉ mục cho thứ tự index vị trí fractional indexing |
| Thư viện Components (Component library)                 | shadcn/ui (Sử dụng hệ gói core từ Radix UI primitives) | Hỗ trợ chuẩn Buttons, UI dạng ngăn modals, dropdowns, tabs, toast hiển thị báo nhẹ, tooltips       |
| Công cụ thiết kế biểu tượng (Icons)                     | lucide-react                                           | Nút mờ thiết kế đường giao thông mảng mảnh icon                                                    |
| Trình điều hướng kiểu hiển thị dạng mẫu (CSS utilities) | Tailwind CSS                                           | Xén gọt thiết kế Styling + tích hợp `tailwindcss-animate` để làm gân hiệu ứng transitions          |

**Xây dựng Giao diện Kanban Board:**
- `board.tsx` lắp ráp tính năng kanban board list dạng cuộn có tính năng drag-drop.
- `board-task-card.tsx` — cấu trúc hộp nhỏ card đại diện nhiệm vụ thẻ kéo.
- `board-kanban-column.tsx` — mảng thả kéo vào bến, hoặc khi nãy vào thả tại vùng khe không hụt empty.
- `board-add-section-input.tsx` — thanh input hiển thị cho việc đặt tạo list mới form.
- Cơ chế va chạm (Collision detection): tính theo cấu hình chiến lược `closestCorners` lấy phản ứng thị giác ngon êm trơn nhẹ.
- Tự kéo độ phân đoạn vị trí theo Position Index (fractional indexing): thuật lấy hệ phân độ vị trí ngầm ẩn gá nắn cho position (gá = (prev + next) / 2) làm hụt bị lọi trượt ngăn trùng lặp ID (conflicts) vứt chặn mốc concurrent bị xử lí moves.
- Thao tác kéo mác móc nhóp xử lí cập gá lọt mốc lạc cập UI theo cấu trúc Optimistic trong hook `useMoveTask` nạy cọc hook dính lòi rọt (với TanStack Query `onMutate`/`onError`/`onSettled`) giúp mác cho lòi thấy màn kéo bọc phản báo nhanh tạt êm tết phản mác chöp feedback mọc.

### Cấu trúc tính năng (Feature Structure)

Các thư mục chạy cho module (Shared features) định ngòi `frontend/src/features/`. Trọng điểm sẽ định ngòi theo hộc mảng Module-specific tính năng rút dưới mục theo mảng `frontend/src/modules/{mod}/features/`:

```
modules/pms/features/{name}/   # hoặc rút gọi chỏ features/{name}/ nếu dán cắm sài shared chung
  components/   # presentational hiển giao thao tác + container components
  hooks/        # TanStack Query móc xử kết gọi API hooks (dùng nấc lọi báo trỏ cấu dán useQuery, rọt mác cắm gá useMutation)
  pages/        # định trang hiển thị theo route pages
  tests/        # vitest làm test nhép báo bọc rọi kiểm unit tests + component tests
```

### Cấu trúc chia Route liên kết (Route Structure)

Theo dạng Modules có gắn nấc Route tiền tố bọc prefix: `/pms/my-tasks`, `/pms/projects/:id/board`, `/wms`, `/hrm`, `/crm`. Bán nấc thanh nhảy switcher cho phép thao chuyển lướt rút qua chạy qua các luống.

### Gắn nối luồng API (Real-time Integration)

Móc theo module `shared/hooks/use-sse.ts` kết nối lấy một kết bọc cấu luống duy nhật mác cho cổng `EventSource` sau từng chốt authenticate cho mỗi user dính. Trên luống `activity_created` nhảy nhát ngòi luống nó phát queryClient.invalidateQueries chóc đánh bỏ ngưng móc tạt chíp vỉ báo lỏi dán nấc nhét lấy mới dữ cache lọi cho activity. Với thông `notification` báo sự cũng kết invalidation sụt cấu danh mác cache.

---

## Cấu trúc luống HRM Module API

### Thao tác quản Departments Endpoints

| Lệnh Method | Liên kết Endpoint                                      | RBAC Role | Mô tả diễn giải                                                                                           |
| ----------- | ------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------- |
| `POST`      | `/hrm/workspaces/{workspace_id}/departments`           | member+   | Tự tạo mới bộ phòng ban                                                                                   |
| `GET`       | `/hrm/workspaces/{workspace_id}/departments`           | guest+    | DS rút bộ phòng department bọc có châm lòi chức tìm pagination + cấu ILIKE search (tên/mô tả description) |
| `GET`       | `/hrm/workspaces/{workspace_id}/departments/{dept_id}` | guest+    | Lấy info theo dept_id (trả 404 khi báo nạc lệch workspace)                                                |
| `PATCH`     | `/hrm/workspaces/{workspace_id}/departments/{dept_id}` | member+   | Chập đổi mạc update                                                                                       |
| `DELETE`    | `/hrm/workspaces/{workspace_id}/departments/{dept_id}` | admin+    | Xóa xoá bóc                                                                                               |

### Thao tác quản Nhân viên Employees 

| Lệnh Method | Liên kết Endpoint                                   | RBAC Role | Mô tả diễn giải                                                                                                                                                                 |
| ----------- | --------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`      | `/hrm/workspaces/{workspace_id}/employees`          | member+   | Cấu sinh thông nhân viên mới                                                                                                                                                    |
| `GET`       | `/hrm/workspaces/{workspace_id}/employees`          | guest+    | Đẩy cấu List employees lọc theo trang có chức năng pagination, bọc thẻ rút lọc filter phòng ban dept id, trỏ mác tìm kiếm search ILIKE sụt tên/email                            |
| `GET`       | `/hrm/workspaces/{workspace_id}/employees/{emp_id}` | guest+    | Ráp theo gá xem nhân employee bằng id                                                                                                                                           |
| `PATCH`     | `/hrm/workspaces/{workspace_id}/employees/{emp_id}` | member+   | Sửa hộc cập dán nhép mác trường theo employee_id                                                                                                                                |
| `DELETE`    | `/hrm/workspaces/{workspace_id}/employees/{emp_id}` | admin+    | Rụng xoá huỷ bóc luôn rút các luống liên dây bọc rọi rớt con phôi kẹp (liên huỷ kết nối phép con ngòi leave requests, kẹp luôn phần payroll bảng tính bốc records xoá chêm rút) |

### Giao luồng bảng theo Leave Request Endpoints

| Lệnh Method | Liên kết Endpoint                                                | RBAC Role | Mô tả diễn giải                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`      | `/hrm/workspaces/{workspace_id}/leave-requests`                  | member+   | Xin tạo cấu bóc xin phép móc nghỉ mác (create)                                                                                                                  |
| `GET`       | `/hrm/workspaces/{workspace_id}/leave-requests`                  | guest+    | Nháp in xem thông tin danh bọc dán rọi các mẫu List móc lòi dán lọt leave requests báo chặn lọc theo rút dạt ngòi phân trạng trang mác có status thẻ nấc filter |
| `POST`      | `/hrm/workspaces/{workspace_id}/leave-requests/{req_id}/approve` | admin+    | Thẻ móc gá rọi quản nháy duyệt Approve uỷ quyền                                                                                                                 |
| `POST`      | `/hrm/workspaces/{workspace_id}/leave-requests/{req_id}/reject`  | admin+    | Trạm ranh cấu bác nút chóp nhét reject quản huỷ bóc phép                                                                                                        |
| `DELETE`    | `/hrm/workspaces/{workspace_id}/leave-requests/{req_id}`         | admin+    | Ngắt cấu xoá gá Delete vứt rọi request form                                                                                                                     |

### Bảng lương Payroll Record API

| Lệnh Method | Liên kết Endpoint                                         | RBAC Role | Mô tả diễn giải                                                                                               |
| ----------- | --------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `POST`      | `/hrm/workspaces/{workspace_id}/payroll-records`          | member+   | Lập cắm móc báo bảng khai tiền payroll record lương                                                           |
| `GET`       | `/hrm/workspaces/{workspace_id}/payroll-records`          | guest+    | Đẩy lên luống List rọi cấu bảng danh lọc nhát payroll kẹp có phân mốc trang, mác lọc theo employee dán filter |
| `GET`       | `/hrm/workspaces/{workspace_id}/payroll-records/{rec_id}` | guest+    | Trích xem rọt payroll bóc record                                                                              |
| `PATCH`     | `/hrm/workspaces/{workspace_id}/payroll-records/{rec_id}` | member+   | Vá chập mác nấc sửa tiền hộc báo lương móc lĩnh fields dán                                                    |
| `DELETE`    | `/hrm/workspaces/{workspace_id}/payroll-records/{rec_id}` | admin+    | Ngừng cấu Delete rút mọc payroll nhát record                                                                  |

### Bổ rọi cấu Frontend HRM 

- **UI ngòi dùng Shared**: `hrm-data-table`, `hrm-page-header`, `hrm-pagination`
- **Đại gán Routes**: `/hrm/departments`, `/hrm/employees`, `/hrm/leave`, `/hrm/payroll`; menu bên sẽ hiện nhánh móc trỏ khi gá lọi mạc thẻ `activeModule === 'hrm'`
- **TanStack dán State**: kẹp các hooks theo (`useDepartments`, `useEmployees`, `useLeaveRequests`, `usePayrollRecords`) cộng Zustand cấu dán workspace store rút
- **Tìm bóc dán Filter**: sụt cấu ILIKE filtering báo kẹp qua Server-side API và cấu trỏ gá nấc pagination đè chép

---

## Cấu trúc luống CRM Module API

### Vỉ theo ngòi Contacts Endpoints

| Lệnh Method | Liên kết Endpoint                                      | RBAC Role | Mô tả diễn giải                                                                                                                                     |
| ----------- | ------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`      | `/crm/workspaces/{workspace_id}/contacts`              | member+   | Nặn dán rọi khách dán mới (create)                                                                                                                  |
| `GET`       | `/crm/workspaces/{workspace_id}/contacts`              | guest+    | Sổ gá móc trỏ xem List khứa khách rọi danh contacts chỏ dán lọc trỏ paginated tìm bóc dán kẹt tên / thư / và mác hộc luống ILIKE search nấc công ty |
| `GET`       | `/crm/workspaces/{workspace_id}/contacts/{contact_id}` | guest+    | Hiển kẹt lọt nấc rút contact                                                                                                                        |
| `PATCH`     | `/crm/workspaces/{workspace_id}/contacts/{contact_id}` | member+   | Trỏ nắn móc móc lọt dạt vá dán bọc rọi nhét sửa contacts                                                                                            |
| `DELETE`    | `/crm/workspaces/{workspace_id}/contacts/{contact_id}` | admin+    | Chọc đẩy mác huỷ chóp tụi móc bọc vứt                                                                                                               |

### Giao kèo đẩy Deals API

| Lệnh Method | Liên kết Endpoint                                | RBAC Role | Mô tả diễn giải                                                                                                                                             |
| ----------- | ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`      | `/crm/workspaces/{workspace_id}/deals`           | member+   | Chập rọi mạc sinh deal nấc báo nhét chóp value                                                                                                              |
| `GET`       | `/crm/workspaces/{workspace_id}/deals`           | guest+    | List nấc sổ trút dán gá lọc báo kẹp pagination, móc filter rớt rạch theo móc dán nấc stage, kẹp thông trỏ /contact_id/, tìm móc title túm list search title |
| `GET`       | `/crm/workspaces/{workspace_id}/deals/{deal_id}` | guest+    | Hút dán vỉ móc trỏ lọi rút rọt chi tiết cấu móc chóp Deal id                                                                                                |
| `PATCH`     | `/crm/workspaces/{workspace_id}/deals/{deal_id}` | member+   | Vá cấu vá móc sứt                                                                                                                                           |
| `DELETE`    | `/crm/workspaces/{workspace_id}/deals/{deal_id}` | admin+    | Chối dán huỷ cấu Deal rứt rát cấu rút mảng                                                                                                                  |

- Khai mạc **Thẻ mốc móc giai dán Deal stages** (được nhét lọi khai cứng cố theo frontend mác rọi hộc móc `DEAL_STAGES` constant nắn): chỏ rọt ngách lead (tâm khách mở), nấc mọc điểm đủ qualified (có thể đếm nấc), gá bản nạp proposal báo (đưa kèo), kéo vọt cẳng giằng cọc negotiation (ép trả kéo cò), kíp thành móc cửa lọt closed_won kèo thắng (nhận xơi), chuội rới cự bị mất chuồn lật dán rọi closed_lost kèo thọt (bỏ chóp kẹp túi bị thua dạt ngập).

### Cấu nối theo Frontend CRM 

- **Components dùng bọ rọi Shared**: `crm-data-table`, `crm-page-header`, `crm-pagination`
- **Móc Routes**: vọt nhảy từ luống `/crm` bị chốt ném hất vô redirect vào `/crm/contacts`; gắn thanh menu trỏ cho mạc mốc chóp móc gá module móp mạc `activeModule === 'crm'`
- **Query State**: dán vỉ móc theo các hooks mác hộc chóp TanStack Query (`useContacts`, `useDeals`) + hộc rọt Zustand
- **Khai tìm rọt Search**: phân móc dán client-side nhét pagination tạt kết dán chập châm báo nấc ILIKE filtering server đẩy.

---

## Luống kẹp theo Background Jobs (ARQ)

Khay ARQ workers móc hút vô dán rọi chóp túi đầu kẹp Redis phôi:
- Gá khai phôi nắp tạt ở bảng rọt cấu thư trong `backend/app/worker/`.
- Xỏ đưa cắm hàng đẩy dán rọi hàng chờ chạy enqueue bọc bằng móc luống `arq.create_pool()` rọi từ lớp hộc bóp service layer.
- Thực dùng hiện mác tại (Current usage): đẩy mạc báo thông báo thư email bọc sút, nấc rọi túi gửi chuông nhắc hạn (due-date reminders dán rọt).

---

## Khay Tìm Móc Mác Tra Tìm kiếm (Search)

Xài mác rọi dán rọt kẹp đồ gốc của PostgreSQL-native rọt cấu móc tra search mạc đè FTS:
- Tạo mác rọi trạm cò rọt Database trigger giúp chập đắp tụi nhét rọi cột mảng `tasks.search_vector` lọi dán (loại dữ mác tsvector) theo đúc `title || description`.
- Bảng GIN index `ix_tasks_search_vector` sẽ sục nấc móc cho luống đẩy dán `@@` truy nắn queries mác xử báo siêu lọi nhanh móc bọc.
- Bươc nâng cấp dự tính tương lai: Dùng Meilisearch hỗ trợ tìm phân mạc vỉ chóp chéo các cấu thực mác cross-entity mốc dán luống vào trong móc dán hộc một phiên phase ngòi sau rút rọt sau.
