# WorkBoard — Tiêu chuẩn mã nguồn

**Cập nhật lần cuối:** 2026-03-03

---

## Nguyên tắc chung

- **YAGNI / KISS / DRY** — chỉ xây dựng những gì cần thiết, giữ cho chúng đơn giản, tránh sự lặp lại.
- **Kích thước tệp:** giữ các tệp dưới 200 dòng; tách ở các ranh giới hợp lý.
- **Đặt tên tệp:** sử dụng kebab-case với các tên mô tả chi tiết (`task-detail-drawer.tsx`, `activity-log.py`).
- **Không dùng mock trong môi trường production** — triển khai logic thực tế, không dùng các stubs tạm thời.
- **Xử lý lỗi:** luôn sử dụng try/catch hoặc các exception handlers của FastAPI; không bao giờ phớt lờ lỗi một cách im lặng.

---

## Backend (Python / FastAPI)

### Các Quy ước đặt tên

| Thành phần       | Quy ước                                            | Ví dụ                                |
| ---------------- | -------------------------------------------------- | ------------------------------------ |
| Tệp tin          | `snake_case`                                       | `activity_log.py`                    |
| Lớp (Classes)    | `PascalCase`                                       | `ActivityLog`, `ActivityLogResponse` |
| Hàm / biến       | `snake_case`                                       | `create_activity()`, `workspace_id`  |
| Hằng số          | `UPPER_SNAKE_CASE`                                 | `MAX_LIMIT = 100`                    |
| Mô hình Pydantic | `PascalCase` + Hậu tố `Response`/`Create`/`Update` | `ActivityLogResponse`                |

### Mẫu Kiến trúc Router

Các router được thiết kế rất mỏng. Chúng:
1. Khai báo route và mô hình phản hồi (response model).
2. Chạy xác thực/RBAC thông qua `Depends()`.
3. Chuyển giao ngay lập tức cho một hàm service (dịch vụ).
4. Trả về trực tiếp kết quả của service.

```python
@router.get("/projects/{project_id}/activity", response_model=list[ActivityLogResponse])
async def project_activity(
    project_id: uuid.UUID,
    limit: int = Query(default=50, le=100),
    cursor: str | None = Query(default=None),
    current_user: User = Depends(require_project_role("viewer")),
    db: AsyncSession = Depends(get_db),
):
    return await list_activity(db, project_id=project_id, limit=limit, cursor=cursor)
```

Không chứa logic nghiệp vụ, không truy vấn cơ sở dữ liệu trực tiếp bên trong các routers.

### Mẫu Kiến trúc Service

Các services (dịch vụ) nắm giữ toàn bộ logic nghiệp vụ và tương tác thao tác với cơ sở dữ liệu:

```python
async def create_activity(
    db: AsyncSession,
    *,
    workspace_id: uuid.UUID,
    project_id: uuid.UUID | None,
    entity_type: str,
    entity_id: uuid.UUID,
    actor_id: uuid.UUID,
    action: str,
    changes: dict | None = None,
) -> ActivityLog:
    ...
```

- Sử dụng các đối số bắt buộc dùng từ khóa keyword-only (`*,`) cho các hàm service để ngăn ngừa lỗi về thứ tự đối số.
- Thực hiện `commit` bên trong service, không được thực hiện ở trong router.
- Phát sóng (Publish) các sự kiện SSE sau khi `commit` thành công.

### Các Mô hình (Models)

- Kế thừa từ `Base` + các mixin (`TimestampMixin`, `SoftDeleteMixin` nếu cần thiết).
- Khai báo tất cả các cột với chú thích kiểu `Mapped[T]` (phong cách của SQLAlchemy 2.0).
- Định nghĩa `__table_args__` cho các index phức hợp (composite indexes) và các quy tắc unique.
- Dùng `JSONB` cho các dữ liệu có cấu trúc linh hoạt (ví dụ., trường `changes` trong `ActivityLog`).

### Các Schema (Pydantic v2)

- Luôn thiết lập `model_config = {"from_attributes": True}` ở các response models.
- Sử dụng `model_validator(mode="before")` để làm phẳng các quan hệ ORM vào các trường response không phân cấp (xem `ActivityLogResponse.extract_actor`).
- Không bao giờ để lộ các ID nội bộ hoặc các trường nhạy cảm (ví dụ., `hashed_password`) trong response schemas.

### Dependencies về RBAC

| Dependency                          | Truy cập tối thiểu yêu cầu           |
| ----------------------------------- | ------------------------------------ |
| `require_workspace_role("guest")`   | Bất kỳ thành viên nào của workspace  |
| `require_workspace_role("member")`  | Thành viên đầy đủ (không phải guest) |
| `require_workspace_role("admin")`   | Chỉ admin của workspace              |
| `require_project_role("viewer")`    | Bất kỳ thành viên nào của project    |
| `require_project_role("commenter")` | Đặc quyền thêm bình luận             |
| `require_project_role("editor")`    | Đặc quyền chỉnh sửa tasks            |
| `require_project_role("owner")`     | Chỉ owner của project                |

### Phân trang (Pagination)

