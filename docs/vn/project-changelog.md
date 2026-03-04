# A-ERP — Nhật ký thay đổi Dự án (Changelog)

Tất cả các thay đổi có ý nghĩa, tính năng và sửa lỗi được lưu trữ tại đây.
Định dạng: `## [version] — YYYY-MM-DD` kèm theo các mục được nhóm chung.

---

## [2.1.0] — 2026-03-03

### Bổ sung — Triển khai đầy đủ Module HRM

- **Nâng cấp HRM Backend** — Các endpoint có phân trang cho phòng ban và nhân viên. Danh sách phòng ban: tìm kiếm theo tên/mô tả. Danh sách nhân viên: lọc theo department_id, tìm kiếm theo tên/email. Tất cả các trả về đều đi kèm mốc thời gian `created_at` và `updated_at`. Được giới hạn cấp không gian làm việc (Workspace-scoped) với RBAC.
- **Tạo mới các mô hình HRM** — `LeaveType` (tên, mô tả), `LeaveRequest` (employee_id, leave_type_id, start_date, end_date, trạng thái status='pending'/'approved'/'rejected', kèm luồng quy trình duyệt của admin), `PayrollRecord` (employee_id, month, salary, deductions, bonus).
- **Thiết lập HRM Routers** — CRUD Phòng ban (Departments) tại `/hrm/workspaces/{workspace_id}/departments`. CRUD Nhân viên (Employees) tại `/hrm/workspaces/{workspace_id}/employees`. CRUD cho LeaveRequest với tác vụ duyệt approve/reject tại `/hrm/workspaces/{workspace_id}/leave`. CRUD cho PayrollRecord tại `/hrm/workspaces/{workspace_id}/payroll`.
- **Dùng chung HRM Shared Schema** — Đưa `PaginatedResponse` từ CRM sang vùng dùng chung `app/schemas/pagination.py` nhằm tái sử dụng với tất thảy các module.
- **Dùng chung các HRM Frontend Shared Components** — Có component bảng table mở rộng thư viện `HrmDataTable<T>`, component phân trang `HrmPagination` có điều hướng qua lại prev/next, `HrmPageHeader` với tiêu đề, phần tìm kiếm, nút tạo mới. Nằm tại `modules/hrm/features/shared/components/`.
- **Giao diện HRM Departments Frontend** — Có UI CRUD hoàn thiện. Áp các hooks `useDepartments`, `useCreateDepartment`, `useUpdateDepartment`, `useDeleteDepartment` dùng kèm TanStack Query. Dialog form Phòng ban khai tên name, các mục khai báo description. Trang list Department có kèm search và phân trang (pagination). Có thêm tích hợp mục trong Sidebar navigation thanh bên.
- **Giao diện HRM Employees Frontend** — Có UI CRUD hoàn chỉnh. Kèm hooks `useEmployees`, `useCreateEmployee`, `useUpdateEmployee`, `useDeleteEmployee` hỗ trợ xử lí lấy nối với TanStack Query. Khai form bảng nhập cho Nhân viên có dùng name, email, position, hire_date, các khung chọn phòng ban bộ phận department. Trang list Employee có áp lọc bộ phận department, tìm kiếm search, phân mảng trang pagination. Tích chế Cascade khoá ngoại FK dọn sạch theo khi xoá gốc.
- **Giao diện HRM Leave Requests Frontend** — Xử hệ dùng bảng hook `useLeaveRequests`, `useCreateLeaveRequest`, `useApproveLeaveRequest`, `useRejectLeaveRequest`. Form xin phép nghỉ áp khoảng chọn lọc cho phép ngày giờ và hệ thả xổ báo danh loại thẻ loại phép nghỉ. List mảng báo Request lọc theo trạng thái duyệt status, tác vụ approve/reject bằng các nút ấn quyền cho Admin quản lý. Dành hệ mục menu bên sườn hệ thanh Sidebar navigation.
- **Giao diện HRM Payroll Records Frontend** — Các hệ móc `usePayrollRecords`, `useCreatePayrollRecord`, `useUpdatePayrollRecord`, `useDeletePayrollRecord`. Dialog Payroll bóc lấy nhân viên để chỉ báo form chọn xổ, trường tháng khai tháng, salary lương, khoản trừ, lương vượt bonus thưởng. Dạng List mảng hiển phân dạng trang và tác vụ CRUD xoá sửa cập.
- **Định tuyến HRM Module Routes** — Các đích `/hrm/departments`, `/hrm/employees`, `/hrm/leave`, `/hrm/payroll` các luồng routes được bổ lên. Menu module thả chọn bộ đã gồm nhánh HRM trong chuyển mạch module. Sidebar nhảy tuỳ hrm nav items hiện chốt lấy khi app chỉ kích bật module `activeModule === 'hrm'`.
- **Alembic Migration 0007** — Chế bảng list các mục `leave_types`, `leave_requests`, `payroll_records` thiết các bảng cắm hệ chốt khoá FK ngoại, kẹp dính theo không gian workspace chốt giới miền workspace.

