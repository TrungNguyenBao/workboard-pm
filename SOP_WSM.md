# PRD – Procurement, Warehouse & Warranty Management System

## Dành cho Công ty Camera AI (ERP Module)

---

# 1. Tổng quan

## 1.1 Bối cảnh

Công ty nhập thiết bị (Camera AI, NVR, phụ kiện), tích hợp model AI và triển khai cho doanh nghiệp theo dự án B2B.

Đặc thù:

* Quản lý thiết bị theo Serial Number (bắt buộc)
* Có phụ kiện không quản lý serial
* Xuất kho theo dự án, POC, nội bộ, mượn đối tác
* Có bảo hành, bảo trì
* Tích hợp với PMS
* Là module trong ERP

---

# 2. Mục tiêu hệ thống

* Kiểm soát 100% thiết bị theo serial
* Không phát sinh tồn kho ảo
* Theo dõi vòng đời thiết bị từ nhập đến bảo hành
* Phân biệt rõ hàng serial và không serial
* Chuẩn hóa quy trình kiểm soát nội bộ

---

# 3. Phạm vi

## In Scope

* Procurement (PR, PO)
* Nhập kho (GRN + Serial)
* Xuất kho (đa loại outbound)
* Reservation theo dự án
* Device Lifecycle
* Warranty & Return
* Quản lý phụ kiện (non-serial)
* Báo cáo tồn kho & theo dự án

## Out of Scope (Phase sau)

* AI Forecast
* Computer Vision trong kho
* Digital Twin

---

# 4. Phân loại hàng hóa

## 4.1 Serial-based (Thiết bị chính)

* Camera AI
* NVR / Server AI

Quản lý theo từng serial riêng biệt.

## 4.2 Non-serial (Phụ kiện)

* Dây cáp
* Adapter
* Chân đế
* Phụ kiện tiêu hao

Quản lý theo số lượng.

---

# 5. Quy trình Mua hàng (Procurement)

## 5.1 Purchase Request (PR)

Tạo khi:

* Dự án cần thiết bị
* Tồn kho dưới mức an toàn

Trạng thái:
DRAFT → SUBMITTED → APPROVED → REJECTED

Không ảnh hưởng tồn kho.

## 5.2 Purchase Order (PO)

Tạo từ PR hoặc trực tiếp.

Trạng thái:
DRAFT → APPROVED → SENT → PARTIALLY_RECEIVED → CLOSED

Không làm thay đổi tồn kho.

---

# 6. Quy trình Nhập kho (Inbound)

## 6.1 Trạng thái GRN

DRAFT → RECEIVING → COMPLETED → CANCELLED

Chỉ khi COMPLETED mới sinh tồn kho.

---

## 6.2 Nhập hàng Serial-based

Flow:
PO → GRN (RECEIVING) → Scan Serial → Đủ serial → COMPLETED → Inventory Transaction +1

Nguyên tắc:

* Không cho COMPLETE nếu số serial < expected quantity
* Không sinh tồn khi GRN chưa COMPLETED
* Không cho outbound nếu còn GRN RECEIVING

---

## 6.3 Nhập hàng Non-serial

Flow:
PO → GRN → Nhập số lượng → COMPLETED → Inventory Transaction (+quantity)

Không tạo device_instance.

---

# 7. Quy trình Xuất kho (Outbound)

## 7.1 Các loại xuất

* PROJECT_OUT
* POC_OUT
* INTERNAL_USE
* PARTNER_LOAN_OUT
* MAINTENANCE_OUT

---

## 7.2 Xuất Serial-based

Flow:
Reservation (optional) → Outbound Order → Scan Serial → Inventory Transaction -1 → Update Device Status

Rule:

* Chỉ cho xuất khi device.status = IN_STOCK hoặc RESERVED
* Không cho xuất nếu GRN chưa hoàn tất

---

## 7.3 Xuất Non-serial

Outbound Order → Trừ quantity

Cho phép xuất theo số lượng.

---

# 8. Reservation theo dự án

IN_STOCK → RESERVED

* Không làm giảm tồn
* Ngăn không cho dự án khác sử dụng

---

# 9. Device Lifecycle