Tất cả các module đều sử dụng schema `PaginatedResponse` dùng chung từ `app/schemas/pagination.py`:

```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
```

- **WMS, HRM, CRM:** Phân trang dựa trên offset với các thông số truy vấn `?limit=20&offset=0`.
- **PMS (Activity):** Phân trang dựa trên con trỏ (cursor) bằng việc sử dụng UUID của bản ghi được lấy sau cùng.
- Nhập đối tượng: `from app.schemas.pagination import PaginatedResponse`

### Các Endpoint Hành động

Đối với các tác vụ không phải CRUD (phê duyệt, từ chối, lưu trữ, v.v.), hãy sử dụng mẫu endpoint hành động:

```python
@router.post("/leave-requests/{id}/approve", response_model=LeaveRequestResponse)
async def approve_leave_request(
    id: UUID,
    current_user: User = Depends(require_workspace_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await approve_leave_request_service(db, leave_request_id=id, reviewed_by_id=current_user.id)
```

Tuyến đường (Route): `POST /resource/{id}/{action_name}` (ví dụ., `/leave-requests/{id}/approve`, `/leave-requests/{id}/reject`).

### Migrations

- Một file migration cho mỗi tính năng. Tên: `{sequence}_{description}` (ví dụ., `0002_add_activity_log`, `0007_add_hrm_leave_payroll_tables`).
- Luôn thêm index trực tiếp trong cùng file migration khởi tạo bảng đó.
- Không bao giờ chỉnh sửa lại file migration đã hoàn thành; thay vào đó bạn hãy tạo file migration mới.

---

## Frontend (TypeScript / React)

### Các Quy ước đặt tên

| Thành phần                                | Quy ước                               | Ví dụ                                 |
| ----------------------------------------- | ------------------------------------- | ------------------------------------- |
| Tệp tin                                   | `kebab-case`                          | `activity-timeline.tsx`, `use-sse.ts` |
| Các React component                       | `PascalCase` (sử dụng default export) | `ActivityTimeline`                    |
| Các hook (Hooks)                          | `camelCase` có dùng tiền tố `use`     | `useSse`, `useActivityFeed`           |
| Các biến / Hàm số                         | `camelCase`                           | `projectId`, `fetchActivity`          |
| Các dạng (Types) / Giao diện (interfaces) | `PascalCase`                          | `ActivityLogResponse`                 |
| Các cửa hàng (stores) Zustand             | `camelCase` có định tố `use`          | `useAuthStore`                        |

### Cấu trúc thư mục của Tính năng

```
features/{name}/
  components/   # Component giao diện, trình bày và bao hàm
  hooks/        # Component hooks của TanStack Query
  pages/        # Component dùng ở cấp phân luồng (Route-level)
  tests/        # Các bản kiểm thử vitest
```

### Quy tắc Component

- Một component được xây riêng mỗi tệp, tên đối tượng trùng với file được dùng bằng định dạng kebab-case.
- Giữ dung lượng component nhỏ dưới khoảng 200 dòng mã; sẽ dễ dàng chuyển hoá cho hook hoặc component nhỏ bên trong đó (sub-components).
- Xác định và định hình đặc tính (Props types) thông qua dùng lệnh trực tiếp trên đường truyền là phần `interface` nội tuyến (inline) được khai báo đầu.
- Không tích hợp bất cứ cấu trúc business logic của logic nghiệp vụ tại component sử dụng điều hướng — hãy dành và cấu hình điều kiện thay vào đó lại chuyển qua móc ngữ liệu (hooks).

### Tìm nạp Dữ liệu Data Fetching (TanStack Query v5)

```typescript
// Query key convention: [resource, scope, id]
queryKey: ["activity", "project", projectId]
queryKey: ["activity", "task", taskId]
```

- Bạn cũng cần lưu tâm, đặt thuộc định thông số các trường mảng `queryKey` trong nội trình rõ để cung cấp tính phân tác trong vô hiệu hóa bộ đệm (cache invalidation).
- Tất cả trường dữ liệu xử lí các mutation thực hiện thông tin đối với lệnh hàm `queryClient.invalidateQueries` từ hệ thống thành công cung.
- Thông tin quản lý với SSE về sự kiện làm quá hạn lưu đệm truy vấn được định danh lại nằm trong `use-sse.ts`, khác so với các component rời rạc riêng.

### Quản lý Trạng thái State 

- **Trạng thái cấu trúc đối tác (Server state):** Dùng TanStack Query — Tuyệt đối đừng nhồi những khối data trả truy vấn với Zustand.
- **Trạng thái cục diện toàn cục (Global client state):** Cửa hàng ứng trạng thái Zustand phân tại `shared/stores/` — Token uỷ quyền xác thực phân vai, thông tin cấu thành ứng dụng đang hoạt.
- **Trạng thái thành tố cho định biểu form (Form state):** Dùng React Hook Form + xác thực (schema validation) dùng Zod schema.
- **Trạng thái chi tiết từ ứng dụng nội giao (Local UI state):** `useState` / `useReducer` cho phần bên tại nội một component cung cấp dùng tại.

### Tích hợp Công nghệ Truyền Event SSE

