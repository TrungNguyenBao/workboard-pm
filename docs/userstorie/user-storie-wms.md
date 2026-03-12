USER STORIES & ACCEPTANCE CRITERIA
Procurement, Warehouse & Warranty Management System
Dành cho Công ty Camera AI (ERP Module)

Version: 1.0  |  Ngày tạo: 2026-03-12
Dựa trên PRD & SOP Procurement, Warehouse & Warranty
 
Tổng quan User Stories
Tài liệu này chứa 38 user stories được tổ chức thành 10 epics, bao phủ toàn bộ chức năng của hệ thống Procurement, Warehouse & Warranty Management theo PRD. Mỗi story bao gồm Acceptance Criteria (Given-When-Then), UI Requirements và Technical Notes.

Chú giải Priority
P0 - Must Have (MVP blocker)  |  P1 - Should Have (Important)  |  P2 - Nice to Have (Enhancement)

Personas
•	Phòng Mua hàng (Procurement Staff) - Tạo PR, PO, theo dõi đặt hàng
•	Thủ kho (Warehouse Keeper) - Nhập/xuất kho, scan serial, quản lý GRN
•	Project Manager (PM) - Yêu cầu mua, reservation, theo dõi thiết bị dự án
•	Kỹ thuật triển khai (Technician) - Lắp đặt, kích hoạt, deploy devices
•	Bộ phận Bảo hành (Warranty Staff) - Tiếp nhận và xử lý warranty tickets
•	Manager / Admin - Phê duyệt, báo cáo, audit, phân quyền

ID	User Story	Epic	Priority	Status	Sprint
US-001	Tạo Purchase Request	Purchase Request (PR)	P0	⬜ Todo	Sprint 1
US-002	Submit PR để phê duyệt	Purchase Request (PR)	P0	⬜ Todo	Sprint 1
US-003	Phê duyệt / Từ chối PR	Purchase Request (PR)	P0	⬜ Todo	Sprint 1
US-004	Xem danh sách PR	Purchase Request (PR)	P0	⬜ Todo	Sprint 1
US-005	Tạo Purchase Order từ PR	Purchase Order (PO)	P0	⬜ Todo	Sprint 1
US-006	Phê duyệt PO và gửi NCC	Purchase Order (PO)	P0	⬜ Todo	Sprint 2
US-007	Theo dõi trạng thái PO	Purchase Order (PO)	P1	⬜ Todo	Sprint 2
US-008	Tạo GRN từ PO	Nhập kho (GRN - Goods Received Note)	P0	⬜ Todo	Sprint 2
US-009	Scan Serial khi nhập thiết bị	Nhập kho (GRN - Goods Received Note)	P0	⬜ Todo	Sprint 2
US-010	Nhập phụ kiện (Non-serial)	Nhập kho (GRN - Goods Received Note)	P0	⬜ Todo	Sprint 2
US-011	Complete GRN - Sinh tồn kho	Nhập kho (GRN - Goods Received Note)	P0	⬜ Todo	Sprint 2
US-012	Cancel GRN	Nhập kho (GRN - Goods Received Note)	P1	⬜ Todo	Sprint 3
US-013	Cảnh báo GRN RECEIVING quá lâu	Nhập kho (GRN - Goods Received Note)	P2	⬜ Todo	Sprint 5
US-014	Tạo Outbound Order	Xuất kho (Outbound)	P0	⬜ Todo	Sprint 3
US-015	Xuất kho Serial-based - Scan serial	Xuất kho (Outbound)	P0	⬜ Todo	Sprint 3
US-016	Xuất kho Non-serial (Phụ kiện)	Xuất kho (Outbound)	P0	⬜ Todo	Sprint 3
US-017	Hoàn tất Outbound Order	Xuất kho (Outbound)	P0	⬜ Todo	Sprint 3
US-018	Reserve thiết bị cho dự án	Reservation theo dự án	P0	⬜ Todo	Sprint 3
US-019	Xem thiết bị đã reserve theo dự án	Reservation theo dự án	P1	⬜ Todo	Sprint 4
US-020	Xem Device Detail và History	Device Lifecycle	P0	⬜ Todo	Sprint 4
US-021	Cập nhật trạng thái lắp đặt (DEPLOYED)	Device Lifecycle	P0	⬜ Todo	Sprint 4
US-022	Kích hoạt AI (ACTIVATED)	Device Lifecycle	P0	⬜ Todo	Sprint 4
US-023	Retire thiết bị	Device Lifecycle	P1	⬜ Todo	Sprint 5
US-024	Tạo Warranty Ticket	Bảo hành & Bảo trì (Warranty)	P0	⬜ Todo	Sprint 4
US-025	Xử lý bảo hành - Sửa chữa	Bảo hành & Bảo trì (Warranty)	P0	⬜ Todo	Sprint 5
US-026	Xử lý bảo hành - Đổi thiết bị	Bảo hành & Bảo trì (Warranty)	P0	⬜ Todo	Sprint 5
US-027	Xem danh sách Warranty Tickets	Bảo hành & Bảo trì (Warranty)	P1	⬜ Todo	Sprint 5
US-028	Báo cáo tồn kho tổng hợp	Báo cáo Tồn kho & Dự án	P0	⬜ Todo	Sprint 4
US-029	Báo cáo serial theo dự án	Báo cáo Tồn kho & Dự án	P0	⬜ Todo	Sprint 4
US-030	Truy xuất lịch sử thiết bị theo serial	Báo cáo Tồn kho & Dự án	P0	⬜ Todo	Sprint 5
US-031	Báo cáo bảo hành	Báo cáo Tồn kho & Dự án	P1	⬜ Todo	Sprint 6
US-032	Audit Log toàn diện	Kiểm soát nội bộ & Audit	P0	⬜ Todo	Sprint 3
US-033	Lock chứng từ sau hoàn tất	Kiểm soát nội bộ & Audit	P0	⬜ Todo	Sprint 2
US-034	Không cho xóa chứng từ - chỉ Cancel/Reverse	Kiểm soát nội bộ & Audit	P0	⬜ Todo	Sprint 2
US-035	Phân quyền theo Role	Kiểm soát nội bộ & Audit	P0	⬜ Todo	Sprint 1
US-036	Warehouse Dashboard	Dashboard & Tích hợp PMS	P0	⬜ Todo	Sprint 5
US-037	Tích hợp PMS - Liên kết thiết bị với dự án	Dashboard & Tích hợp PMS	P1	⬜ Todo	Sprint 6
US-038	Reverse Transaction cho GRN COMPLETED	Dashboard & Tích hợp PMS	P1	⬜ Todo	Sprint 6
 
Epic 1: Purchase Request (PR)
Quy trình tạo và phê duyệt yêu cầu mua hàng. PR không ảnh hưởng tồn kho, chỉ là chứng từ yêu cầu nội bộ.

