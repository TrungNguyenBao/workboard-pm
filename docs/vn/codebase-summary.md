# Tóm tắt Mã nguồn A-ERP

**Thời gian tạo:** 2026-03-03
**Dựa trên commit:** Triển khai HRM mới nhất

---

## Tổng quan

**A-ERP** (Nền tảng Nguồn lực Doanh nghiệp Đại lý) là một hệ thống ERP đa khách thuê, có cấu trúc mô-đun được xây dựng với FastAPI (backend) và React 18 + Vite (frontend). Nền tảng được kiến trúc để có thể mở rộng qua bốn module doanh nghiệp:

- **PMS** — Hệ thống Quản lý Dự án (Đã triển khai đầy đủ)
- **WMS** — Hệ thống Quản lý Kho hàng (Đã triển khai đầy đủ)
- **HRM** — Hệ thống Quản trị Nhân sự (Đã triển khai đầy đủ)
- **CRM** — Hệ thống Quản trị Quan hệ Khách hàng (Đã triển khai đầy đủ)

**Technology Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy 2.0 ORM, PostgreSQL 15, Redis 7, Alembic migrations
- Frontend: React 18, TypeScript, TanStack Query v5, Zustand, Tailwind CSS, shadcn/ui
- Triển khai: Docker Compose (dev), chế bản sản xuất đa giai đoạn, Nginx proxy, ghi chú nhật ký có cấu trúc

---

## Kiến trúc Backend (309 tệp, 211k token)