## 9.1 Trạng thái thiết bị

IN_STOCK
RESERVED
DEPLOYED
ACTIVATED
MAINTENANCE
POC
INTERNAL_USE
BORROWED
RETIRED

## 9.2 Nguyên tắc

* Mọi thay đổi trạng thái phải lưu vào device_status_history
* Không xóa serial

---

# 10. Bảo hành & Bảo trì

## 10.1 Warranty Flow

DEPLOYED / ACTIVATED → Warranty Ticket → MAINTENANCE →

Kết quả:

* Sửa xong → DEPLOYED
* Đổi thiết bị → RETIRED (serial cũ) + serial mới gán project

## 10.2 Warranty Rule

* Ghi nhận ngày bắt đầu bảo hành
* Lưu lịch sử lỗi
* Không nhập lại tồn bán mới nếu là hàng bảo hành

---

# 11. Inventory Core Principles

1. Không update tồn trực tiếp
2. Tồn = SUM(inventory_transaction)
3. Serial luôn UNIQUE
4. Không cho xóa chứng từ – chỉ CANCEL hoặc REVERSE
5. Phân biệt rõ serial và non-serial logic

---

# 12. Báo cáo

## 12.1 Tồn kho

* Theo kho
* Theo SKU
* Theo serial
* Theo loại (project / POC / internal)

## 12.2 Theo dự án

* Danh sách serial theo project
* Trạng thái triển khai

## 12.3 Bảo hành

* Thiết bị đang bảo hành
* Tỷ lệ lỗi theo model

---

# 13. Kiểm soát nội bộ

* Chặn xuất khi GRN chưa COMPLETED
* Không cho COMPLETE nếu thiếu serial
* Audit log mọi thao tác
* Lock chứng từ sau khi hoàn tất
* Phân quyền theo role

---

# 14. Kiến trúc đề xuất

Module tách biệt:

* Procurement Module
* Warehouse Module
* Device Lifecycle Module
* Warranty Module

Thiết kế event-based inventory.

---

# 15. KPI hệ thống

* Sai lệch tồn < 1%
* Serial tracking = 100%
* Không tồn âm
* Truy xuất serial < 1s

---

# 16. Tư duy cốt lõi

* Thiết bị = tài sản theo vòng đời
* Phụ kiện = vật tư theo số lượng
* Transaction là nguồn sự thật duy nhất của tồn kho

---

# SOP – Vận hành nội bộ Mua hàng, Kho & Bảo hành

## Công ty Camera AI

---

# 1. Mục đích SOP

* Chuẩn hóa cách làm việc giữa các bộ phận: Mua hàng – Kho – Kỹ thuật – PM – Bảo hành
* Đảm bảo kiểm soát 100% thiết bị theo serial
* Tránh thất thoát, nhầm lẫn, tồn kho ảo
* Làm căn cứ đào tạo nhân sự mới và audit nội bộ

---

# 2. Phạm vi áp dụng

Áp dụng cho:

* Thiết bị quản lý theo Serial (Camera AI, NVR, Server AI)
* Phụ kiện không serial (dây, adapter, phụ kiện tiêu hao)
* Tất cả kho của công ty

---

# 3. Vai trò & trách nhiệm

## 3.1 Phòng Mua hàng

* Tạo PR, PO đúng nhu cầu
* Gắn PO với Project (nếu có)
* Theo dõi tiến độ giao hàng

## 3.2 Thủ kho

* Nhận hàng, kiểm tra, scan serial
* Không hoàn tất GRN khi chưa đủ serial
* Không cho xuất kho sai quy trình

## 3.3 Project Manager (PM)

* Tạo yêu cầu mua theo dự án
* Thực hiện reservation thiết bị
* Theo dõi thiết bị theo project

## 3.4 Kỹ thuật triển khai

* Nhận thiết bị đúng serial
* Cập nhật trạng thái lắp đặt & kích hoạt AI

## 3.5 Bộ phận Bảo hành

* Tiếp nhận thiết bị lỗi
* Tạo ticket bảo hành
* Cập nhật kết quả xử lý

---

# 4. SOP Mua hàng (Procurement)

## 4.1 Tạo Purchase Request (PR)