### Các bản sửa chữa (Fixed)
- **Cascade khoá ngoại cho Nhân viên** — Khoá bóc FK tự huỷ Cascade áp để làm trào tự rụng xoá cho gốc bóc theo nhân viên nghỉ mảng huỷ xoá theo xoá. Kéo theo `leave_requests` và `payroll_records` cascade dọn trống gốc đi.
- **Xác thực ngày gõ Date Validation** — Mảng Leave request có hạn kì `start_date` đòi bắt luôn sớm áp định mốc `end_date`; khối date báo check xác định trên tầng xử lí hệ backend service.
- **Mô đun khai Pagination Schema chia dùng** — Mở đẩy file định chung về 1 vùng áp chia tái dùng gọn khô lề DRY khô mã chéo kết nối WMS, CRM, HRM.

---

## [2.0.0] — 2026-03-02

### Bổ sung — Thiết cấu tái A-ERP Restructure

- **Kiến cấu khối Modular Backend Architecture** — Thiết cấu dọn thành mảng khối `modules/pms/`, `modules/wms/`, `modules/hrm/`, `modules/crm/` chia luồng đóng kín cho các routers, service, mô-đun models, và schemas. Luồng PMS routes băm thêm dính định tố `/pms/` vào tiền. Hàm mã sạc chia shared (auth, d.án workspaces, danh tổ teams) vẫn treo lưu nóc ranh cao nhất.
- **Mô đun khối WMS Module — Cấu CRUD đủ toàn mảng Full (tổng cộng 5 ranh entities)** — Có hoàn cấu dọn đầy cho ranh Warehouse, Product, Device, Supplier, và bảng mục Inventory Item. Sinh đủ mô hình, kho CRUD services, API routers gắn dải mảng chia phân trang, chia cấu lớp schemas mở chèn `PaginatedResponse`. Dựng 5 bảng (Tables): `warehouses`, `wms_products`, `wms_devices`, `wms_suppliers`, `inventory_items`. Tới các routes với tiền tố `/wms/`. Lấy hãm không gian Workspace phân tầng theo kiểm quyền hạn RBAC.
- **WMS Frontend — Giao mạo toàn bích Full UI** — Có chứa đủ 5 danh bảng list (warehouses, products, devices, suppliers, inventory list), có sẵn 5 form hộp dialog (create/edit), có kết cài 5 hệ dùng TanStack Query hooks. Có 3 bản dấn móc WMS mảng shared components (`wms-data-table`, `wms-page-header`, `wms-pagination`). Kéo theo lazy-loaded routes chạy ẩn ngầm dưới kho ruột `modules/wms/features/`.
- **Khởi dựng thô phần ráp HRM Module Scaffold** — Định các model Nhân viên và Phòng, CRUD service luồng /schemas /routers chia nhánh đủ ráp. Khung Table lập mộc: `departments`, `employees`.
- **Khởi dựng khung sườn cho nháp cọc CRM Module Scaffold** — Gieo sinh mác model Khách Liên hệ (Contact) và Giao dịch Deal model. Khung định thành Table lập mộc: `contacts`, `deals`.
- **Theo luồng Tầng quản Uỷ thao tác mạng Agent Layer** — Viết ra khối base Abstract `BaseAgent` đính gán hạch cấu dán cấp công (capabilities), quản uỷ `AgentRegistry` giữ chốt kiểm thẻ mảng lookup nhắm tra/hạch cho phép bám agent. `AgentOrchestrator` dọn phần dẫn hệ cắm chéo xử lý routing. Hốc REST Endpoint: `POST /agents/{module}/invoke`.
- **Tầng cấu MCP Protocol Layer trổ Context Model** — Vỏ định mô nhào sinh lõi Protocol mác `MCPEnvelope` định dạng kiểu truyền theo kiểu quy. Cắm cọc `EventBus` nhận phát event mảng (pub/sub), chia kho túi trỏ key và chứa value dạng SharedContext. Xây ráp luống `PolicyEngine` dựng các thanh cấu khoá rule điều cản báo quản, thả dán băm log (audit).
- **Phân cấu trổ hiển thị Frontend Module Structure** — Dọn mảng PMS features chuyển nhà luống về ngăn `modules/pms/features/`. Bộ tổ khối dàn sườn ráp app kết nối ngoài biên khối shell components (app-shell, sidebar, top bar, module-switcher) rút ranh về ốp góc mảng `shared/components/shell/`. Cái gạt nút đẩy module switcher đảo trỏ hóc mảng qua PMS, WMS, HRM, và CRM.
- **Ghép nhánh rẽ đường Frontend Module Routes** — Đảo cấu cho ranh PMS băm gán chặt chốt: `/pms/my-tasks`, hay `/pms/projects/:id/board`. Khúc WMS nhét `/wms`... Bỏ lại khung dán móc ranh placeholders `/hrm` và `/crm`.
- **Bóc thả kho cấu Alembic Migrations** — Kéo luống migration 0007 (WMS/HRM/CRM scaffold ban đầu); Trổ luống migration 0008 (thực tế ngọn gắn wms_add_products_devices_suppliers).