US-001: Tạo Purchase Request
Priority	P0 - Must Have
Persona	Project Manager / Kỹ thuật
Epic	Epic 1: Purchase Request (PR)
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Project Manager
I want to create a Purchase Request with device model, quantity, and linked project
So that the procurement team knows exactly what equipment is needed for my project

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo PR thành công	PM đang ở màn hình Procurement	Nhập model thiết bị, số lượng, chọn project liên kết, nhấn Create	PR được tạo với status = DRAFT, hiển thị trong danh sách PR	⬜
AC2	PR gắn project	PM tạo PR cho dự án 'ABC Hotel'	Chọn project = ABC Hotel	PR có project_id liên kết, hiển thị tên dự án trên PR	⬜
AC3	PR không gắn project	Kỹ thuật tạo PR do tồn kho thấp	Tạo PR không chọn project	PR tạo thành công với project_id = null	⬜
AC4	Thiếu thông tin bắt buộc	PM đang tạo PR	Không nhập model thiết bị, nhấn Create	Hiển thị lỗi validation: 'Model thiết bị là bắt buộc'	⬜
AC5	PR không ảnh hưởng tồn kho	PR được tạo thành công	Kiểm tra inventory_transaction	Không có transaction nào được sinh ra	⬜

UI Requirements:
•	Form: Device model (select/search), Quantity (number, min 1), Project (optional select), Notes (textarea)
•	Button: Save Draft, Submit for Approval
•	PR Line items: thêm nhiều dòng sản phẩm

Technical Notes:
• POST /api/v1/procurement/purchase-requests
• Status: DRAFT
• Validation: model required, quantity > 0
• Không tạo inventory_transaction


US-002: Submit PR để phê duyệt
Priority	P0 - Must Have
Persona	Project Manager
Epic	Epic 1: Purchase Request (PR)
Sprint	Sprint 1
Estimate	3 SP

User Story:
As a Project Manager
I want to submit my Purchase Request for approval
So that the procurement process can begin after management review

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Submit thành công	PR status = DRAFT, đầy đủ thông tin	Nhấn Submit	Status chuyển DRAFT → SUBMITTED, không cho chỉnh sửa nội dung	⬜
AC2	Submit PR thiếu items	PR không có line item nào	Nhấn Submit	Lỗi: 'PR phải có ít nhất 1 line item'	⬜
AC3	Lock sau submit	PR status = SUBMITTED	Thử chỉnh sửa quantity	Các field bị disabled, hiển thị 'PR đã submit, không thể chỉnh sửa'	⬜

UI Requirements:
•	Submit button (chỉ hiển thị khi DRAFT)
•	Status badge: DRAFT / SUBMITTED / APPROVED / REJECTED
•	Lock indicator khi đã submit

Technical Notes:
• PATCH /api/v1/procurement/purchase-requests/{id}/submit
• Status transition: DRAFT → SUBMITTED
• Lock edit khi status != DRAFT


US-003: Phê duyệt / Từ chối PR
Priority	P0 - Must Have
Persona	Workspace Admin / Manager
Epic	Epic 1: Purchase Request (PR)
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Manager
I want to approve or reject submitted Purchase Requests
So that only valid procurement needs are processed into Purchase Orders

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Approve PR	PR status = SUBMITTED	Nhấn Approve	Status → APPROVED, thông báo gửi đến người tạo PR	⬜
AC2	Reject PR có lý do	PR status = SUBMITTED	Nhấn Reject, nhập lý do 'Budget vượt quá'	Status → REJECTED, lý do hiển thị trên PR, thông báo đến người tạo	⬜
AC3	Reject không có lý do	PR status = SUBMITTED	Nhấn Reject, không nhập lý do	Lỗi: 'Vui lòng nhập lý do từ chối'	⬜
AC4	Không có quyền duyệt	User role = Editor (không phải Manager)	Thử approve PR	403 Forbidden - không có quyền phê duyệt	⬜

UI Requirements:
•	Approve / Reject buttons (chỉ hiển thị cho Manager khi PR = SUBMITTED)
•	Reject dialog với textarea lý do (required)
•	Notification badge

Technical Notes:
• PATCH /api/v1/procurement/purchase-requests/{id}/approve
• PATCH /api/v1/procurement/purchase-requests/{id}/reject
• RBAC: chỉ Manager / Admin
• Notification: in-app + email


US-004: Xem danh sách PR
Priority	P0 - Must Have
Persona	Phòng Mua hàng
Epic	Epic 1: Purchase Request (PR)
Sprint	Sprint 1
Estimate	3 SP

User Story:
As a Procurement Staff
I want to view all Purchase Requests with filters by status and project
So that I can track procurement needs and process approved PRs into POs

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Hiển thị danh sách	Có 20 PRs trong hệ thống	Mở trang PR List	Hiển thị danh sách PR với ID, ngày tạo, người tạo, project, status, tổng số items	⬜
AC2	Lọc theo status	Danh sách đang hiển thị	Lọc status = APPROVED	Chỉ hiển thị PR đã duyệt, chờ tạo PO	⬜
AC3	Lọc theo project	Có PR cho nhiều dự án	Lọc theo project 'ABC Hotel'	Chỉ hiển thị PR liên quan đến dự án ABC Hotel	⬜

UI Requirements:
•	Table: PR ID, Date, Requester, Project, Status, Total Items
•	Filters: status, project, date range
•	Search by PR ID

Technical Notes:
• GET /api/v1/procurement/purchase-requests
• Query params: status, project_id, date_from, date_to
• Pagination


 
Epic 2: Purchase Order (PO)
Quy trình tạo, phê duyệt và theo dõi đơn đặt hàng với nhà cung cấp. PO không làm thay đổi tồn kho cho đến khi nhập kho (GRN).

US-005: Tạo Purchase Order từ PR
Priority	P0 - Must Have
Persona	Phòng Mua hàng
Epic	Epic 2: Purchase Order (PO)
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Procurement Staff
I want to create a Purchase Order from an approved PR or directly
So that I can formally order equipment from the supplier

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo PO từ PR	PR status = APPROVED	Nhấn 'Create PO from PR'	PO tạo với line items copy từ PR, PO status = DRAFT, PR link hiển thị	⬜
AC2	Tạo PO trực tiếp	Không có PR liên quan	Tạo PO mới, nhập NCC, items, giá	PO tạo thành công với status = DRAFT	⬜
AC3	PO không ảnh hưởng tồn	PO được tạo	Kiểm tra inventory_transaction	Không có transaction nào sinh ra	⬜
AC4	Thêm thông tin NCC	Đang tạo PO	Chọn supplier, nhập expected delivery date	PO có đầy đủ supplier info và ngày giao dự kiến	⬜

UI Requirements:
•	Form: Supplier (select), Expected Delivery Date, Line items (model, qty, unit price)
•	Link to source PR (nếu có)
•	Button: Save Draft, Submit for Approval

Technical Notes:
• POST /api/v1/procurement/purchase-orders
• Link: pr_id (optional)
• Status: DRAFT
• Không tạo inventory_transaction


US-006: Phê duyệt PO và gửi NCC
Priority	P0 - Must Have
Persona	Manager
Epic	Epic 2: Purchase Order (PO)
Sprint	Sprint 2
Estimate	3 SP

User Story:
As a Manager
I want to approve a Purchase Order before it is sent to the supplier
So that all orders are authorized and budget-controlled

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Approve PO	PO status = DRAFT	Nhấn Approve	Status → APPROVED, cho phép gửi NCC	⬜
AC2	Send to supplier	PO status = APPROVED	Nhấn Send to Supplier	Status → SENT, ghi nhận ngày gửi, PO locked	⬜
AC3	Reject PO	PO status = DRAFT	Nhấn Reject với lý do	Status → REJECTED	⬜

UI Requirements:
•	Approve / Reject / Send buttons theo status flow
•	PO PDF export cho gửi NCC
•	Timeline hiển thị lịch sử trạng thái

Technical Notes:
• PATCH /purchase-orders/{id}/approve
• PATCH /purchase-orders/{id}/send
• Status flow: DRAFT → APPROVED → SENT → PARTIALLY_RECEIVED → CLOSED


