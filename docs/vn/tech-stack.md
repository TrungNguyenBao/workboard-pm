# WorkBoard — Tech Stack (Công nghệ sử dụng)

## Frontend

| Mối quan tâm                     | Lựa chọn                    | Lý do                                                                       |
| -------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| Framework                        | React 18 + TypeScript       | An toàn kiểu dữ liệu (Type safety), hệ sinh thái phong phú                  |
| Công cụ build                    | Vite 5                      | HMR nhanh, hỗ trợ mặc định ESM (ESM-native)                                 |
| Thành phần giao diện (UI)        | shadcn/ui + Tailwind CSS v3 | Quyền làm chủ hoàn toàn, các primitive hỗ trợ trợ năng (a11y) của Radix     |
| Trạng thái Server (Server state) | TanStack Query v5           | Tốt nhất hiện nay về caching và mutations                                   |
| Trạng thái Client (Client state) | Zustand                     | Không gây ra "provider hell" (địa ngục Provider), có devtools               |
| Định tuyến (Routing)             | React Router v6             | Các route được bảo vệ (Protected routes), bố cục lồng nhau (nested layouts) |
| Kéo & thả (Drag & drop)          | @dnd-kit/core               | Hiện đại, hỗ trợ trợ năng (accessible), không dùng jQuery                   |
| Soạn thảo văn bản (Rich text)    | Tiptap (ProseMirror)        | Mô tả công việc dạng WYSIWYG                                                |
| Bảng lệnh (Command palette)      | cmdk                        | Thao tác nhanh ưu tiên bàn phím                                             |
| Biểu tượng (Icons)               | Lucide React                | Dựa trên nét (Stroke-based), phù hợp với bộ font DM Sans                    |
| Thời gian thực (Real-time)       | EventSource (SSE)           | Tự động kết nối lại (Auto-reconnect), thân thiện với proxy                  |
| Biểu mẫu (Forms)                 | React Hook Form + Zod       | Xác thực an toàn kiểu dữ liệu (Type-safe validation)                        |
| Xử lý ngày tháng                 | date-fns                    | Nhẹ hơn so với moment                                                       |

## Backend

| Mối quan tâm                     | Lựa chọn                 | Lý do                                                          |
| -------------------------------- | ------------------------ | -------------------------------------------------------------- |
| Framework                        | FastAPI 0.111+           | Hỗ trợ async mặc định, tự động tạo tài liệu, dùng Pydantic v2  |
| Môi trường chạy                  | Python 3.12              | Phiên bản ổn định mới nhất                                     |
| Quản lý gói                      | uv                       | Nhanh hơn 10-100 lần so với pip/poetry                         |
| ORM                              | SQLAlchemy 2.0 async     | An toàn kiểu dữ liệu, dùng driver asyncpg                      |
| Migrations                       | Alembic                  | Hoạt động theo phiên bản, tích hợp tốt với SQLAlchemy          |
| Xác thực dữ liệu                 | Pydantic v2              | Tích hợp sẵn trong FastAPI, tốc độ nhanh                       |
| Xác thực (Auth)                  | PyJWT + passlib[bcrypt]  | Token JWT cho access/refresh, mật khẩu mã hoá bcrypt           |
| Giới hạn yêu cầu (Rate limiting) | slowapi                  | Tích hợp cho FastAPI, giới hạn theo từng route                 |
| Bus thời gian thực               | PostgreSQL LISTEN/NOTIFY | Không cần thêm hạ tầng cho bản v1; có hướng nâng cấp lên Redis |
| Tác vụ nền (Background jobs)     | ARQ (v2+)                | Hỗ trợ async mặc định, chạy trên nền Redis                     |
| Ghi chú hệ thống (Logging)       | structlog                | Log dạng cấu trúc JSON                                         |

## Cơ sở dữ liệu & Hạ tầng (Database & Infrastructure)

| Mối quan tâm                      | Lựa chọn                               |
| --------------------------------- | -------------------------------------- |
| DB Chính                          | PostgreSQL 15                          |
| Bộ đệm (Cache) / Phiên (sessions) | Redis 7                                |
| Lưu trữ file                      | Đĩa cục bộ (dev) → MinIO/S3 (prod)     |
| Tìm kiếm                          | PostgreSQL FTS (v1) → Meilisearch (v2) |
| Container hóa                     | Docker Compose                         |
| Proxy ngược (Reverse proxy)       | Nginx (production)                     |

## Dùng chung (Shared)

- `openapi-typescript` — tự động tạo kiểu (types) TS từ FastAPI `/openapi.json`
- Không dùng Nx/Turborepo — chỉ dùng Makefile đơn giản cho các lệnh lập trình (dev commands)

## Quyết định kiến trúc: Chọn SSE thay vì WebSockets

Sử dụng SSE cho luồng thời gian thực (real-time) vì:
- Chủ yếu đẩy từ Server về client (cập nhật task, thông báo) — không cần dữ liệu hai chiều (bidirectional) trong bản v1
- Tính năng tự động kết nối lại (Auto-reconnect) được tích hợp sẵn trong trình duyệt qua API EventSource
- Hoạt động qua kênh phân luồng HTTP/2 (multiplexing) mà không cần cấu hình proxy phức tạp
- Dùng PostgreSQL LISTEN/NOTIFY làm bus nhắn tin — không mất thêm chi phí hạ tầng
- Có thể dễ dàng nâng cấp lên Redis Pub/Sub khi cần chạy nhiều máy chủ backend
