# A-ERP — Lộ trình Phát triển

**Cập nhật lần cuối:** 2026-03-03

---

## Giai đoạn 1 — Nền tảng (Hoàn thành)

Cơ sở hạ tầng cốt lõi, xác thực và mô hình dữ liệu.

| Mục                                                                                                    | Trạng thái |
| ------------------------------------------------------------------------------------------------------ | ---------- |
| Khởi tạo dự án FastAPI (uv, Python 3.12)                                                               | Hoàn thành |
| PostgreSQL 15 + Redis 7 thông qua Docker Compose                                                       | Hoàn thành |
| Mô hình async SQLAlchemy 2.0 + Migration Alembic                                                       | Hoàn thành |
| Xác thực JWT (access token trong bộ nhớ + refresh cookie HttpOnly)                                     | Hoàn thành |
| CRUD Không gian làm việc (Workspace) & dự án                                                           | Hoàn thành |
| RBAC: vai trò không gian làm việc (admin/member/guest) + vai trò dự án (owner/editor/commenter/viewer) | Hoàn thành |
| React 18 + Vite + TanStack Query v5 + Zustand                                                          | Hoàn thành |
| Định tuyến bảo vệ + các trang xác thực                                                                 | Hoàn thành |

---

## Giai đoạn 2 — Cốt lõi Quản lý Tác vụ (Hoàn thành)

| Mục                                                                                  | Trạng thái |
| ------------------------------------------------------------------------------------ | ---------- |
| CRUD Tác vụ với xóa mềm (soft delete)                                                | Hoàn thành |
| Các phần (Sections) với kéo thả chỉ mục phân số (fractional indexing)                | Hoàn thành |
| Chế độ xem danh sách (List view)                                                     | Hoàn thành |
| Chế độ xem bảng (Board/kanban view)                                                  | Hoàn thành |
| Board DnD: chèn giữa các tác vụ với chỉ mục phân số                                  | Hoàn thành |
| Chế độ xem lịch (Calendar view)                                                      | Hoàn thành |
| Ngăn chi tiết tác vụ (tiêu đề, mô tả, người được giao, ngày đến hạn, mức độ ưu tiên) | Hoàn thành |
| Tác vụ con (Subtasks) + phụ thuộc tác vụ                                             | Hoàn thành |
| Thẻ (Tags) + tệp đính kèm                                                            | Hoàn thành |
| Người theo dõi tác vụ                                                                | Hoàn thành |
| Tìm kiếm toàn văn thông qua trigger tsvector của PostgreSQL                          | Hoàn thành |
| Bảng lệnh (Command palette/cmdk)                                                     | Hoàn thành |

---

## Giai đoạn 3 — Thời gian thực & Cộng tác (Hoàn thành)

| Mục                                                                         | Trạng thái |
| --------------------------------------------------------------------------- | ---------- |
| Broker SSE (publish/subscribe trong tiến trình cho mỗi không gian làm việc) | Hoàn thành |
| Sự kiện cập nhật tác vụ và phần được đẩy qua SSE                            | Hoàn thành |
| Hệ thống thông báo với huy hiệu chưa đọc                                    | Hoàn thành |
| Thông báo tạo bình luận/nhắc đến (mention)                                  | Hoàn thành |
| Thông báo phân công                                                         | Hoàn thành |
| UI quản lý thành viên không gian làm việc                                   | Hoàn thành |

---

## Giai đoạn 4 — Nhật ký Hoạt động & Dấu vết Kiểm toán (Hoàn thành)

| Mục                                                          | Trạng thái |
| ------------------------------------------------------------ | ---------- |
| Bảng `activity_logs` có theo dõi thay đổi bằng JSONB         | Hoàn thành |
| Dịch vụ `create_activity()` + phát SSE khi ghi               | Hoàn thành |
| Phân trang dựa trên con trỏ cho các luồng hoạt động          | Hoàn thành |
| Dòng thời gian hoạt động cấp dự án (`activity-timeline.tsx`) | Hoàn thành |
| Bảng lịch sử cấp tác vụ trong ngăn (`task-activity.tsx`)     | Hoàn thành |
| Các sự kiện hoạt động từ dịch vụ tác vụ / bình luận / dự án  | Hoàn thành |
| Endpoint `GET /projects/{id}/activity`                       | Hoàn thành |
| Endpoint `GET /projects/{id}/tasks/{id}/activity`            | Hoàn thành |

---

## Giai đoạn 5 — Hoàn thiện & Sẵn sàng Sản xuất (Đã lên kế hoạch)

| Mục                                                            | Trạng thái      |
| -------------------------------------------------------------- | --------------- |
| Chế bản (build) sản xuất đa giai đoạn với Docker               | Hoàn thành      |
| Cấu hình reverse proxy Nginx                                   | Hoàn thành      |
| Xác thực cấu hình dựa trên môi trường khi khởi động            | Hoàn thành      |
| Giới hạn tỷ lệ (Rate limiting) cho mỗi route thông qua slowapi | Hoàn thành      |
| Ghi chú nhật ký JSON có cấu trúc (structlog)                   | Hoàn thành      |
| Kiểm thử E2E (Playwright)                                      | Đã lên kế hoạch |
| Lưu trữ tệp MinIO / S3 cho các tệp đính kèm                    | Đã lên kế hoạch |
| Giao email qua thông báo (Công việc nền ARQ)                   | Đã lên kế hoạch |

---

## Giai đoạn 6 — Các Tính năng Nâng cao (Hoàn thành)