US-007: Theo dõi trạng thái PO
Priority	P1 - Should Have
Persona	Phòng Mua hàng
Epic	Epic 2: Purchase Order (PO)
Sprint	Sprint 2
Estimate	3 SP

User Story:
As a Procurement Staff
I want to track PO status and delivery progress
So that I can follow up with suppliers and inform PMs about expected arrivals

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	PO partially received	PO có 10 cameras, GRN nhập được 6	Xem PO detail	Status = PARTIALLY_RECEIVED, hiển thị 6/10 received	⬜
AC2	PO fully received	PO có 10 cameras, GRN nhập đủ 10	Xem PO detail	Status tự động chuyển CLOSED	⬜
AC3	Danh sách PO	Có nhiều PO trong hệ thống	Mở PO List, filter status = SENT	Hiển thị PO đang chờ giao hàng với progress bar nhận hàng	⬜

UI Requirements:
•	PO detail: line items với received vs ordered quantity
•	Progress bar nhận hàng
•	PO List với status filter

Technical Notes:
• Auto-update status khi GRN complete
• Aggregate received quantity từ GRN lines
• Status: PARTIALLY_RECEIVED khi 0 < received < ordered


 
Epic 3: Nhập kho (GRN - Goods Received Note)
Quy trình nhập kho với quản lý serial bắt buộc cho thiết bị và quản lý số lượng cho phụ kiện. Tồn kho chỉ sinh khi GRN COMPLETED.

US-008: Tạo GRN từ PO
Priority	P0 - Must Have
Persona	Thủ kho
Epic	Epic 3: Nhập kho (GRN - Goods Received Note)
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Warehouse Keeper
I want to create a Goods Received Note linked to a Purchase Order
So that I can begin the receiving process when goods arrive from the supplier

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo GRN từ PO	PO status = SENT, hàng đã đến kho	Chọn PO, nhấn 'Create GRN'	GRN tạo với status = DRAFT, line items copy từ PO với expected quantities	⬜
AC2	Chuyển sang RECEIVING	GRN status = DRAFT	Nhấn 'Start Receiving'	Status → RECEIVING, cho phép scan serial và nhập số lượng	⬜
AC3	GRN chưa sinh tồn	GRN status = RECEIVING	Kiểm tra inventory_transaction	Không có transaction nào sinh ra (tồn kho chưa thay đổi)	⬜

UI Requirements:
•	GRN form link to PO
•	Status badge: DRAFT / RECEIVING / COMPLETED / CANCELLED
•	Line items: model, expected qty, received qty, serial list

Technical Notes:
• POST /api/v1/warehouse/grn
• Link: po_id
• Status: DRAFT → RECEIVING
• Không tạo inventory_transaction cho đến COMPLETED


US-009: Scan Serial khi nhập thiết bị
Priority	P0 - Must Have
Persona	Thủ kho
Epic	Epic 3: Nhập kho (GRN - Goods Received Note)
Sprint	Sprint 2
Estimate	8 SP

User Story:
As a Warehouse Keeper
I want to scan serial numbers for each device during receiving
So that every serial-based device is individually tracked from the moment it enters inventory

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Scan serial thành công	GRN RECEIVING, line item = Camera AI x5	Scan serial 'CAM-001'	Serial ghi nhận vào GRN line, counter: 1/5 scanned	⬜
AC2	Serial trùng lặp	Serial 'CAM-001' đã tồn tại trong hệ thống	Scan 'CAM-001'	Lỗi: 'Serial CAM-001 đã tồn tại trong hệ thống, không thể nhập trùng'	⬜
AC3	Serial trùng trong cùng GRN	Đã scan 'CAM-001' cho GRN này	Scan lại 'CAM-001'	Lỗi: 'Serial CAM-001 đã được scan trong GRN này'	⬜
AC4	Scan vượt quantity	Line item expect 5, đã scan 5 serial	Scan serial thứ 6	Lỗi: 'Đã đủ số lượng cho line item này'	⬜
AC5	Xóa serial đã scan	GRN RECEIVING, serial CAM-003 đã scan	Nhấn Remove trên serial CAM-003	Serial bị xóa khỏi GRN, counter giảm 1	⬜

UI Requirements:
•	Serial scan input (barcode scanner compatible / manual input)
•	Scanned serial list với remove button
•	Counter: scanned / expected per line item
•	Visual feedback: success (green), error (red)

Technical Notes:
• POST /api/v1/warehouse/grn/{id}/scan-serial
• Validation: global serial uniqueness check
• Tạo device_instance record (status = pending, chưa in stock)
• DELETE serial từ GRN khi RECEIVING


US-010: Nhập phụ kiện (Non-serial)
Priority	P0 - Must Have
Persona	Thủ kho
Epic	Epic 3: Nhập kho (GRN - Goods Received Note)
Sprint	Sprint 2
Estimate	3 SP

User Story:
As a Warehouse Keeper
I want to enter received quantities for non-serial accessories
So that accessory stock is updated based on actual received amounts

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Nhập số lượng	GRN RECEIVING, line = Adapter x20	Nhập received_qty = 20	Số lượng nhận ghi nhận, sẵn sàng cho complete	⬜
AC2	Nhập thiếu	Expected 20, nhập received = 18	Ghi nhận 18	Cho phép (partial receiving), ghi chú chênh lệch	⬜
AC3	Không tạo device_instance	Nhập phụ kiện non-serial	GRN complete	Chỉ tạo inventory_transaction (+18), KHÔNG tạo device_instance	⬜

UI Requirements:
•	Quantity input cho non-serial line items
•	Variance display: expected vs received
•	Notes field cho chênh lệch

Technical Notes:
• PATCH GRN line item received_qty
• Phân biệt: serial-based vs non-serial logic
• Non-serial: chỉ inventory_transaction, không device_instance


US-011: Complete GRN - Sinh tồn kho
Priority	P0 - Must Have
Persona	Thủ kho
Epic	Epic 3: Nhập kho (GRN - Goods Received Note)
Sprint	Sprint 2
Estimate	8 SP

User Story:
As a Warehouse Keeper
I want to complete a GRN to finalize the receiving process
So that inventory is officially updated and devices become available for outbound

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Complete thành công (serial)	GRN RECEIVING, Camera AI x5 đã scan đủ 5 serial	Nhấn Complete GRN	Status → COMPLETED, 5 inventory_transaction (+1 mỗi serial), 5 device_instance status = IN_STOCK	⬜
AC2	Complete thành công (non-serial)	GRN RECEIVING, Adapter x20 đã nhập qty = 20	Nhấn Complete GRN	Status → COMPLETED, 1 inventory_transaction (+20), tồn kho tăng 20	⬜
AC3	Chặn complete khi thiếu serial	Line Camera AI x5, chỉ scan 3 serial	Nhấn Complete	Lỗi: 'Line Camera AI còn thiếu 2 serial. Không thể hoàn tất.'	⬜
AC4	Lock sau complete	GRN status = COMPLETED	Thử sửa serial hoặc quantity	Tất cả field bị locked, không cho chỉnh sửa	⬜
AC5	Update PO status	GRN complete, PO có 10 items, đã nhận 10	GRN completed	PO status tự động chuyển CLOSED	⬜

UI Requirements:
•	Complete button (chỉ khi tất cả serial-based lines đã đủ serial)
•	Confirmation dialog: summary of items to be stocked
•	Lock icon sau complete