### Cấu trúc thư mục

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── router.py                    # Tổng hợp tất cả các router module
│   │   └── routers/                     # Endpoint dùng chung (auth, workspaces, teams, notifications, SSE, agents)
│   ├── models/                          # Các mô hình ORM dùng chung (User, Workspace, Team, Token)
│   ├── schemas/                         # Các mô hình Pydantic dùng chung (auth, workspace, team, pagination)
│   ├── services/                        # Logic nghiệp vụ dùng chung (auth, workspace, notifications, SSE)
│   ├── dependencies/                    # Hàm Depends() có thể tái sử dụng (auth, RBAC)
│   ├── core/
│   │   ├── config.py                    # Xác thực môi trường + cài đặt
│   │   ├── database.py                  # Engine Async SQLAlchemy + session factory
│   │   ├── security.py                  # Tiện ích hàm băm mật khẩu + JWT
│   │   └── logging_config.py            # Ghi nhật ký JSON có cấu trúc (structlog)
│   ├── modules/                         # Các module tính năng (PMS, WMS, HRM, CRM)
│   │   ├── pms/                         # Hệ thống Quản lý Dự án (hoàn thành)
│   │   ├── wms/                         # Hệ thống Quản lý Kho hàng (hoàn thành)
│   │   ├── hrm/                         # Quản trị Nhân sự (hoàn thành)
│   │   └── crm/                         # Quản trị Quan hệ Khách hàng (hoàn thành)
│   ├── agents/                          # Lớp điều phối tác nhân
│   │   ├── base.py                      # BaseAgent trừu tượng
│   │   ├── registry.py                  # Đăng ký + tra cứu agent
│   │   ├── orchestrator.py              # Định tuyến liên module
│   │   └── {pms,wms,hrm,crm}_agent.py  # Đại lý stub cho domain
│   ├── mcp/                             # Lớp giao thức Context Model
│   │   ├── protocol.py                  # Mô hình Pydantic MCPEnvelope
│   │   ├── bus.py                       # Bus sự kiện pub/sub trong tiến trình
│   │   ├── context.py                   # Kho lưu giá trị khóa dùng chung
│   │   └── policy.py                    # Quy tắc quản trị + nhật ký kiểm toán
│   ├── worker/                          # Định nghĩa công việc nền ARQ
│   └── main.py                          # Khởi tạo ứng dụng FastAPI
├── alembic/
│   ├── env.py                           # Biến thực thi Migration
│   └── versions/
│       ├── 0001_initial_schema.py       # Các bảng nòng cốt (users, workspaces, teams, projects, tasks, v.v.)
│       ├── 0002_add_activity_log.py     # Dấu vết kiểm toán hoạt động
│       ├── 0003_add_task_start_date.py  # Trường dòng thời gian tác vụ
│       ├── 0004_add_recurring_task_fields.py  # Hỗ trợ tác vụ lặp lại
│       ├── 0005_add_custom_fields.py    # Định nghĩa trường động cho mỗi dự án
│       ├── 0006_add_goals.py            # Quản lý mục tiêu + danh mục
│       ├── 0007_add_hrm_leave_payroll_tables.py  # HRM gồm loại nghỉ, yêu cầu, hồ sơ bảng lương
│       └── 203a42c349d6_wms_add_products_devices_suppliers_.py  # WMS mở rộng (sản phẩm, thiết bị, NCC)
├── pyproject.toml                       # Siêu dữ liệu dự án (uv, package name: a-erp-backend)
├── alembic.ini                          # Cấu hình Alembic
└── Dockerfile                           # Hình ảnh sản xuất đa giai đoạn
```

### Kiến trúc Module

Mỗi module (PMS, WMS, HRM, CRM) đều tuân theo cấu trúc nhất quán như sau:

```
modules/{module}/
├── router.py                     # Aggregator router module (gắn các sub-routers)
├── routers/                      # Tệp HTTP endpoint (một cho mỗi đối tượng)
├── services/                     # Lớp logic nghiệp vụ
├── models/                       # Các ORM models của SQLAlchemy
├── schemas/                      # Các mô hình Pydantic request/response
└── dependencies/                 # Module kiểm tra RBAC (áp dụng nếu có)
```

**Ví dụ: Module WMS**

```
modules/wms/
├── router.py
├── routers/
│   ├── warehouses.py    → GET/POST /wms/warehouses, /{id}, PATCH/{id}, DELETE/{id}
│   ├── products.py      → GET/POST /wms/products, /{id}, PATCH/{id}, DELETE/{id}
│   ├── devices.py       → GET/POST /wms/devices, /{id}, PATCH/{id}, DELETE/{id}
│   ├── suppliers.py     → GET/POST /wms/suppliers, /{id}, PATCH/{id}, DELETE/{id}
│   └── inventory_items.py → GET/POST /wms/inventory, /{id}, PATCH/{id}, DELETE/{id}
├── services/
│   ├── warehouse.py     # CRUD, truy vấn scope cấp workspace
│   ├── product.py
│   ├── device.py
│   ├── supplier.py
│   └── inventory_item.py
├── models/
│   ├── warehouse.py     # Mô hình ORM Warehouse
│   ├── product.py       # Mô hình ORM WmsProduct
│   ├── device.py        # Mô hình ORM WmsDevice
│   ├── supplier.py      # Mô hình ORM WmsSupplier
│   └── inventory_item.py # Mô hình ORM InventoryItem
├── schemas/
│   ├── warehouse.py     # WarehouseCreate, WarehouseResponse, v.v.
│   ├── product.py       # ProductCreate, ProductResponse, v.v.
│   ├── device.py
│   ├── supplier.py
│   ├── inventory_item.py
│   └── pagination.py    # Mô hình tổng quát của PaginatedResponse[T]
└── dependencies/        # (trống đối với WMS; PMS sử dụng RBAC theo dự án)
```

### Các Mẫu (Patterns) Backend Chính

**Mẫu Router:** Lớp khai báo mỏng xác thực auth/RBAC và điều hướng đến services.

```python
@router.get("/wms/products", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_workspace_role("member")),
):
    return await list_products_service(db, workspace_id=current_user.workspace_id, limit=limit, offset=offset)
```

**Mẫu Service:** Tổng số logic nghiệp vụ + xử lý DB. Sử dụng keyword-only arg (đối số với từ khóa) để ngăn trục trặc thứ tự chạy.

```python
async def create_product(
    db: AsyncSession,
    *,
    workspace_id: UUID,
    name: str,
    sku: str,
    unit_price: float,
) -> WmsProduct:
    product = WmsProduct(workspace_id=workspace_id, name=name, sku=sku, unit_price=unit_price)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product