`use-sse.ts` định nghĩa bản chỉ huy quan hạt duy hệ đến thao biên các đối truyền event SSE event handling:
- Tiến trình nhận thông và phân lưu một giá trị nhận Event `EventSource` riêng biệt truy nhận session có quyền xác thực.
- Kẻ thông đẩy lưu báo sự kiện tới phân xử qua lệnh gạch sự ghi truy tìm là `queryClient.invalidateQueries` chia dạng theo type (thể thức) giá trị.
- Áp chế đối sự kiện mới: nối thêm phần giá xử trường kiện `case` trong việc chắt các event thay phân bộ và gạch ngưng kết giá trị với thông mảng theo giá từ khoá.

### TypeScript

- `strict: true` — cấm cọc dạng trường vô `any` chỉ khi bao dạng từ một thành giới thông ngoại tuyến (external boundary).
- Luôn nhận mô hình định dạng API response shape có mặt hình thù sẵn; cấu tạo hình sinh từ file `/openapi.json` sử dụng công vụ cung cụ `openapi-typescript` trong trường thích.
- Chế ứng ưu đãi lựa `type` áp dùng nhiều `interface` đại thông kết quy union; dùng loại diện `interface` thay áp với hình mảng được nhận và cần cho gia tiếp cung bồi thông định ngoài trường hợp kế.

---

## Kiểm thử Testing

### Backend (pytest)

- Lưu dữ qua bộ in-memory dùng SQLite phục mô đun đơn lẻ (unit) hay phức tích (integration tests) (những lớp ứng cấu nhận sử shim ngụy cấu kết lại tại `TSVECTOR`).
- Tổ phần tập test phản chi qua cấu trình nguồn: `tests/test_services/test_activity_log.py`.
- Mỗi hàm kiểm có tự hành lập tự lực dùng fixture đối bộ phận nạp session DB với tạo đặt test user từ lúc thử setup.

### Frontend (vitest)

- Chứa file tập tại ở khu được gắn cục `features/{name}/tests/`.
- Thực hiện component test thông qua sử phần nền React Testing Library.
- Mạo thiết với giả danh công TanStack Query trong môi kiểm test với `QueryClient` làm vỏ công phụ (wrapper).
- Nghiêm trị đánh chệch qua lấy dữ giả fake data tại kiểm thực thay qua các giả điểm (mocking network calls) thay sử môi chấu MSW hay qua hệ giả lập lấy kết API thay (test endpoints).

### Khởi Test diện (E2E) qua Playwright

- Đóng nằm cấp ngọn vị của mục dự thư chứa là `e2e/`.
- Triển xét test quy thực qua những bước (user flows): Đăng lấy uỷ nhiệm hệ login, Cấu đặt tạo qua dự án, tạo dựng task hành, các ứng thao và chéo chuyển, lôi rê.

---

## Tuân hệ Các API Design

- Đường mục nhận (Base path): `/api/v1/`
- Tên dẫn nhận nguồn nguyên (Resource URLs): danh theo thức mục từ phần đại (plural nouns), viết nối vạch cách kebab-case (`/activity-logs` được coi nằm ranh liền, nằm ghép luồng theo `/projects/{id}/activity`).
- Định mục dẫn phân module routes: `/api/v1/{module}/{resource}` (ví dụ., `/api/v1/pms/projects`, `/api/v1/wms/products`).
- Tuyến con ngạch tài nguyên lồng nhặt bao danh tuyến trên lồng cha trong hướng ngạch: `/projects/{project_id}/tasks/{task_id}/activity`.
- **WMS/HRM/CRM Pagination** (offset-based phân trang): `GET /api/v1/wms/products?limit=20&offset=0` → về kiểu giá trị là `PaginatedResponse[ProductResponse]`.
- **PMS Pagination** (cursor-based phân trang định chỉ): `GET /api/v1/pms/projects/{id}/activity?limit=50&cursor={uuid}` — ứng truyền vào UUID của mục chót nhận đặng.
- **Action endpoints (hành dẫn đích xử điểm tiến thi thao động):** `POST /resource/{id}/{action_name}` thi triển những ngoài mảng CRUD (ví dụ., `POST /api/v1/hrm/workspaces/{id}/leave-requests/{id}/approve`).
- Công phương HTTP: `GET` đọc (read), `POST` tạo thành (create), `PATCH` bổ sửa phần, `DELETE` rút dỡ (remove).
- Báo định rớt Auth bị rớt xác uỷ: nhận về `401 Unauthorized`; sai ranh cản uỷ permission errors: lệnh mã `403 Forbidden`; không tìm thấy not found: nhận mã `404 Not Found`.

---

## Quy Lệ Nhập Git & Trình Uỷ Commit 

- Conventional commits các tuân mẫu giao định: có bao mặt `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Mô cấu tập mục theo chỉ tiêu định riêng một tập chéo (logical change) logic nhỏ riêng.
- Chặn uỷ đẩy đưa `.env` và bí mảng hoặc phần ngầm nhạy.
- Quán chiếu chạy `make lint` ở khi commit trình uỷ biên; quán uỷ bật chạy `make test` trước thao chuyển push.