Technical Notes:
• POST /api/v1/warehouse/grn/{id}/complete
• Validation: serial count = expected qty cho serial-based
• Batch insert: inventory_transaction (type = INBOUND)
• Update device_instance status → IN_STOCK
• Lock GRN (immutable sau COMPLETED)
• Auto-update PO received quantities


US-012: Cancel GRN
Priority	P1 - Should Have
Persona	Thủ kho
Epic	Epic 3: Nhập kho (GRN - Goods Received Note)
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Warehouse Keeper
I want to cancel a GRN that was created by mistake
So that incorrect receiving processes are properly voided without affecting inventory

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Cancel GRN DRAFT	GRN status = DRAFT	Nhấn Cancel	Status → CANCELLED, không ảnh hưởng gì	⬜
AC2	Cancel GRN RECEIVING	GRN RECEIVING, đã scan 3 serial	Nhấn Cancel, nhập lý do	Status → CANCELLED, serial records bị xóa, không sinh tồn	⬜
AC3	Không cancel COMPLETED	GRN status = COMPLETED	Thử Cancel	Button bị ẩn/disabled - GRN COMPLETED không thể cancel (chỉ REVERSE)	⬜

UI Requirements:
•	Cancel button (chỉ DRAFT / RECEIVING)
•	Cancel reason dialog (required)
•	Cancelled badge trên GRN

Technical Notes:
• PATCH /api/v1/warehouse/grn/{id}/cancel
• Cleanup: xóa pending device_instance nếu RECEIVING
• Không cho cancel COMPLETED


US-013: Cảnh báo GRN RECEIVING quá lâu
Priority	P2 - Nice to Have
Persona	Thủ kho / Manager
Epic	Epic 3: Nhập kho (GRN - Goods Received Note)
Sprint	Sprint 5
Estimate	2 SP

User Story:
As a Manager
I want to be alerted when a GRN stays in RECEIVING status for more than 48 hours
So that stuck receiving processes are identified and resolved quickly

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Cảnh báo 48h	GRN RECEIVING từ 49 giờ trước	Hệ thống chạy check định kỳ	Hiển thị cảnh báo trên dashboard, gửi notification cho thủ kho và manager	⬜
AC2	Danh sách GRN overdue	Có 3 GRN RECEIVING > 48h	Mở Dashboard	Widget cảnh báo: 3 GRN quá hạn với link trực tiếp	⬜

UI Requirements:
•	Dashboard warning widget
•	GRN list highlight overdue items
•	Notification badge

Technical Notes:
• Background job: check GRN RECEIVING > 48h
• Notification: in-app + email
• Dashboard API: overdue GRNs count


 
Epic 4: Xuất kho (Outbound)
Quy trình xuất kho đa loại: theo dự án, POC, nội bộ, mượn đối tác, bảo trì. Phân biệt rõ serial-based và non-serial.

US-014: Tạo Outbound Order
Priority	P0 - Must Have
Persona	PM / Thủ kho
Epic	Epic 4: Xuất kho (Outbound)
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Project Manager
I want to create an Outbound Order specifying the type (project/POC/internal/loan/maintenance)
So that the warehouse can prepare and dispatch the correct equipment

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo xuất dự án	PM cần thiết bị cho project 'ABC Hotel'	Tạo Outbound Order type = PROJECT_OUT, chọn project	Order tạo thành công với project link và line items	⬜
AC2	Tạo xuất POC	Cần gửi camera demo	Tạo order type = POC_OUT	Order tạo với expected return date	⬜
AC3	5 loại xuất	User tạo outbound order	Lần lượt chọn các type	Tất cả 5 type hoạt động: PROJECT_OUT, POC_OUT, INTERNAL_USE, PARTNER_LOAN_OUT, MAINTENANCE_OUT	⬜
AC4	Chặn xuất khi GRN RECEIVING	Có GRN đang RECEIVING cho cùng model	Tạo outbound order	Cảnh báo: 'Có GRN đang receiving, xác nhận vẫn muốn xuất?'	⬜

UI Requirements:
•	Form: Outbound type (select), Project (conditional), Recipient, Expected return date (cho POC/LOAN)
•	Line items: model, quantity
•	Button: Save Draft, Confirm

Technical Notes:
• POST /api/v1/warehouse/outbound-orders
• Types: PROJECT_OUT, POC_OUT, INTERNAL_USE, PARTNER_LOAN_OUT, MAINTENANCE_OUT
• Validation: check GRN RECEIVING status


US-015: Xuất kho Serial-based - Scan serial
Priority	P0 - Must Have
Persona	Thủ kho
Epic	Epic 4: Xuất kho (Outbound)
Sprint	Sprint 3
Estimate	8 SP

User Story:
As a Warehouse Keeper
I want to scan serial numbers when dispatching serial-based devices
So that each device is tracked from warehouse to its destination with full traceability

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Scan serial xuất kho	Outbound order confirmed, device CAM-001 status = IN_STOCK	Scan serial CAM-001	Serial ghi nhận, inventory_transaction (-1), device status → DEPLOYED	⬜
AC2	Scan device RESERVED cho đúng project	CAM-002 RESERVED cho project ABC	Xuất cho project ABC, scan CAM-002	Xuất thành công, device → DEPLOYED	⬜
AC3	Chặn xuất device RESERVED cho project khác	CAM-002 RESERVED cho project ABC	Xuất cho project XYZ, scan CAM-002	Lỗi: 'CAM-002 đã reserved cho project ABC, không thể xuất cho XYZ'	⬜
AC4	Chặn xuất device không IN_STOCK/RESERVED	Device CAM-003 status = DEPLOYED	Scan CAM-003 để xuất	Lỗi: 'CAM-003 không ở trạng thái có thể xuất (hiện tại: DEPLOYED)'	⬜
AC5	Device status cập nhật theo type	Xuất cho POC	Scan serial, complete outbound	Device status → POC (không phải DEPLOYED)	⬜

UI Requirements:
•	Serial scan input (barcode/manual)
•	Real-time device status check trước khi accept
•	Scanned list với device info và destination
•	Status mapping per outbound type

Technical Notes:
• POST /api/v1/warehouse/outbound-orders/{id}/scan-serial
• Validation: device.status IN (IN_STOCK, RESERVED)
• Validation: reservation project match
• Insert inventory_transaction (type = OUTBOUND, -1)
• Update device_instance.status theo outbound type mapping


US-016: Xuất kho Non-serial (Phụ kiện)
Priority	P0 - Must Have
Persona	Thủ kho
Epic	Epic 4: Xuất kho (Outbound)
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Warehouse Keeper
I want to dispatch accessories by quantity without serial scanning
So that non-serial items are deducted from stock efficiently

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Xuất phụ kiện	Adapter tồn kho = 50, outbound order = 10	Confirm xuất 10 adapters	inventory_transaction (-10), tồn kho giảm từ 50 → 40	⬜
AC2	Chặn xuất vượt tồn	Adapter tồn kho = 5, yêu cầu xuất 10	Confirm xuất	Lỗi: 'Tồn kho không đủ. Hiện có: 5, yêu cầu: 10'	⬜
AC3	Không tồn âm	Tồn kho = 0	Thử xuất 1	Lỗi: 'Tồn kho = 0, không thể xuất'	⬜

UI Requirements:
•	Quantity input cho non-serial items
•	Available stock display real-time
•	Warning khi gần hết tồn