```

**Mẫu phân trang:** Lớp bao ngoài Generic `PaginatedResponse[T]` kết xuất API dữ liệu (WMS tính theo limit + offset; PMS báo cáo cursor-based cho truy cập log nhật trình).

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
```

**Mẫu ORM:** SQLAlchemy 2.0 có thêm đặc tính khai báo cột typings, mixin, index khóa nối ghép (composite indexes).

```python
class WmsProduct(Base):
    __tablename__ = "wms_products"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    workspace_id: Mapped[UUID] = mapped_column(ForeignKey("workspaces.id"))
    name: Mapped[str]
    sku: Mapped[str]
    description: Mapped[str | None]
    unit_price: Mapped[Decimal]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace: Mapped["Workspace"] = relationship(back_populates="products")
```

---

## Kiến trúc Frontend

### Cấu trúc thư mục

```
frontend/
├── src/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── shell/
│   │   │   │   ├── app-shell.tsx         # Bao vùng layout tổng
│   │   │   │   ├── sidebar.tsx           # Thanh hướng dẫng Module (bộ chuyển PMS/WMS/HRM/CRM)
│   │   │   │   ├── header.tsx            # Thanh top bar bao với user/workspace menu
│   │   │   │   └── keyboard-shortcuts.tsx # Phím tắt nóng Hotkey
│   │   │   └── ui/                       # bọc khối gói giao diện shadcn/ui (nút button, khung báo dialog, v.v.)
│   │   ├── lib/
│   │   │   ├── api.ts                    # Khối nhận trỏ kết cấu gọi API (baseURL, bộ đánh auth headers)
│   │   │   ├── query-client.ts           # Tuỳ chọn kết đối query của nền bản cỗ TanStack
│   │   │   └── utils.ts                  # Utility nhỏ (gồm formatDate, v.v.)
│   │   ├── hooks/
│   │   │   └── use-sse.ts                # Bộ cấu nối quản lý SSE trên mỗi phiên
│   │   └── stores/
│   │       ├── auth.store.ts             # Bộ chứa Zustand với state truy xuất ngầm (token, user, đăng nhập login/logout)
│   │       ├── workspace.store.ts        # Quản chứa workspace tại
│   │       └── module.store.ts           # State nhận mô-đun kích
│   ├── features/                         # Chia vùng các modules chung shared với phần module (auth, notify, v.v.)
│   ├── modules/
│   │   ├── pms/features/                 # Module Hệ thống Quản trị Dự án
│   │   │   ├── dashboard/                # Thông số Overview
│   │   │   ├── projects/                 # Xem ds Project + xem mảng bảng detail
│   │   │   ├── tasks/                    # Truy thao bảng Tasks
│   │   │   ├── goals/                    # Biểu list mục Goals + danh hồ theo dõi goals
│   │   │   └── custom-fields/            # Cấu diện bộ định custom field riêng theo d.án
│   │   ├── wms/features/                 # Module QL Kho hàng
│   │   │   ├── warehouses/               # Tra kho (list) + bộ dialog xử lưu kho (warehouse form)
│   │   │   ├── products/                 # Kho mảng sản phẩm + hook
│   │   │   ├── devices/                  # Danh bảng thiệt bị + móc trỏ
│   │   │   ├── suppliers/                # Mảng bộ nguồn hàng
│   │   │   ├── inventory/                # Trỏ khối item tồn đọng
│   │   │   └── shared/                   # Dữ hệ wms chung chia vùng (page-header, v.v.)
│   │   ├── hrm/features/                 # HCM phần QL nhân sự mảng
│   │   │   ├── departments/              # Bộ q.lý phòng departments 
│   │   │   ├── employees/                # Khối bảng dánh nhân sự (nhân viên filter list)
│   │   │   ├── leave/                    # Trình cấp form nghỉ xin
│   │   │   ├── payroll/                  # Mảng duyệt trả lươnh và xử lý khấu theo hệ hook
│   │   │   └── shared/                   # Cấu khung chung cho hệ nhân sự data-table, mảng phang trang pagination
│   │   └── crm/features/                 # Chăm hệ tệp CRM khách q.hệ
│   │       ├── contacts/                 # Bảng liên kết hệ
│   │       ├── deals/                    # Giá thoả và trích list contact hook
│   │       └── shared/                   # Phần chung dùng CRM hệt chia (data-table, page-header...)
│   ├── app/
│   │   ├── App.tsx                       # Mảng bao Gốc cấp Root 
│   │   └── router.tsx                    # Định router với trỏ phân nhánh routes
│   └── main.tsx
├── vite.config.ts
├── tsconfig.json                         # strict: true
└── Dockerfile                            # Nhiều stage
```