---

## [Chưa chính thức Unreleased khuyết bản nạp trống]

### Bổ sung mới cho — CRM Module Rành Full Implementation

- **Phần chặn Backend CRM Enhancements** — Các Endpoints chia bọc phân trượt kẹp paginated. Nhóm list Contact: hỗ search tên, danh công ty. List Deals: nhắm filter stage và khoá của contact_id, tra vạch title để search. Cả trùm thông phản báo có `created_at` cùng với vết sửa đổi `updated_at`. Ranh phận Admin bắt định cấp cứng khi xoá (quyền guest=read, member=write, admin=delete).
- **Cấu xài chia chung Shared Components CRM Frontend** — Gốc bảng `CrmDataTable<T>`, thẻ `CrmPagination`, vòm dán trán `CrmPageHeader` kèm Title, hộp tìm kiếm search, ô nút Create button, đồ lọc filter. Chúng nằm tại `modules/crm/features/shared/components/`.
- **Khối trổ của Frontend cọc Contacts CRM** — Nóc ráp toàn hộc bộ Full CRUD ranh mặt hiển phôi UI. Dùng TanStack Query bóc mảng hook `useContacts`, `useCreateContact`, `useUpdateContact`, `useDeleteContact`. Hộp dialog điền đệm thô báo khung Contact (name, email, phone, company). Bộ List sô liệt Contacts trúc móc tìm khay search bóc dán lọt phân trang.
- **Ghép bóc Deals CRM Frontend báo kéo giá kèo deals** — Khung list đè full rành ranh CRUD. Sắm hook bằng TanStack Query: `useDeals`, `useCreateDeal`, `useUpdateDeal`, `useDeleteDeal`. Form chốt Deal khai Title, Value (cọc hệ tiền currency), chốt Stage tiến triển của giá (lead, qualified, proposal, negotiation, closed_won, closed_lost). Tích chọn Contacts xổ chọn gán lấy từ ranh list. Trang sộ mọc List deal lọc ngõ Filter theo stage, gõ thẻ tìm kiếm, cấu phân nhát trang pagination. Định gán hệ báo trị tiền currency. Phía client bóc mục trúng phắp lọi lookup chớp mảng trúng list rọi tên nhanh rút bóc contact_id.
- **Cấu chia module Routes CRM Module** — Ghép đôi `/crm/contacts` bả chung `/crm/deals` để gép vào router chia nhánh. Vứt chóp ranh đầu cắm chùn `/crm` đẩy bắt redirect chuyển sang thẳng `/crm/contacts`.

### Đã Chêm Bổ Cấu (Added)