Technical Notes:
• Validation: available_qty >= outbound_qty
• inventory_transaction (type = OUTBOUND, -qty)
• Không tạo device_instance


US-017: Hoàn tất Outbound Order
Priority	P0 - Must Have
Persona	Thủ kho
Epic	Epic 4: Xuất kho (Outbound)
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Warehouse Keeper
I want to complete an Outbound Order after all items are dispatched
So that the order is finalized and locked for audit trail

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Complete outbound	Tất cả line items đã xuất đủ	Nhấn Complete	Order status = COMPLETED, locked	⬜
AC2	Chặn complete thiếu serial	Serial line chưa scan đủ	Nhấn Complete	Lỗi: 'Còn thiếu serial cho line Camera AI'	⬜
AC3	Audit trail	Outbound completed	Xem activity log	Ghi nhận: who, when, what items, destination project	⬜

UI Requirements:
•	Complete button
•	Summary confirmation dialog
•	Print/Export phiếu xuất kho

Technical Notes:
• POST /api/v1/warehouse/outbound-orders/{id}/complete
• Validation: all serial scanned, all qty dispatched
• Lock order after complete
• Audit log entry


 
Epic 5: Reservation theo dự án
Cho phép PM giữ thiết bị cho dự án cụ thể. Reservation không giảm tồn nhưng ngăn xuất nhầm sang dự án khác.

US-018: Reserve thiết bị cho dự án
Priority	P0 - Must Have
Persona	Project Manager
Epic	Epic 5: Reservation theo dự án
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Project Manager
I want to reserve specific serial devices for my project
So that they are secured for deployment and cannot be taken by other projects

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Reserve thành công	Device CAM-010 status = IN_STOCK	Reserve cho project 'ABC Hotel'	Device status → RESERVED, gắn project_id, hiển thị badge RESERVED trên device	⬜
AC2	Reserve device không IN_STOCK	Device CAM-011 status = DEPLOYED	Thử reserve	Lỗi: 'Chỉ có thể reserve thiết bị đang IN_STOCK'	⬜
AC3	Reservation không giảm tồn	Reserve 3 devices	Kiểm tra inventory_transaction	Không có transaction mới, tồn kho vẫn giữ nguyên	⬜
AC4	Unreserve	Device đang RESERVED cho project ABC	PM nhấn Unreserve	Device status → IN_STOCK, project_id = null	⬜

UI Requirements:
•	Device list với filter status = IN_STOCK
•	Reserve button: chọn device → chọn project → confirm
•	Reserved devices list per project
•	Unreserve action

Technical Notes:
• POST /api/v1/warehouse/reservations
• Update device_instance: status → RESERVED, project_id
• Không tạo inventory_transaction
• DELETE /reservations/{id} để unreserve


US-019: Xem thiết bị đã reserve theo dự án
Priority	P1 - Should Have
Persona	Project Manager
Epic	Epic 5: Reservation theo dự án
Sprint	Sprint 4
Estimate	3 SP

User Story:
As a Project Manager
I want to view all devices reserved for my project
So that I can plan deployment and confirm equipment readiness

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Xem danh sách reserved	Project ABC có 5 devices reserved	Mở Project Devices tab	Hiển thị 5 devices với serial, model, status RESERVED	⬜
AC2	Phân biệt reserved vs deployed	Project có 3 RESERVED + 7 DEPLOYED	Xem device list	Hiển thị rõ ràng: 3 Chờ triển khai, 7 Đã triển khai	⬜

UI Requirements:
•	Project device list grouped by status
•	Serial number, model, reservation date
•	Action: Unreserve, Create Outbound

Technical Notes:
• GET /api/v1/warehouse/devices?project_id={id}&status=RESERVED
• Link đến project từ PMS integration


 
Epic 6: Device Lifecycle
Theo dõi toàn bộ vòng đời thiết bị từ nhập kho đến retired. Mọi thay đổi trạng thái được ghi nhận trong device_status_history.

US-020: Xem Device Detail và History
Priority	P0 - Must Have
Persona	Kỹ thuật / PM
Epic	Epic 6: Device Lifecycle
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Technician
I want to view full device details and status history by serial number
So that I can understand the complete lifecycle of any device for troubleshooting and auditing

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Xem device detail	Device CAM-001 tồn tại	Tìm kiếm serial CAM-001	Hiển thị: serial, model, current status, project, site, warranty dates, all metadata	⬜
AC2	Xem status history	Device đã qua nhiều trạng thái	Mở History tab	Timeline: IN_STOCK → RESERVED → DEPLOYED → MAINTENANCE → DEPLOYED, mỗi entry có date, actor, notes	⬜
AC3	Truy xuất < 1s	Hệ thống có 10,000+ devices	Search serial	Kết quả trả về trong < 1 giây	⬜

UI Requirements:
•	Device detail page: serial, model, status badge, project info, warranty info
•	Status history timeline (chronological)
•	Search bar: scan/type serial

Technical Notes:
• GET /api/v1/devices/{serial}
• GET /api/v1/devices/{serial}/history
• device_status_history: device_id, from_status, to_status, changed_by, changed_at, notes
• Index trên serial cho < 1s lookup


US-021: Cập nhật trạng thái lắp đặt (DEPLOYED)
Priority	P0 - Must Have
Persona	Kỹ thuật triển khai
Epic	Epic 6: Device Lifecycle
Sprint	Sprint 4
Estimate	3 SP

User Story:
As a Field Technician
I want to update device status to DEPLOYED with site and installation date
So that deployment progress is tracked accurately per project

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Update DEPLOYED	Device xuất cho project, status vừa outbound	Cập nhật: site = 'Tầng B1', ngày lắp = today	Device status → DEPLOYED, site và install_date ghi nhận, history entry tạo	⬜
AC2	Ghi nhận site info	Device đang DEPLOYED	Xem device detail	Hiển thị: site location, installation date, technician	⬜

UI Requirements:
•	Deploy form: Site location, Installation date, Notes
•	Quick update từ mobile-friendly interface

Technical Notes:
• PATCH /api/v1/devices/{serial}/deploy
• Update: status, site, install_date
• Insert device_status_history entry


US-022: Kích hoạt AI (ACTIVATED)
Priority	P0 - Must Have
Persona	Kỹ thuật triển khai
Epic	Epic 6: Device Lifecycle
Sprint	Sprint 4
Estimate	3 SP

User Story:
As a Field Technician
I want to update device status to ACTIVATED after configuring firmware and AI license
So that activation status is tracked and warranty period begins

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Activate device	Device status = DEPLOYED	Cập nhật firmware version, AI license key, nhấn Activate	Status → ACTIVATED, warranty_start_date = today, history entry tạo	⬜
AC2	Chỉ activate từ DEPLOYED	Device status = IN_STOCK	Thử activate	Lỗi: 'Chỉ có thể kích hoạt thiết bị đã lắp đặt (DEPLOYED)'	⬜
AC3	Warranty start date	Device activated	Xem device detail	warranty_start_date hiển thị, warranty_end_date tự tính (VD: +12 tháng)	⬜

UI Requirements:
•	Activation form: Firmware version, AI License, Notes
•	Warranty info auto-populated after activation

Technical Notes:
• PATCH /api/v1/devices/{serial}/activate
• Set warranty_start_date, calculate warranty_end_date
• Status transition: DEPLOYED → ACTIVATED only


US-023: Retire thiết bị
Priority	P1 - Should Have
Persona	Manager
Epic	Epic 6: Device Lifecycle
Sprint	Sprint 5
Estimate	2 SP

