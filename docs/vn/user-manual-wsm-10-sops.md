# Hướng dẫn End-User: Tạo 10 SOP cho Module Quản lý Kho (WSM)

Dựa trên tài liệu quy chuẩn `SOP_WSM.md`, dưới đây là hướng dẫn chi tiết dành cho người dùng cuối (End-user) để thực hiện 10 Quy trình Thao tác Chuẩn (SOP) trên hệ thống WSM (Warehouse Management System).

---

## SOP 01: Tạo Yêu cầu Mua hàng (Purchase Request - PR)
**Người thực hiện:** Project Manager (PM) / Kỹ thuật viên
**Khi nào cần:** Khi bắt đầu dự án mới hoặc khi vật tư/thiết bị tồn kho báo dưới mức an toàn.
**Các bước thực hiện:**
1. Truy cập module **Procurement** > **Purchase Requests**.
2. Nhấn nút **Tạo PR mới**.
3. Chọn hoặc điền **Dự án (Project)** nếu mua hàng đặc thù cho dự án đó.
4. Thêm danh sách thiết bị/vật tư cần mua (Model, Số lượng).
5. Kiểm tra thông tin và nhấn **Submit** để gửi phê duyệt.
*(Lưu ý: Thao tác này mới dừng ở mức yêu cầu, chưa làm tăng số lượng tồn kho của hệ thống).*

---

## SOP 02: Tạo Đơn đặt hàng (Purchase Order - PO)
**Người thực hiện:** Nhân viên Phòng Mua hàng.
**Khi nào cần:** Khi có PR đã được phê duyệt hoặc cần mua gấp từ NCC.
**Các bước thực hiện:**
1. Truy cập module **Procurement** > **Purchase Orders**.
2. Nhấn **Tạo PO mới** (hoặc chọn *Tạo từ PR* đã duyệt).
3. Chọn **Nhà cung cấp (Vendor)**.
4. Cập nhật chi phí, số lượng thiết bị chốt mua và các điều khoản giao hàng.
5. Gửi PO cho Trưởng bộ phận duyệt. Sau khi PO ở trạng thái **APPROVED**, tiến hành gửi cho Nhà Cung Cấp.

---

## SOP 03: Nhập kho Thiết bị (Có Serial - Camera AI, NVR)
**Người thực hiện:** Thủ kho.
**Khi nào cần:** Khi hàng hóa vật lý từ PO giao đến kho.
**Các bước thực hiện:**
1. Truy cập module **Warehouse** > **Inbound (GRN)**.
2. Tạo phiều Khai báo Nhận hàng (GRN) dựa trên PO tương ứng. Trạng thái phiếu là **RECEIVING**.
3. Quan trọng nhất: Cầm máy quét (Scanner) bắn mã **Serial Number** trên từng hộp/thiết bị vào hệ thống.
4. Đối chiếu số lượng Serial đã quét với số lượng trên PO.
5. Nếu đủ và khớp mã, nhấn **Hoàn tất (Complete GRN)**.
*(Lưu ý: Hệ thống chỉ tính tăng Tồn Kho (+1) khi trạng thái hoàn tất, tuyệt đối không bấm Complete nếu phát hiện thiếu Serial).*

---

## SOP 04: Nhập kho Phụ kiện (Không Serial)
**Người thực hiện:** Thủ kho.
**Khi nào cần:** Khi nhận cáp, adapter, chân đế...
**Các bước thực hiện:**
1. Tương tự bước nhập hàng trên, tạo phiếu Khai báo Nhận hàng (GRN) từ PO.
2. Với hàng hóa nằm trong danh mục "Non-serial", hệ thống sẽ chỉ yêu cầu **nhập số lượng tổng** nhận được.
3. Điền đúng số lượng thực tế đếm được.
4. Nhấn **Hoàn tất (Complete GRN)** để hệ thống ghi nhận tăng lượng phụ kiện trong kho.

---

## SOP 05: Giữ hàng cho Dự án (Reservation)
**Người thực hiện:** Project Manager (PM)
**Khi nào cần:** Cần "xí" trước thiết bị trong kho để xuất cho dự án sắp tới, tránh người khác lấy mất.
**Các bước thực hiện:**
1. Truy cập module **Warehouse** > **Inventory**.
2. Tìm kiếm thiết bị đang có trạng thái `IN_STOCK`.
3. Nhấp vào thiết bị và chọn chức năng **Reserve (Giữ hàng)**.
4. Chọn đúng tên Dự án cần giữ. Trạng thái thiết bị sẽ đổi thành `RESERVED`.
*(Thiết bị vẫn nằm trong kho, số lượng tổng không đổi, nhưng PM khác không thể xuất sử dụng thiết bị này).*