### Mẫu Thư mục Tính năng

```
features/{name}/
├── pages/                                # Component trang cấp route
│   └── {name}-list.tsx
├── components/                           # Các component UI (presentational + container)
│   └── {name}-form-dialog.tsx
├── hooks/                                # TanStack Query hooks
│   └── use-{name}s.ts                   # useQuery, useMutation, queryKey
└── tests/                                # vitest + React Testing Library
```

**Ví dụ WMS: Module Sản phẩm**

```
modules/wms/features/products/
├── pages/
│   └── products-list.tsx                # Trang table list (tạo button)
├── components/
│   └── product-form-dialog.tsx          # Dialog form hiển nhận Zod 
├── hooks/
│   └── use-products.ts                  # Có useProductsList (để query lấy), useCreateProduct 
└── tests/
    └── use-products.test.ts
```

### Quản lý Trạng thái

| Chức năng                                     | Công cụ               | Vị trí                                              |
| --------------------------------------------- | --------------------- | --------------------------------------------------- |
| Trạng thái Server (tasks, projects, products) | TanStack Query v5     | Các hook trong `features/*/hooks/`                  |
| Toàn cục auth + workspace                     | Zustand               | `stores/auth.store.ts`, `stores/workspace.store.ts` |
| Xác thực Form                                 | React Hook Form + Zod | Khai báo trong component hiển form                  |
| UI tuỳ trạng thái                             | useState              | Dùng theo component                                 |

### Tích hợp Thời gian thực

**SSE (Server-Sent Events):**
- `use-sse.ts` thiết lập 1 hàm duy trì event đối nhận `EventSource` từ session người nhận login auth
- Đăng nhập nghe theo hướng nhận tới `/sse?workspace_id={id}`
- Gọi tín sự kiện như: `activity_created`, `notification`
- Đẩy ngưng query (trả gọi lại fetch lại qua queryClient)

---

## Mô hình Đối tượng Dữ liệu (Data Model)

### Bảng chung Core Tables (Shared)

| Bảng                | Cột Mấu chốt                                 | Chức năng (Purpose)                         |
| ------------------- | -------------------------------------------- | ------------------------------------------- |
| `users`             | id, email, name, avatar_url, hashed_password | Xác thực Auth                               |
| `workspaces`        | id, name, slug                               | Quản môi ranh Workspaces phân Tenancy       |
| `workspace_members` | workspace_id, user_id, role                  | Workspace RBAC                              |
| `teams`             | id, workspace_id, name                       | Phân lập Team phụ trợ (nếu có org)          |
| `projects`          | id, workspace_id, name, visibility           | Rổ dự án chức năng Project                  |
| `project_members`   | project_id, user_id, role                    | RBAC dự án qua project roles                |
| `refresh_tokens`    | id, user_id, token_hash, expires_at          | HttpOnly auth cookie auth trỏ Refresh Token |

### Bảng cấu PMS (Project Management System)