User Story:
As a Manager
I want to retire devices that are permanently out of service
So that they are removed from active inventory without deleting the serial record

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Retire device	Device cần loại bỏ	Nhấn Retire, nhập lý do	Status → RETIRED, serial vẫn tồn tại trong hệ thống, history ghi nhận	⬜
AC2	Không xóa serial	Device RETIRED	Tìm kiếm serial	Vẫn tìm thấy device với status RETIRED, toàn bộ history preserved	⬜
AC3	Retired không cho xuất	Device RETIRED	Thử tạo outbound	Lỗi: device không ở trạng thái có thể xuất	⬜

UI Requirements:
•	Retire button với reason dialog
•	RETIRED badge (gray)
•	Retired devices có thể filter riêng

Technical Notes:
• PATCH /api/v1/devices/{serial}/retire
• Status → RETIRED (terminal state)
• Serial KHÔNG bị xóa, chỉ change status


 
Epic 7: Bảo hành & Bảo trì (Warranty)
Quy trình tiếp nhận và xử lý bảo hành thiết bị. Ghi nhận lịch sử lỗi, theo dõi warranty period, xử lý đổi thiết bị.

US-024: Tạo Warranty Ticket
Priority	P0 - Must Have
Persona	Bộ phận Bảo hành
Epic	Epic 7: Bảo hành & Bảo trì (Warranty)
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Warranty Staff
I want to create a warranty ticket linked to a device serial
So that the maintenance process is formally tracked from issue report to resolution

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo ticket thành công	Device CAM-001 status = DEPLOYED/ACTIVATED	Tạo warranty ticket: serial = CAM-001, mô tả lỗi 'Mất kết nối WiFi'	Ticket tạo, device status → MAINTENANCE, history entry ghi nhận	⬜
AC2	Check warranty còn hiệu lực	Device activated 6 tháng trước, warranty = 12 tháng	Tạo ticket	Ticket hiển thị 'Trong thời gian bảo hành', warranty_covered = true	⬜
AC3	Warranty hết hạn	Device activated 14 tháng trước, warranty = 12 tháng	Tạo ticket	Cảnh báo: 'Thiết bị đã hết bảo hành', warranty_covered = false	⬜
AC4	Ghi nhận lịch sử lỗi	Device đã có 1 ticket cũ	Tạo ticket mới	Ticket mới tạo, lịch sử hiển thị cả ticket cũ và mới	⬜

UI Requirements:
•	Ticket form: Serial (search/scan), Issue description, Priority, Reported by
•	Warranty status indicator (in/out of warranty)
•	Fault history per device

Technical Notes:
• POST /api/v1/warranty/tickets
• Update device status → MAINTENANCE
• Check warranty_end_date vs today
• Link: device_serial, project_id


US-025: Xử lý bảo hành - Sửa chữa
Priority	P0 - Must Have
Persona	Bộ phận Bảo hành
Epic	Epic 7: Bảo hành & Bảo trì (Warranty)
Sprint	Sprint 5
Estimate	5 SP

User Story:
As a Warranty Staff
I want to record the repair result and return the device to the project
So that fixed devices are redeployed and the maintenance cycle is complete

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Sửa thành công	Ticket open, device MAINTENANCE	Ghi nhận: 'Thay module WiFi', nhấn Resolve	Ticket closed, device status → DEPLOYED, gán lại project gốc	⬜
AC2	Ghi nhận chi tiết sửa	Ticket đang xử lý	Nhập repair notes, parts replaced, technician	Thông tin lưu vào ticket, có thể xem lại	⬜
AC3	Device trở lại đúng project	Device từ project ABC bị bảo hành	Resolve ticket	Device status → DEPLOYED, project vẫn = ABC	⬜

UI Requirements:
•	Repair form: Diagnosis, Action taken, Parts replaced, Technician
•	Resolve button
•	Timeline: reported → in repair → resolved

Technical Notes:
• PATCH /api/v1/warranty/tickets/{id}/resolve
• Update device: status → DEPLOYED (hoặc ACTIVATED)
• Restore project assignment
• Insert device_status_history


US-026: Xử lý bảo hành - Đổi thiết bị
Priority	P0 - Must Have
Persona	Bộ phận Bảo hành
Epic	Epic 7: Bảo hành & Bảo trì (Warranty)
Sprint	Sprint 5
Estimate	5 SP

User Story:
As a Warranty Staff
I want to replace a defective device with a new one and retire the old serial
So that the project gets a working device while maintaining full traceability of both serials

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Đổi thiết bị	CAM-001 không sửa được, CAM-050 IN_STOCK	Chọn 'Replace Device', scan serial mới CAM-050	CAM-001 → RETIRED, CAM-050 → DEPLOYED gán project gốc, ticket ghi nhận cả 2 serial	⬜
AC2	Serial cũ RETIRED	Sau khi đổi thiết bị	Tìm serial CAM-001	Status = RETIRED, history ghi nhận 'Replaced by CAM-050'	⬜
AC3	Serial mới gán project	CAM-050 thay thế cho project ABC	Xem project ABC devices	CAM-050 hiển thị trong danh sách devices của ABC, CAM-001 không còn active	⬜
AC4	Không nhập tồn bán mới	Thiết bị bảo hành	Đổi thiết bị	Không tạo inventory_transaction INBOUND cho serial cũ (không nhập lại tồn)	⬜

UI Requirements:
•	Replace flow: scan new serial → confirm swap
•	Summary: old serial (RETIRED) → new serial (DEPLOYED)
•	Both serials linked in ticket

Technical Notes:
• POST /api/v1/warranty/tickets/{id}/replace
• Old device: status → RETIRED
• New device: status → DEPLOYED, project_id = old.project_id
• Không tạo INBOUND transaction cho warranty returns
• Ticket: old_serial, new_serial references


US-027: Xem danh sách Warranty Tickets
Priority	P1 - Should Have
Persona	Manager / Bảo hành
Epic	Epic 7: Bảo hành & Bảo trì (Warranty)
Sprint	Sprint 5
Estimate	3 SP

User Story:
As a Manager
I want to view all warranty tickets with filters by status, device model and project
So that I can monitor warranty workload and identify recurring issues

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Danh sách tickets	Có 30 warranty tickets	Mở Warranty List	Hiển thị: ticket ID, serial, model, project, status, created date, priority	⬜
AC2	Filter theo status	Tickets có nhiều status	Lọc status = OPEN	Chỉ hiển thị tickets chưa xử lý	⬜
AC3	Tỷ lệ lỗi theo model	Nhiều tickets cho các model khác nhau	Xem báo cáo tỷ lệ lỗi	Hiển thị: Model A - 15% fail rate, Model B - 3% fail rate	⬜

UI Requirements:
•	Ticket list with filters: status, model, project, date range
•	Failure rate dashboard widget

Technical Notes:
• GET /api/v1/warranty/tickets?status=&model=&project_id=
• Aggregate: failure count / total deployed per model


 
Epic 8: Báo cáo Tồn kho & Dự án
Các báo cáo tồn kho theo kho, SKU, serial, project. Đảm bảo transaction-based inventory với sai lệch < 1%.