| Mục                                                          | Trạng thái                         |
| ------------------------------------------------------------ | ---------------------------------- |
| Chế độ xem Dòng thời gian / Gantt                            | Hoàn thành                         |
| Các tác vụ lặp lại                                           | Hoàn thành                         |
| Các trường tùy chỉnh (Custom fields)                         | Hoàn thành                         |
| Danh mục đầu tư / Theo dõi mục tiêu                          | Hoàn thành                         |
| Nâng cấp PostgreSQL FTS → Meilisearch                        | Trong danh sách tồn đọng (Backlog) |
| Broker SSE → Redis Pub/Sub cho đa phiên bản (multi-instance) | Trong danh sách tồn đọng           |
| Webhook cho các tích hợp bên ngoài                           | Trong danh sách tồn đọng           |
| API công khai với xác thực API key                           | Trong danh sách tồn đọng           |

---

## Giai đoạn 7 — Tái cấu trúc A-ERP (Hoàn thành)

Đã chuyển đổi WorkBoard thành A-ERP (Nền tảng Nguồn lực Doanh nghiệp Đại lý) với kiến trúc mô-đun.

| Mục                                                                                                                     | Trạng thái |
| ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| Backend: Tách module PMS (`modules/pms/`)                                                                               | Hoàn thành |
| Backend: WMS đầy đủ CRUD (Các mô hình, dịch vụ, router, schema của Product, Device, Supplier, Warehouse, InventoryItem) | Hoàn thành |
| Backend: Các endpoint API phân trang WMS với generic `PaginatedResponse`                                                | Hoàn thành |
| Backend: Migration Alembic WMS (các bảng wms_products, wms_devices, wms_suppliers)                                      | Hoàn thành |
| Backend: Khởi tạo module HRM (Department, Employee)                                                                     | Hoàn thành |
| Backend: Khởi tạo module CRM (Contact, Deal)                                                                            | Hoàn thành |
| Backend: Lớp tác nhân (BaseAgent, registry, orchestrator, domain stubs)                                                 | Hoàn thành |
| Backend: Lớp giao thức MCP (envelope, bus, context, policy)                                                             | Hoàn thành |
| Frontend: Tách module PMS (`modules/pms/features/`)                                                                     | Hoàn thành |
| Frontend: WMS đầy đủ UI (5 trang danh sách, 5 hộp thoại biểu mẫu, 5 hook TanStack Query, 3 thành phần chia sẻ)          | Hoàn thành |
| Frontend: Các thành phần chia sẻ WMS data-table, page-header, pagination                                                | Hoàn thành |
| Frontend: Các thành phần shell (app-shell, sidebar, module-switcher)                                                    | Hoàn thành |
| Frontend: Các tuyến có tiền tố module (`/pms/*`, `/wms/*`, `/hrm`, `/crm`)                                              | Hoàn thành |
| Frontend: Chuyển đổi URL API (`/projects/` → `/pms/projects/`)                                                          | Hoàn thành |
| Frontend: Các trang giữ chỗ (placeholder) HRM                                                                           | Hoàn thành |
| Frontend: CRM đầy đủ UI (danh sách contacts + deals, hộp thoại biểu mẫu, hooks, phân trang, lọc)                        | Hoàn thành |
| Cấu hình: Đổi tên pyproject.toml thành a-erp-backend                                                                    | Hoàn thành |
| Tài liệu: Cập nhật CLAUDE.md, system-architecture, roadmap, changelog                                                   | Hoàn thành |

---

## Giai đoạn 8 — Triển khai Module HRM (Hoàn thành)

Module HRM đầy đủ với phân trang/lọc, quản lý nghỉ phép và theo dõi bảng lương.

| Mục                                                                                                       | Trạng thái |
| --------------------------------------------------------------------------------------------------------- | ---------- |
| Backend: Chuyển schema phân trang sang vùng dùng chung (`schemas/pagination.py`)                          | Hoàn thành |
| Backend: Danh sách phòng ban có phân trang/lọc                                                            | Hoàn thành |
| Backend: Danh sách nhân viên có phân trang/lọc                                                            | Hoàn thành |
| Backend: Các mô hình LeaveType và LeaveRequest với quy trình phê duyệt                                    | Hoàn thành |
| Backend: Mô hình PayrollRecord (lương, các khoản khấu trừ, tiền thưởng)                                   | Hoàn thành |
| Backend: Routers HRM cho các phòng ban, nhân viên, nghỉ phép, bảng lương                                  | Hoàn thành |
| Backend: Migration Alembic 0007 cho tất cả các bảng HRM                                                   | Hoàn thành |
| Frontend: Các thành phần chia sẻ HRM (data-table, page-header, pagination)                                | Hoàn thành |
| Frontend: UI CRUD Phòng ban (danh sách, tạo, sửa, xóa)                                                    | Hoàn thành |
| Frontend: UI CRUD Nhân viên (danh sách, tạo, sửa, xóa, lọc theo phòng ban)                                | Hoàn thành |
| Frontend: UI Yêu cầu nghỉ phép (danh sách, tạo, phê duyệt, từ chối)                                       | Hoàn thành |
| Frontend: UI Hồ sơ Bảng lương (danh sách, tạo, sửa, xóa)                                                  | Hoàn thành |
| Frontend: Router HRM với 4 tuyến con (`/hrm/departments`, `/hrm/employees`, `/hrm/leave`, `/hrm/payroll`) | Hoàn thành |
| Frontend: Điều hướng thanh bên (Sidebar) cho các tính năng HRM                                            | Hoàn thành |