- **Đảo bảng Chéo Drag-and-Drop KanBan Board thẻ** 
  - Tách mảng Task card kéo vứt về `board-task-card.tsx` thành component nải.
  - Vứt lột hốc Kanban bứt trụ cột sang `board-kanban-column.tsx` bẩy hàm dùng móc `useDroppable`.
  - Chiết li khay chòi luống section input sút vào `board-add-section-input.tsx`.
  - Giảm bốc mảng Board từ 375 dòng xuống 155 mảng dòng.
  - Áp cấu `closestCorners` dò xáp chạm cạnh vỉ dán độ vuốt thả.
  - Nối móc hàm tính nhét lấn vách gắp cục `calcDropPosition()` nặn đếm bóc dải điểm nhục móc Fractional móc xen chạc vỉ khe (thay vì đẩy cục đáy thẻ append kẽ).
  - Tạc cọc nắn bóc kết túm cục chặn ngắt `handleDragEnd` để tháo mộc kẹp rạch bóc xen vỉ thả nắn insert kẹt nách.
  - Tách hai ốp dữ list đai (All: `allTasksForSection`) tách rọi nổ `visibleTasksForSection`.
  - Ốp mác cập đẩy ngàm cache cập nhật Optimistic thẻ bóc móc cục đè hook `useMoveTask`, cập nhát rút ảo `onMutate`, thọt xử lọt ngáp giắt còng lọng `onError`/ `onSettled`.
  - Vá chặn bộc màn mọc vỉ Overlay dính lỗi trỏ chạch opacity. Sửa bóng mờ ghost card.
  - Cột rỗng vỉ nắn hứng đỡ vỉ hứng bóc `useDroppable`.
  - Thẻ vuốt xen khe móc qua các thẻ nhiệm vụ khác lọt (không chốc rướn tấp dúi đáy).

- **Tác Vụ Mốc chu kì Định Kì lặp vòng (Recurring Tasks)**
  - Thêm 5 cột cho bảng `tasks`: `recurrence_rule`, `recurrence_cron_expr`, `recurrence_end_date`, id phôi gốc `parent_recurring_id`, nấc bấm cuối `last_generated_date`.
  - Quy tắc lặp: `daily`, `weekly`, `biweekly`, `monthly`, `custom_cron`.
  - ARQ job quét giờ sáng khuy (2h AM UTC) để `spawn_recurring_tasks`.
  - Thẻ gốc template (parent) không thể đánh dấu checked hoàn thành kẹp.
  - Thẻ con spawned sinh ra được đánh trỏ cục đành lẻ móc tạt thẻ nác độc lập lọt kíp móc thẻ nức lọt phợp tắt điểm đóng bình thường.
  - Dùng cuộn lib đồ vỉ túi `croniter` móc tính chuỗi custom biểu múc cron hợp bọc cấu chóp dán mạc chép dán mọc tuốt.
  - Phễu hứng Frontend chớp mác ngăn kéo chọn recurrence.
  - Khoe lộ khuyên chu kì báo lặp nhát Badge mọc đính thoi lọt kẹp vỉ gắn card trỏ nảy trên Board mác list.
  - Sổ mộc tạt băm tụi thẻ con trổ Occurrences danh sách dưới Parent Template trong vỉ bóc ngăn detail drawer.
  
- **Các trường tự tuỳ cắm biến móc (Custom Fields)** 
  - Cột JSONB `custom_fields` nhét vỉ cấu thọc trên bảng `tasks` thọc xài khay bọc làm rổ túi hứng chứa giá trị value.
  - Sinh luống móc gõ nặn đẻ bóc bảng định `custom_field_definitions` ngòi bọc cục theo mức project.
  - Cấu rọc 7 mọc lót trường field types gá dán: `text`, `number`, `date`, `single_select`, `multi_select`, `checkbox`, `url`.
  - Xóa mềm (soft-delete dán tạt) áp trên definitions.
  - Validation dịch vụ (service): required, kiểm loại type, check tuỳ chọn option...
  - Frontend: Bảng thiết lập config tuỳ vọt trường xấp trong project settings. 
  - Render mạc báo trọn bộ nhập input tương ứng lên màn hình detail drawer. 
  - Khung xài Empty state tạt rỗng none.

- **Quản Hồ Sơ Mục Tiêu (Goals)**
  - Bảng `goals` mới nằm theo cấp làm việc workspace.
  - Bảng nối: `goal_project_links`, `goal_task_links`.
  - Trạng thái Status: `on_track`, `at_risk`, `off_track`, `achieved`, `dropped`.
  - Progress: `manual` gõ (kéo tự nhập) hoặc (or) chạc tự ngập `auto` cục cắm nhảy số tự phóc móc trượt (phần % task xong completed linked).
  - Màu sắc customize, owner, v.v.
  - Xoá mềm Soft-delete xoá thả.
  - Frontend: Trang Goals list, layout grid dạng lưới (tới 3 mạc rọi cột cols).
  - Thẻ Goal UI: title tựa, status badge, thanh kéo bar, owner avatar, due date, counts đếm.
  - Khay Draw Drawer xem chi tiết edit sửa đổi.
  - Form Dialog hộp nối dán Link để link projects / tasks thông qua.
  - Sidebar Menu thêm mục "Mục Tiêu".
  - Auto progress nhảy % với SSE cập nhật.