US-028: Báo cáo tồn kho tổng hợp
Priority	P0 - Must Have
Persona	Thủ kho / Manager
Epic	Epic 8: Báo cáo Tồn kho & Dự án
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Warehouse Manager
I want to view inventory reports by warehouse, SKU and category
So that I have accurate visibility into current stock levels and can make informed decisions

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tồn kho theo SKU	Kho có nhiều loại thiết bị	Mở báo cáo tồn kho	Hiển thị: SKU, Model name, In Stock qty, Reserved qty, Total qty cho mỗi item	⬜
AC2	Tồn kho = SUM(transactions)	Kiểm tra accuracy	So sánh tồn kho hiển thị với SUM(inventory_transaction)	Khớp 100%, không có chênh lệch	⬜
AC3	Tồn theo loại	Có hàng serial và non-serial	Filter: Serial-based only	Chỉ hiển thị Camera AI, NVR với serial count	⬜
AC4	Không tồn âm	Kiểm tra toàn bộ SKU	Scan all inventory	Không có SKU nào có tồn kho < 0	⬜

UI Requirements:
•	Inventory dashboard: SKU list, qty columns
•	Filters: warehouse, category (serial/non-serial), model
•	Export: Excel, PDF

Technical Notes:
• GET /api/v1/warehouse/inventory/report
• Calculation: SUM(inventory_transaction) GROUP BY sku
• Constraint: tồn kho >= 0 (check on every transaction)


US-029: Báo cáo serial theo dự án
Priority	P0 - Must Have
Persona	Project Manager
Epic	Epic 8: Báo cáo Tồn kho & Dự án
Sprint	Sprint 4
Estimate	3 SP

User Story:
As a Project Manager
I want to view all serial devices assigned to my project with their current status
So that I can track deployment progress and equipment accountability per project

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Danh sách serial theo project	Project ABC có 20 devices	Mở Project Device Report	Hiển thị 20 devices: serial, model, status (RESERVED/DEPLOYED/ACTIVATED/MAINTENANCE), site	⬜
AC2	Trạng thái triển khai	10 deployed, 5 activated, 3 reserved, 2 maintenance	Xem summary	KPI cards: 50% Deployed, 25% Activated, 15% Reserved, 10% Maintenance	⬜

UI Requirements:
•	Project device table: serial, model, status, site, dates
•	Status summary KPI cards
•	Export per project

Technical Notes:
• GET /api/v1/warehouse/devices?project_id={id}
• Aggregate by status per project


US-030: Truy xuất lịch sử thiết bị theo serial
Priority	P0 - Must Have
Persona	Manager / Auditor
Epic	Epic 8: Báo cáo Tồn kho & Dự án
Sprint	Sprint 5
Estimate	3 SP

User Story:
As an Auditor
I want to trace the complete history of any device by serial number
So that I can verify the full chain of custody from procurement to current status

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Full traceability	Device CAM-001 qua nhiều trạng thái	Search serial CAM-001	Timeline hiển thị: PO → GRN → IN_STOCK → RESERVED → DEPLOYED → ACTIVATED, mỗi entry có date + actor	⬜
AC2	Link đến chứng từ	Device liên quan PO-001, GRN-003, OB-005	Xem device history	Mỗi entry có link trực tiếp đến PO, GRN, Outbound Order tương ứng	⬜
AC3	Lookup < 1 second	Hệ thống có 10,000+ devices	Search serial	Kết quả trả về trong < 1 giây	⬜

UI Requirements:
•	Serial search bar (scan/type)
•	Full lifecycle timeline
•	Clickable links to related documents (PO, GRN, Outbound, Ticket)

Technical Notes:
• GET /api/v1/devices/{serial}/full-trace
• Join: device_status_history + inventory_transaction + linked documents
• Index on serial for < 1s


US-031: Báo cáo bảo hành
Priority	P1 - Should Have
Persona	Manager
Epic	Epic 8: Báo cáo Tồn kho & Dự án
Sprint	Sprint 6
Estimate	3 SP

User Story:
As a Manager
I want to view warranty reports including devices under warranty, failure rates by model, and pending tickets
So that I can evaluate equipment quality and plan maintenance resources

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Thiết bị đang bảo hành	5 devices status = MAINTENANCE	Mở Warranty Report	Hiển thị 5 devices với serial, model, project, ticket info	⬜
AC2	Tỷ lệ lỗi theo model	Model A: 100 deployed, 15 tickets | Model B: 50 deployed, 2 tickets	Xem failure rate chart	Model A: 15%, Model B: 4%, sorted by highest rate	⬜
AC3	Devices sắp hết warranty	10 devices warranty hết trong 30 ngày tới	Mở upcoming expiry report	Hiển thị 10 devices cần gia hạn hoặc lưu ý	⬜

UI Requirements:
•	Warranty dashboard: active tickets, under maintenance count
•	Failure rate chart by model
•	Warranty expiry warning list

Technical Notes:
• Aggregate queries on warranty_tickets + device_instances
• Calculate: tickets / deployed_count per model
• Filter: warranty_end_date BETWEEN today AND today+30


 
Epic 9: Kiểm soát nội bộ & Audit
Đảm bảo audit log cho mọi thao tác, lock chứng từ sau hoàn tất, không cho xóa chứng từ, phân quyền theo role.

US-032: Audit Log toàn diện
Priority	P0 - Must Have
Persona	Manager / Auditor
Epic	Epic 9: Kiểm soát nội bộ & Audit
Sprint	Sprint 3
Estimate	5 SP

User Story:
As an Auditor
I want every action in the system to be recorded in an audit log
So that there is a complete and tamper-proof record of all operations for compliance

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Log mọi thao tác	User tạo GRN, scan serial, complete GRN	Xem audit log	Mỗi action có record: who, when, what entity, what action, before/after values	⬜
AC2	Không xóa log	Audit log có 10,000 entries	Thử xóa log entry	Không có chức năng xóa log, append-only	⬜
AC3	Filter audit log	Nhiều log entries	Filter by entity = GRN, date range = last 7 days	Hiển thị chỉ GRN-related actions trong 7 ngày qua	⬜

UI Requirements:
•	Audit log page: searchable, filterable
•	Filters: entity type, action, user, date range
•	Detail view: before/after JSON diff

Technical Notes:
• Audit log table: entity_type, entity_id, action, actor_id, timestamp, changes (JSONB)
• Append-only: no DELETE permission
• Index on entity_type + timestamp


US-033: Lock chứng từ sau hoàn tất
Priority	P0 - Must Have
Persona	System
Epic	Epic 9: Kiểm soát nội bộ & Audit
Sprint	Sprint 2
Estimate	3 SP

User Story:
As the System
I want to lock all documents (GRN, Outbound Order, PO) after they are completed
So that completed records cannot be tampered with, ensuring data integrity

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Lock GRN COMPLETED	GRN status = COMPLETED	Thử edit bất kỳ field nào	Tất cả fields readonly, API trả 403 'Document is locked'	⬜
AC2	Lock PO CLOSED	PO status = CLOSED	Thử edit	Locked, không cho chỉnh sửa	⬜
AC3	Lock Outbound COMPLETED	Outbound order COMPLETED	Thử edit	Locked	⬜

UI Requirements:
•	Lock icon trên locked documents
•	Tooltip: 'Chứng từ đã hoàn tất, không thể chỉnh sửa'
•	Tất cả input fields disabled

Technical Notes:
• Middleware: check document status trước khi allow PATCH
• Return 403 với message cho locked documents
• Apply to: GRN, PO, Outbound Order


US-034: Không cho xóa chứng từ - chỉ Cancel/Reverse
Priority	P0 - Must Have
Persona	System
Epic	Epic 9: Kiểm soát nội bộ & Audit
Sprint	Sprint 2
Estimate	3 SP