* PM / Kỹ thuật tạo PR khi:

  * Có dự án mới
  * Tồn kho dưới mức an toàn

PR phải có:

* Model thiết bị
* Số lượng
* Project (nếu có)

PR KHÔNG làm thay đổi tồn kho.

---

## 4.2 Tạo Purchase Order (PO)

* Phòng mua hàng tạo PO từ PR
* PO phải được duyệt trước khi gửi NCC

PO KHÔNG làm tăng tồn kho.

---

# 5. SOP Nhập kho (Inbound)

## 5.1 Nguyên tắc chung

* Nhập kho serial-based: bắt buộc scan serial
* Không sinh tồn kho khi GRN chưa COMPLETED
* Không cho xuất kho khi còn GRN ở trạng thái RECEIVING

---

## 5.2 Quy trình nhập thiết bị có Serial

Bước 1: Nhận hàng vật lý từ NCC
Bước 2: Tạo GRN, trạng thái RECEIVING
Bước 3: Scan từng serial vào hệ thống
Bước 4: Đối chiếu đủ số lượng
Bước 5: Chuyển GRN sang COMPLETED
Bước 6: Hệ thống tự sinh tồn kho (+1 / serial)

LƯU Ý:

* Không cho COMPLETE nếu thiếu serial
* Không sửa/xóa serial sau khi COMPLETE

---

## 5.3 Quy trình nhập phụ kiện (không serial)

Bước 1: Nhận hàng
Bước 2: Tạo GRN
Bước 3: Nhập số lượng
Bước 4: COMPLETE GRN

Phụ kiện chỉ quản lý theo số lượng.

---

# 6. SOP Reservation theo dự án

* PM thực hiện giữ thiết bị cho dự án
* Trạng thái thiết bị: IN_STOCK → RESERVED

Reservation:

* Không làm giảm tồn
* Ngăn xuất nhầm sang dự án khác

---

# 7. SOP Xuất kho (Outbound)

## 7.1 Các loại xuất

* Xuất theo dự án
* Xuất POC
* Xuất dùng nội bộ
* Xuất mượn đối tác
* Xuất đi bảo trì

---

## 7.2 Xuất thiết bị có Serial

Bước 1: Tạo Outbound Order
Bước 2: Scan serial khi xuất
Bước 3: Hệ thống trừ tồn (-1 / serial)
Bước 4: Cập nhật trạng thái thiết bị (DEPLOYED / POC / INTERNAL)

QUY TẮC:

* Chỉ xuất khi device = IN_STOCK hoặc RESERVED
* Không cho xuất khi GRN chưa hoàn tất

---

## 7.3 Xuất phụ kiện

* Xuất theo số lượng
* Không cần serial

---

# 8. SOP Triển khai & Device Lifecycle

## 8.1 Lắp đặt

* Kỹ thuật cập nhật:

  * Site
  * Ngày lắp
  * Trạng thái = DEPLOYED

## 8.2 Kích hoạt AI

* Cập nhật:

  * Firmware
  * License AI
  * Trạng thái = ACTIVATED

---

# 9. SOP Bảo hành & Bảo trì

## 9.1 Tiếp nhận bảo hành

* Tạo ticket bảo hành theo serial
* Cập nhật trạng thái thiết bị = MAINTENANCE

## 9.2 Xử lý

* Sửa xong → trả lại dự án
* Không sửa được → đổi thiết bị

QUY TẮC:

* Serial cũ chuyển RETIRED
* Serial mới gán lại project

---

# 10. Kiểm soát & Audit

* Mọi thao tác phải có audit log
* Không xóa chứng từ, chỉ CANCEL
* Lock GRN sau khi COMPLETED
* Cảnh báo GRN RECEIVING quá 48h

---

# 11. KPI vận hành

* Sai lệch tồn kho < 1%
* 100% thiết bị có serial hợp lệ
* Không tồn kho âm
* Không xuất sai project

---

# 12. Nguyên tắc vàng

* Serial là danh tính duy nhất của thiết bị
* Tồn kho chỉ sinh từ transaction
* Chứng từ ≠ tồn kho
* Thiết bị ≠ phụ kiện

---

**End of SOP**