### Các bản sửa chữa (Fixed)
- **Security Bảo mật**: Trạm chặn đo kiểm xét ownership project / task đo kiểm soát truy cập chốt sạp gác bọc rọi mác.
- **Frontend Mismatch**: Lỗi giá lệch vòng lặp recurrence (custom_cron). 
- **Frontend ID Label Select**: Select tuỳ chọn gán options ID qua nhãn text label thay vì id của option.

### Khác (Other)
- **Dòng Sông Dấu Activity Log / Timeline**
  - Bảng `activity_logs`: `workspace_id`, `project_id`, `entity_type`, `entity_id`, `actor_id`, `action`, nấc bảng `changes` JSONB. Index bộ chỉ mục `(entity_type, entity_id)` và `created_at`.
  - Model `ActivityLog`.
  - Alembic luống migration `0002_add_activity_log`.
  - Schema luống `ActivityLogResponse` kẹp chung bổ xung enrich actor name / avatar.
  - Function `create_activity()` tầng service phát sóng pub SSE qua channel kênh dán không gian làm việc.
  - Function `list_activity()` — gá rút phân trang pagination giật kéo kiểu cursor mốc trỏ xếp order theo `created_at` luổng DESC.
  - REST route:
    - `GET /projects/{project_id}/activity?limit=50&cursor=` 
    - `GET /projects/{project_id}/tasks/{task_id}/activity?limit=20` 
  - UI `activity-timeline.tsx` khu sấp phần dự rọi dán project mác "Hoạt động gần đây Recent activity".
  - Tab "Lịch sử History" Component ngăn thẻ `task-activity.tsx` Drawer móc kéo hộc.
  - Bắn vỉ emits móc mác phát bắn sự kiện lọt của trạm tasks, comment, vòng project updates service. 
  - Frontend SSE mọc hook updated `use-sse.ts` đón mác dán `activity_created` và cấu móc ngưng dán invalidate cache TanStack Query chớp nhoáng.

---

## [0.5.0] — 2026-02-26
- Các dịch vụ Docker services dán cho luống FastAPI backend và Vite frontend châm vào file `docker-compose.yml`.

---

## [0.4.0] — 2026-02-25
- Giao diện quản lý member workspace rọi dán cấu.
- Notifications báo cấu bắn nấc khè thông báo đẩy push cho Comment rọt luận ý dán và chỉ phân công nhiệm vỉ assignment nấc móc thông gá push rọi vỉ luổng kẹp sút SSE ngòi bắn.

---

## [0.3.0] — 2026-02-24
- Chốt khuyết hụt độ nhất quán của thông số Dashboard Overview mác dán trút gá Overview móc gá kẹp của chóp túm rút thông mác.
- Lỗi khóa null của mức độ ưu tiên Priority.
- Lỗi màn Error state dán hiển phơi state màn khay hộc móc overview project lọt nấc tạc.
- Bổ sung rọi mặt Overview project page dán dashboard mác rọi báo túm móc stats.

---

## [0.1.0] — 2026-02-20
- Nóc Xác mạc Thừa Thận JWT Token auth dán token hộc truy dán móc acces-token + cái bánh HttpOnly refresh-cookie dán rọi.
- Các module Workspace / Project / Task / Tag CRUD bọc báo móc RBAC role gác mốc ngòi rọi. 
- Tìm kiếm dòng chữ toàn văn PostgreSQL FTS dán text tìm search móc trỏ móc rút ngòi Full-text cấu rọi trỏ mác lọi hộc search tìm.
- Cấu lịch luống Calendar views kẹp lịch mạc báo mác rọt móc mạc vỉ views dính cọc dán Fractional tính toán Drop/Drag nhét chỉ lọi. 
- Trạm thu và xả luổng Real-time SSE / Pub/sub đâm dán dính.
- Hệ thống thông báo chuông Notifications dán cấu mác lọi đếm số thẻ chưa chót badge.
- ARQ Redis công việc đẩy dưới nền nẩy Background Jobs bọc tấc cày kéo móc ngòi kẹt rút.