User Story:
As the System
I want to prevent deletion of any document and only allow cancellation or reversal
So that there is always a complete paper trail for every transaction

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Không có nút Delete	Xem bất kỳ GRN/PO/Outbound	Tìm Delete button	Không có Delete button, chỉ có Cancel (khi DRAFT/RECEIVING)	⬜
AC2	API block DELETE	Gọi DELETE /api/v1/warehouse/grn/{id}	Send request	405 Method Not Allowed hoặc 403 Forbidden	⬜
AC3	Cancel có lý do	GRN DRAFT	Nhấn Cancel	Yêu cầu nhập lý do, status → CANCELLED, record vẫn tồn tại	⬜

UI Requirements:
•	Không có Delete button trên bất kỳ document nào
•	Cancel button thay thế (với reason dialog)
•	Cancelled documents hiển thị với strikethrough style

Technical Notes:
• Không implement DELETE endpoint cho GRN, PO, Outbound
• Cancel endpoint: PATCH with status = CANCELLED + reason
• Cancelled records: soft-delete pattern, preserved in DB


US-035: Phân quyền theo Role
Priority	P0 - Must Have
Persona	Admin
Epic	Epic 9: Kiểm soát nội bộ & Audit
Sprint	Sprint 1
Estimate	8 SP

User Story:
As an Admin
I want role-based access control across all procurement and warehouse functions
So that each team member can only perform actions appropriate to their role

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Thủ kho quản lý GRN/Outbound	User role = Warehouse Keeper	Tạo GRN, scan serial, complete GRN	Tất cả thành công - đúng quyền	⬜
AC2	PM tạo PR, không tạo PO	User role = PM	Tạo PR (OK), thử tạo PO	PR thành công, PO bị 403 Forbidden	⬜
AC3	Procurement tạo PO	User role = Procurement Staff	Tạo PO, gửi NCC	Thành công	⬜
AC4	Viewer chỉ xem	User role = Viewer	Thử tạo/edit bất kỳ entity	403 Forbidden cho tất cả write actions	⬜

UI Requirements:
•	Permission-based UI rendering: ẩn buttons không có quyền
•	Role indicator trên user profile

Technical Notes:
• RBAC middleware trên mọi API endpoint
• Roles: Admin, Manager, Procurement, Warehouse Keeper, PM, Technician, Warranty Staff, Viewer
• Permission matrix per role per entity


 
Epic 10: Dashboard & Tích hợp PMS
Dashboard tổng quan tồn kho, KPI vận hành, và tích hợp với hệ thống PMS để liên kết thiết bị-dự án.

US-036: Warehouse Dashboard
Priority	P0 - Must Have
Persona	Manager / Thủ kho
Epic	Epic 10: Dashboard & Tích hợp PMS
Sprint	Sprint 5
Estimate	8 SP

User Story:
As a Warehouse Manager
I want a dashboard showing key inventory KPIs, pending actions and alerts
So that I can monitor warehouse operations at a glance and act on urgent items

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	KPI cards	Hệ thống có dữ liệu	Mở Dashboard	Hiển thị: Total in-stock devices, Total in-stock accessories, Pending GRNs, Active warranty tickets, Devices under maintenance	⬜
AC2	Alerts widget	3 GRN RECEIVING > 48h, 5 devices warranty sắp hết	Xem alerts	Hiển thị cảnh báo: 3 GRN overdue, 5 warranties expiring soon	⬜
AC3	Quick actions	Dashboard loaded	Nhấn 'Create GRN' shortcut	Navigate đến Create GRN form	⬜

UI Requirements:
•	KPI cards row
•	Alerts/Warnings panel
•	Quick action buttons
•	Recent transactions feed

Technical Notes:
• Dashboard aggregation API
• Real-time counts from inventory + warranty modules


US-037: Tích hợp PMS - Liên kết thiết bị với dự án
Priority	P1 - Should Have
Persona	Project Manager
Epic	Epic 10: Dashboard & Tích hợp PMS
Sprint	Sprint 6
Estimate	5 SP

User Story:
As a Project Manager
I want to see linked devices directly from my PMS project
So that I can manage both project tasks and equipment from a unified view

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Xem devices từ PMS project	Project ABC có 10 devices trong warehouse module	Mở PMS Project Detail → Devices tab	Hiển thị 10 devices: serial, model, status, site	⬜
AC2	Create PR từ PMS	PM đang ở PMS project	Nhấn 'Request Equipment'	Navigate đến Create PR form với project pre-filled	⬜
AC3	Reservation từ PMS	PM đang ở PMS project	Nhấn 'Reserve Devices'	Mở device selection với filter IN_STOCK, reserve cho project hiện tại	⬜

UI Requirements:
•	Devices tab trong PMS Project Detail
•	Quick links: Request Equipment, Reserve Devices
•	Device status summary widget

Technical Notes:
• Cross-module API: PMS project_id ↔ Warehouse project_id
• GET /api/v1/warehouse/devices?project_id={pms_project_id}
• Deep links giữa PMS và Warehouse


US-038: Reverse Transaction cho GRN COMPLETED
Priority	P1 - Should Have
Persona	Manager
Epic	Epic 10: Dashboard & Tích hợp PMS
Sprint	Sprint 6
Estimate	5 SP

User Story:
As a Manager
I want to reverse a completed GRN when goods must be returned to supplier
So that inventory is corrected through a proper reversal transaction rather than deletion

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Reverse GRN	GRN COMPLETED, devices IN_STOCK chưa xuất	Nhấn Reverse, nhập lý do	Reverse transactions tạo (-1 per serial), device status updated, GRN status → REVERSED	⬜
AC2	Chặn reverse nếu device đã xuất	GRN COMPLETED, 1 device đã DEPLOYED	Thử Reverse	Lỗi: 'CAM-001 đã xuất kho (DEPLOYED), không thể reverse'	⬜
AC3	Audit trail cho reverse	GRN reversed	Xem audit log	Ghi nhận: reverse action, lý do, affected serials, original GRN link	⬜

UI Requirements:
•	Reverse button (chỉ cho Manager, chỉ GRN COMPLETED)
•	Pre-check: hiển thị devices không thể reverse
•	Reason dialog (required)

Technical Notes:
• POST /api/v1/warehouse/grn/{id}/reverse
• Validation: all devices still IN_STOCK
• Create reverse inventory_transactions (-1 per serial)
• RBAC: Manager only


 
Tài liệu liên quan
•	PRD - Procurement, Warehouse & Warranty Management System
•	SOP - Quy trình vận hành nội bộ Mua hàng, Kho & Bảo hành
•	PMS PRD - Hệ thống Quản lý Dự án (tích hợp)
•	Data Model - Device Instance, Inventory Transaction, GRN, PO, PR
•	API Specs - RESTful endpoints per module

Mỗi User Story được hoàn thành phải có tất cả Acceptance Criteria pass.

Inventory Core Principles
•	1. Không update tồn trực tiếp - Tồn = SUM(inventory_transaction)
•	2. Serial luôn UNIQUE - Không cho nhập trùng, không cho xóa
•	3. Không cho xóa chứng từ - Chỉ CANCEL hoặc REVERSE
•	4. Phân biệt rõ serial-based và non-serial logic
•	5. Chặn xuất khi GRN chưa COMPLETED
•	6. Lock chứng từ sau khi hoàn tất