---

## SOP 06: Xuất kho Thiết bị có Serial (Camera, NVR)
**Người thực hiện:** Thủ kho
**Khi nào cần:** Xuất hàng đi site dự án, xuất làm POC, hoặc cho mượn.
**Các bước thực hiện:**
1. Truy cập **Warehouse** > **Outbound Orders**.
2. Tạo Lệnh Xuất Kho và chọn loại xuất: Xuất dự án, Xuất nội bộ, ...
3. Hệ thống chỉ cho phép chọn thiết bị đang ở trạng thái `IN_STOCK` hoặc `RESERVED` của dự án tương ứng.
4. Quét mã **Serial** thùng hàng lúc xuất đi.
5. Hoàn tất phiếu xuất. Hệ thống sẽ tự động trừ Tồn kho (-1) và chuyển trạng thái thiết bị sang `DEPLOYED` hoặc `POC`.

---

## SOP 07: Xuất kho Phụ kiện
**Người thực hiện:** Thủ kho.
**Khi nào cần:** Kỹ thuật xin cáp, ốc vít, chân đế đi dự án.
**Các bước thực hiện:**
1. Tạo phiếu **Outbound Orders**.
2. Chọn các phụ kiện cần xuất.
3. Điền **số lượng** kỹ thuật nhận (Không cần quét mã).
4. Hoàn tất xuất kho. Hệ thống sẽ trừ lại lượng phụ kiện tương ứng.

---

## SOP 08: Kỹ thuật tiếp nhận & Lắp đặt (Triển khai)
**Người thực hiện:** Kỹ thuật viên (Implementation Engineer).
**Khi nào cần:** Khi mang thiết bị đến site lắp đặt cho khách.
**Các bước thực hiện:**
1. Đăng nhập hệ thống (hoặc App nội bộ) ngay tại công trường.
2. Truy cập module **Device Lifecycle**.
3. Quét Serial thiết bị vừa lấy ra khỏi thùng để đối chiếu với Lệnh xuất kho.
4. Xác nhận lắp đặt: Nhập khu vực site, ngày lắp, và bấm chuyển trạng thái sang **DEPLOYED**.

---

## SOP 09: Kích hoạt phần mềm AI / License
**Người thực hiện:** Kỹ thuật viên / Kỹ sư AI.
**Khi nào cần:** Sau khi phần cứng đã lên hình, cần nạp firmware hoặc license cấu hình AI.
**Các bước thực hiện:**
1. Trong mục **Device Lifecycle**, chọn thiết bị đang ở trạng thái `DEPLOYED`.
2. Điền thông tin License, phiên bản Firmware vừa cập nhật.
3. Nhấn nút kích hoạt phần mềm. Trạng thái thiết bị lúc này chuyển thành **ACTIVATED**.

---

## SOP 10: Xử lý Bảo hành (Warranty)
**Người thực hiện:** Bộ phận bảo hành / CSKH.
**Khi nào cần:** Thiết bị (Camera/NVR) lỗi do khách hàng/KTV gửi về công ty.
**Các bước thực hiện:**
1. Truy cập module **Warranty Module** > Tạo Ticket Bảo Hành mới.
2. Nhập mã Serial thiết bị bị lỗi. Hệ thống tự cập nhật trạng thái thiết bị thành `MAINTENANCE`.
3. Ghi nhận tình trạng lỗi và tiến hành sửa chữa. Sau đó, chốt kết quả:
   * **Nếu sửa thành công:** Cập nhật ticket hoàn thành, bấm trả về trạng thái `DEPLOYED` (Hoặc về dự án).
   * **Nếu lỗi nặng (Phải đổi thiết bị mới):** Bấm xác nhận hỏng. Serial cũ sẽ chuyển thành trạng thái `RETIRED`. Tiến hành làm *Lệnh xuất kho Mới (SOP 06)* để lấy Serial mới bù vào dự án cho khách.

---
*Lưu ý chung: Không tự ý xóa/sửa số Serial. Nếu Khai báo Inbound (nhập hàng) nhập sai, vui lòng thao tác [CANCEL] trên hệ thống và làm Lại Phiếu Nhập kho mới.*