| Bảng                                    | Cột mấu chốt                                      | Chức nắng (Purpose)                                     |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `sections`                              | id, project_id, name, position                    | List phần bảng / Kanban cột ban                         |
| `tasks`                                 | id, project_id, section_id, assignee_id, title... | Task con entity (xoá xoá lưu ẩn mềm)                    |
| `task_dependencies`                     | blocking_task_id, blocked_task_id                 | Đối nối khoá của hai task phụ liên chặn                 |
| `task_followers`                        | task_id, user_id                                  | Cập nhật báo notifications theo folow user              |
| `tags`                                  | id, workspace_id, name, color                     | Gắn Tag tên màu phân hạng độ                            |
| `task_tags`                             | task_id, tag_id                                   | Chỉ đối ghép nhãn tags                                  |
| `comments`                              | id, task_id, author_id, body                      | Bình luận dưới task chi tiết                            |
| `attachments`                           | id, task_id, filename, url, size                  | Lữu file trỏ dâng uploads                               |
| `notifications`                         | id, user_id, actor_id, type, title, is_read       | Loại thông báo Notification Enum                        |
| `activity_logs`                         | id, workspace_id, project_id...changes            | Hệ chuỗi append-only cho theo đuôi logs                 |
| `custom_field_definitions`              | id, project_id, name, field_type, is_required...  | Đĩnh nghĩa trường thông linh động cho bảng custom_field |
| `goals`                                 | id, workspace_id, title... progress               | Khoe hồ kho mục Goal Progress                           |
| `goal_project_links`, `goal_task_links` | goal_id, project_id                               | Tuyến kho link truy mục tiêu Goal                       |

### Bảng cấu hệ WMS (Warehouse)

| Bảng              | Cột khoá                                    | Phân chỉ (Purpose)                                       |
| ----------------- | ------------------------------------------- | -------------------------------------------------------- |
| `warehouses`      | id, workspace_id, name, location, is_active | Chỉ dĩnh ghi lưu kho list q.lý                           |
| `wms_products`    | id, workspace_id, sku, name... unit_price   | Kho mục định catalog lưu d.sách sản                      |
| `wms_devices`     | id, workspace_id, device_id, device_type    | Cặp ghi lưu báo trạng phần cứng thiết physical           |
| `wms_suppliers`   | id, workspace_id, name, email               | Đơn vị cung đối cung ứng nhập                            |
| `inventory_items` | id, workspace_id...quantity                 | Ghi mảng trỏ số liệu đếm số unit quantity items nhặt tồn |

### Kho bảng cấu ứng HRM

| Bảng              | Cột khóa                                | Chức phận                                           |
| ----------------- | --------------------------------------- | --------------------------------------------------- |
| `departments`     | id, workspace_id, name, description     | Đơn phòng (departments register)                    |
| `employees`       | id, workspace_id, user_id, name, email  | Danh quản liệt hồ sơ Employees                      |
| `leave_types`     | id, workspace_id, name, days_per_year   | Phân loai ngày xin nghỉ các kiểu days count         |
| `leave_requests`  | id, employee_id, leave_type_id...status | Phân lưu yêu cầu form cấp cho lưu                   |
| `payroll_records` | id, employee_id (FK CASCADE), period... | Lương (gốc + chênh + khấu thuế tríc jsonb payrolls) |

### Tổ bảng thuộc hệ khách CRM

| Bảng       | Cột khóa                        | Nhằm phân                               |
| ---------- | ------------------------------- | --------------------------------------- |
| `contacts` | id, workspace_id, name, company | Hồ sỏ ghi contacts khách list thông tin |
| `deals`    | id, contact_id, title, value    | Kèo kho dự (deals records pipeline)     |

---

## Các tuyến hướng đường API Routes

### API chung chia shared Models (Dành Các Modules)

- `POST /api/v1/auth/login` — Đối truy Authentication (uỷ Login auth)
- `POST /api/v1/auth/register` — Lập Account Đăng kí
- `POST /api/v1/auth/refresh` — Làm mới chũa refresh access token token access chéo
- `GET /api/v1/workspaces` — Liện hồ mục truy cập workspaces trả d.s user mang 
- `POST /api/v1/workspaces` — Cấu không gian khởi tạo thao tạo ws
- `GET /api/v1/sse?workspace_id={id}` — Ghé bắt chuỗi SSE dòng kiện
- `POST /api/v1/agents/{module}/invoke` — Cuộc ngỏ hướng điều phối cho AI agent invoker

### PMS API Định dạng Tuyến

- `GET/POST /api/v1/pms/projects` — Giao CRUD hệ projects 
- `GET/POST /api/v1/pms/projects/{id}/sections` — Hệ bảng cấu cột mục chéo sections CRUD
- `GET/POST /api/v1/pms/projects/{id}/tasks` — Task phân tác crud quản công tác
- `GET/POST /api/v1/pms/projects/{id}/tasks/{id}/comments` — Hệ phản hồi thông cấu comments q.ly
- `GET /api/v1/pms/projects/{id}/activity` — Logs báo cursor page
- `GET/POST /api/v1/pms/goals` — Hồ sơ quản mục tiêu
- `GET/POST /api/v1/pms/projects/{id}/custom-fields` — Truy cấu custom field tuỳ định dạng fields 

### WMS API Routes

- `GET/POST /api/v1/wms/warehouses` — Xem quản trạm (paginated offset)
- `GET/POST /api/v1/wms/products` — Product hệ dánh tạo 
- `GET/POST /api/v1/wms/devices` —  Qly hệ Devices
- `GET/POST /api/v1/wms/suppliers` — Nhập xuất bộ suppliers d/n vị cung
- `GET/POST /api/v1/wms/inventory` — CRUD mục tồn nhặt Item

Các endpoints bên trên dùng Pagination `?limit=20&offset=0`.

### Tuyến đướng HRM API HCM (Quản nhân Sự)

- `POST/GET/GET/:id/PATCH/DELETE /api/v1/hrm/workspaces/{id}/departments` 
- `POST/GET/GET/:id/PATCH/DELETE /api/v1/hrm/workspaces/{id}/employees` 
- `POST/GET/PATCH/DELETE /api/v1/hrm/workspaces/{id}/leave-types` 
- `POST/GET/PATCH/DELETE /api/v1/hrm/workspaces/{id}/leave-requests` 
- `POST /api/v1/hrm/workspaces/{id}/leave-requests/{id}/approve` — Bật cho Appv (admin cấp cao)
- `POST /api/v1/hrm/workspaces/{id}/leave-requests/{id}/reject` — Reject bị chặn (admin only)
- `POST/GET/GET/:id/PATCH/DELETE /api/v1/hrm/workspaces/{id}/payroll-records` — Truy trỏ tiền luơng bảng HRM 

(Áp offset/limit theo app schemas shared)

### CRM Routes (Qh hệ khách CRM)

- `GET/POST /api/v1/crm/workspaces/{id}/contacts` — Contacts khách liên page bảng pagin CRUD
- `GET/POST /api/v1/crm/workspaces/{id}/deals` — Kèo xử cọc (Deals) list paging

---

## Tính năng Chính yếu

### Xác nhận + Chế phân uỷ Authorization
- Access JWT Token lưu cấp nội memory browser an toàn bảo lưu in-memory
- Refresh token được dán HttpOnly dán trả bảo an lưu Database truy băm db băm
- Kiểm phân RBAC thông đối kép cấp hai diện 
   - workspace: guest, member, admin
   - project: viewer, commenter, editor, owner

### Thời gian thực SSE
- Khối phát Server Sent event có luợng Redis trong luồng.
- Phân báo type luông theo `notification`, `activity_created`

---

## Kiểm thử Dòng mã

### Backend 

- Xài in-memory cho sqlite SQLite tích theo file
- Dùng `tests/test_services` và rẽ mirror thư mục gốc
- Fixture test db + user setup test

### Frontend
- vitest bao phủ
- thư bọc mạo gọi Query Client qua wrap `features/*/tests/`

---

## Triển khai
- Docker Compose có Redis, PostgreSql, nGinx
- `docker-compose.yml` có thể dựng trỏ build đa mức slim-build

Được tạo sinh từ Repomix v1.12.0
Tổng: 346 tệp tin, 243k tokens, 992k chars
