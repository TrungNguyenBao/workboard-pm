# Hướng dẫn End-User: 11 SOP cho Module Hành chính Nhân sự (HRM)

Dựa trên tài liệu quy chuẩn `SOP_HRM.md`, dưới đây là hướng dẫn chi tiết dành cho người dùng cuối (End-user) để thực hiện 11 Quy trình Thao tác Chuẩn (SOP) trên hệ thống HRM (Human Resource Management).

---

## SOP 01: Thiết lập Sơ đồ Tổ chức (Org Chart)
**Người thực hiện:** HR Manager
**Khi nào cần:** Khi thành lập phòng ban mới, tái cơ cấu tổ chức, hoặc cập nhật định biên nhân sự.
**Các bước thực hiện:**
1. Truy cập module **HRM** > **Organization** > **Departments**.
2. Nhấn **Tạo Phòng ban mới** hoặc chọn phòng ban cần chỉnh sửa.
3. Điền thông tin: Tên phòng ban, Mã phòng ban, Phòng ban cha (nếu có).
4. Chuyển sang tab **Positions** > nhấn **Thêm vị trí** để định nghĩa các Job Position trong phòng ban.
5. Nhập Headcount (định biên) cho từng vị trí.
6. Gửi đề xuất thay đổi cơ cấu cho **CEO** phê duyệt.
7. Sau khi được duyệt, hệ thống tự động cập nhật Org Chart.

*(Lưu ý: Mọi thay đổi cơ cấu tổ chức BẮT BUỘC phải có phê duyệt từ CEO trước khi có hiệu lực trên hệ thống).*

---

## SOP 02: Cập nhật Hồ sơ Nhân sự
**Người thực hiện:** HR Admin / Nhân viên (Self-service)
**Khi nào cần:** Khi tiếp nhận nhân viên mới, nhân viên thay đổi thông tin cá nhân, hoặc cập nhật giấy tờ định kỳ.
**Các bước thực hiện:**
1. Truy cập module **HRM** > **Employees** > chọn hồ sơ nhân viên cần cập nhật.
2. Nhấn **Chỉnh sửa** để mở form **Employee Information**.
3. Cập nhật các thông tin cần thiết: Họ tên, Ngày sinh, Địa chỉ, Số CCCD, Tài khoản ngân hàng...
4. Chuyển sang tab **Documents** > nhấn **Upload** để đính kèm giấy tờ scan (Hợp đồng, Bằng cấp, CCCD).
5. Nhấn **Lưu** để cập nhật hồ sơ.

*(Lưu ý: Thông tin Lương và Phụ cấp chỉ hiển thị cho HR Admin và HR Manager. Nhân viên tự cập nhật thông tin cá nhân qua chức năng Self-service nhưng KHÔNG thể sửa thông tin lương).*

---

## SOP 03: Tạo Yêu cầu Tuyển dụng (Recruitment Request)
**Người thực hiện:** Line Manager
**Khi nào cần:** Khi phòng ban có nhu cầu tuyển thêm nhân sự mới hoặc thay thế nhân sự nghỉ việc.
**Các bước thực hiện:**
1. Truy cập module **HRM** > **Recruitment** > **Requests**.
2. Nhấn **Tạo Yêu cầu Tuyển dụng mới**.
3. Điền thông tin: Vị trí cần tuyển, Số lượng, Phòng ban, Mức lương đề xuất, Mô tả công việc.
4. Đính kèm **Job Description (JD)** nếu có.
5. Nhấn **Submit** để gửi phê duyệt.
6. Yêu cầu sẽ đi qua luồng: **HR Manager duyệt** → **CEO duyệt** (nếu vượt ngân sách).
7. Theo dõi trạng thái tại mục **My Requests**.

*(Lưu ý: Chỉ tạo yêu cầu khi vị trí đó đã có trong Org Chart và còn slot định biên. Nếu chưa có, phải tạo Position trước qua SOP 01).*

---

## SOP 04: Vận hành Pipeline Ứng viên & Phỏng vấn
**Người thực hiện:** HR Admin
**Khi nào cần:** Khi yêu cầu tuyển dụng đã được phê duyệt và cần bắt đầu tìm kiếm ứng viên.
**Các bước thực hiện:**
1. Truy cập module **HRM** > **Recruitment** > **Pipeline**.
2. Chọn vị trí tuyển dụng đã được duyệt.
3. Nhấn **Thêm Ứng viên** > nhập thông tin hoặc upload CV hàng loạt.
4. Kéo-thả ứng viên qua các giai đoạn Pipeline: `Screening` → `Interview` → `Assessment` → `Offer`.
5. Tại giai đoạn **Interview**: nhấn **Lịch phỏng vấn** > chọn ngày giờ, phòng, panel phỏng vấn.
6. Sau phỏng vấn, điền **Interview Evaluation Form** cho từng ứng viên.
7. Ứng viên đạt yêu cầu → kéo sang giai đoạn **Offer**.

*(Lưu ý: Mỗi lần chuyển giai đoạn Pipeline, hệ thống tự động gửi email thông báo cho ứng viên và các bên liên quan).*

---

## SOP 05: Gửi Offer & Tiếp nhận Nhân sự mới (Onboarding)
**Người thực hiện:** HR Admin
**Khi nào cần:** Khi ứng viên vượt qua vòng phỏng vấn và được chọn nhận việc.
**Các bước thực hiện:**

**Phần A – Gửi Offer:**
1. Tại Pipeline, chọn ứng viên ở giai đoạn **Offer**.
2. Nhấn **Tạo Offer Proposal** > điền: Mức lương, Ngày bắt đầu, Loại hợp đồng, Phúc lợi.
3. Gửi Offer cho **HR Manager** phê duyệt.
4. Sau khi duyệt, nhấn **Gửi thư mời** — hệ thống tự gửi email Offer Letter cho ứng viên.

**Phần B – Onboarding:**
1. Khi ứng viên xác nhận nhận việc, nhấn **Bắt đầu Onboarding**.
2. Hệ thống tự động tạo mã nhân viên và tài khoản đăng nhập hệ thống.
3. Mở **Onboarding Checklist** và hoàn thành từng mục:
   - Bàn giao chỗ ngồi, thiết bị (liên kết SOP Tài sản)
   - Đào tạo nội quy công ty
   - Ký hợp đồng thử việc/chính thức
   - Đăng ký BHXH, thuế TNCN
4. Đánh dấu hoàn thành từng mục trên Checklist.
5. Khi tất cả mục hoàn tất, nhấn **Hoàn tất Onboarding** → hồ sơ nhân viên chuyển sang trạng thái `Active`.

*(Lưu ý: Quá trình Onboarding phải hoàn tất trong vòng 7 ngày làm việc kể từ ngày nhân viên bắt đầu).*

---

## SOP 06: Chấm công & Gửi Yêu cầu Nghỉ phép / Tăng ca
**Người thực hiện:** Nhân viên / Line Manager (phê duyệt)
**Khi nào cần:** Hàng ngày (chấm công) hoặc khi có phát sinh nghỉ phép, tăng ca.
**Các bước thực hiện:**

**Phần A – Chấm công hàng ngày:**
1. Nhân viên check-in/check-out qua máy chấm công hoặc App di động.
2. Hệ thống tự động ghi nhận giờ vào/ra.
3. Nếu quên chấm công: Truy cập **HRM** > **Attendance** > **Đề nghị bổ sung công** > điền lý do và gửi phê duyệt.

**Phần B – Yêu cầu Nghỉ phép:**
1. Truy cập **HRM** > **Leave** > nhấn **Tạo đơn nghỉ phép**.
2. Chọn loại phép: Phép năm, Phép không lương, Nghỉ ốm, Nghỉ thai sản...
3. Chọn ngày bắt đầu, ngày kết thúc (hệ thống tự tính số ngày phép).
4. Nhập lý do và nhấn **Submit**.
5. Đơn gửi đến **Line Manager** phê duyệt trực tuyến.

**Phần C – Yêu cầu Tăng ca:**
1. Truy cập **HRM** > **Overtime** > nhấn **Tạo đơn tăng ca**.
2. Chọn ngày, số giờ tăng ca dự kiến, lý do.
3. Nhấn **Submit** → Line Manager phê duyệt.

*(Lưu ý: Mọi yêu cầu phê duyệt phải được xử lý trong vòng 24 giờ theo SLA. HR chốt bảng công vào ngày cuối cùng của tháng).*

---

## SOP 07: Tính Lương & Gửi Phiếu lương
**Người thực hiện:** HR Admin / HR Manager / Kế toán
**Khi nào cần:** Cuối tháng, sau khi chốt bảng công.
**Các bước thực hiện:**
1. Truy cập **HRM** > **Payroll** > **Monthly Payroll**.
2. Nhấn **Tạo bảng lương tháng** > chọn tháng/năm.
3. Hệ thống tự động tổng hợp:
   - Ngày công thực tế (từ bảng chấm công)
   - Mức lương cơ bản + Phụ cấp
   - Giờ tăng ca (x 150% / 200% / 300%)
   - Giảm trừ: BHXH, BHYT, BHTN, Thuế TNCN
4. HR Admin kiểm tra từng dòng lương, nhấn **Xuất phiếu lương nháp**.
5. Gửi bảng lương cho **HR Manager** và **Kế toán** phê duyệt.
6. Sau khi duyệt, nhấn **Phát hành Phiếu lương** → hệ thống tự gửi Payslip cho từng nhân viên qua email/app.

*(Lưu ý: Sai sót tính lương phải dưới 1%. Nếu phát hiện sai, HR Admin chỉnh sửa và gửi duyệt lại trước khi phát hành).*

---

## SOP 08: Thiết lập KPI/OKR & Đánh giá Hiệu suất
**Người thực hiện:** Line Manager / Nhân viên
**Khi nào cần:** Đầu kỳ (thiết lập mục tiêu), giữa kỳ (review), cuối kỳ (đánh giá tổng kết).
**Các bước thực hiện:**

**Phần A – Thiết lập mục tiêu (Đầu kỳ):**
1. Line Manager truy cập **HRM** > **Performance** > **KPI Setup**.
2. Nhấn **Tạo KPI mới** cho từng nhân viên hoặc theo phòng ban.
3. Điền: Tên mục tiêu, Chỉ số đo lường, Trọng số (%), Mức kỳ vọng.
4. Gửi cho nhân viên xác nhận và cam kết.

**Phần B – Theo dõi & Phản hồi (Giữa kỳ):**
1. Nhân viên cập nhật tiến độ KPI tại **My Performance**.
2. Line Manager review và ghi nhận feedback (360 feedback).

**Phần C – Đánh giá tổng kết (Cuối kỳ):**
1. Line Manager truy cập **Performance** > **Reviews** > chọn nhân viên.
2. Điền **Performance Review Form**: Điểm số từng KPI, Nhận xét tổng quan.
3. Nhấn **Submit** để gửi kết quả.
4. Kết quả đánh giá liên kết trực tiếp với quyết định tăng lương, thưởng, thăng chức.

*(Lưu ý: Kết quả đánh giá KPI là căn cứ chính cho việc xét duyệt Career Path và các chương trình đào tạo).*

---

## SOP 09: Đào tạo & Phát triển Nhân sự
**Người thực hiện:** HR Admin / HR Manager
**Khi nào cần:** Khi có kế hoạch đào tạo, nhân viên mới cần onboarding training, hoặc nâng cao năng lực.
**Các bước thực hiện:**
1. Truy cập **HRM** > **Training** > nhấn **Tạo chương trình đào tạo mới**.
2. Điền: Tên khóa học, Mục tiêu, Thời gian, Giảng viên, Ngân sách.
3. Thêm danh sách học viên tham gia (chọn nhân viên hoặc theo phòng ban).
4. Gửi kế hoạch cho **HR Manager** phê duyệt ngân sách.
5. Sau khi duyệt, nhấn **Triển khai** → hệ thống gửi thông báo cho học viên.
6. Sau khóa học, nhập kết quả đánh giá tại **Training Results**.
7. Kết quả đào tạo tự động cập nhật vào **Career Path** của nhân viên.

*(Lưu ý: Kết quả đào tạo kết hợp với đánh giá KPI sẽ là căn cứ để hệ thống đề xuất Lộ trình thăng tiến cho nhân viên).*

---

## SOP 10: Quản lý Tài sản & Mua sắm Nội bộ
**Người thực hiện:** HR Admin / Hành chính / Nhân viên
**Khi nào cần:** Khi bàn giao thiết bị cho nhân viên, cần mua sắm nội bộ, hoặc kiểm kê định kỳ.
**Các bước thực hiện:**

**Phần A – Bàn giao Tài sản:**
1. Truy cập **HRM** > **Assets** > nhấn **Cấp phát tài sản**.
2. Chọn nhân viên nhận, chọn tài sản từ kho (Laptop, Điện thoại, Thẻ ra vào...).
3. Điền **Asset Allocation Form**: Ngày bàn giao, Tình trạng tài sản.
4. Nhân viên xác nhận nhận tài sản trên hệ thống.

**Phần B – Mua sắm Nội bộ:**
1. Nhân viên/Bộ phận truy cập **HRM** > **Procurement** > nhấn **Tạo đề xuất mua sắm**.
2. Điền: Tên hàng hóa, Số lượng, Lý do mua, Ngân sách dự kiến.
3. Nhấn **Submit** → Đề xuất đi theo luồng phê duyệt: **Line Manager** → **HR Admin** → **CEO** (nếu vượt ngưỡng).
4. Sau khi duyệt, HR Admin cập nhật trạng thái thanh toán và lưu chứng từ.

**Phần C – Kiểm kê Tài sản:**
1. HR Admin tạo **Phiếu kiểm kê** định kỳ.
2. Đối chiếu tài sản thực tế với danh mục trên hệ thống.
3. Cập nhật tình trạng: Đang sử dụng, Hỏng, Mất, Thanh lý.

*(Lưu ý: Mỗi tài sản có mã riêng và lịch sử bàn giao đầy đủ. Lịch bảo trì được hệ thống nhắc tự động).*

---

## SOP 11: Thôi việc (Offboarding)
**Người thực hiện:** Nhân viên / HR Admin / Line Manager
**Khi nào cần:** Khi nhân viên nộp đơn xin nghỉ việc hoặc công ty chấm dứt hợp đồng.
**Các bước thực hiện:**
1. Nhân viên truy cập **HRM** > **Offboarding** > nhấn **Nộp đơn nghỉ việc**.
2. Điền **Resignation Form**: Lý do, Ngày nghỉ đề xuất.
3. Nhấn **Submit** → Đơn gửi đến **Line Manager** và **HR Manager** phê duyệt.
4. Sau khi duyệt, hệ thống xác định **Ngày làm việc cuối cùng** (Last Working Day).
5. HR Admin mở **Offboarding Checklist** và phối hợp thực hiện:
   - **Handover Form**: Nhân viên bàn giao công việc, tài liệu cho người kế nhiệm.
   - **Thu hồi Tài sản**: Laptop, Thẻ ra vào, Điện thoại công ty (liên kết SOP Tài sản).
   - **Thu hồi Tài khoản**: Vô hiệu hóa email, VPN, các quyền truy cập hệ thống.
6. HR Admin tạo **Exit Interview Form** > mời nhân viên khảo sát lý do nghỉ việc.
7. HR Admin **chốt lương cuối cùng**: tính ngày công, phép còn dư, thưởng (nếu có).
8. Nhấn **Hoàn tất Offboarding** → hồ sơ nhân viên chuyển sang trạng thái `Inactive`.

*(Lưu ý: Toàn bộ quy trình Offboarding phải hoàn tất trước Ngày làm việc cuối cùng. Dữ liệu Exit Interview được lưu trữ để phân tích tỷ lệ nghỉ việc).*

---

## Tổng hợp nhanh theo Vai trò

| Vai trò | Các SOP thường sử dụng |
|---------|----------------------|
| **Nhân viên** | SOP 02 (Hồ sơ), SOP 06 (Chấm công/Nghỉ phép), SOP 08 (KPI), SOP 11 (Thôi việc) |
| **Line Manager** | SOP 03 (Tuyển dụng), SOP 06 (Duyệt phép), SOP 08 (Đánh giá KPI) |
| **HR Admin** | Tất cả SOP (01–11) |
| **HR Manager** | SOP 01 (Org Chart), SOP 04–05 (Pipeline/Offer), SOP 07 (Lương), SOP 09 (Đào tạo) |
| **CEO** | SOP 01 (Duyệt cơ cấu), SOP 03 (Duyệt tuyển dụng), SOP 10 (Duyệt mua sắm lớn) |

---

## Nguyên tắc Vàng khi sử dụng hệ thống

1. **Dữ liệu trên hệ thống = Dữ liệu chính thức.** Không chấp nhận thông tin ngoài hệ thống.
2. **Phê duyệt Online = Phê duyệt duy nhất.** Không chấp nhận duyệt miệng hoặc duyệt giấy.
3. **SLA 24 giờ:** Mọi yêu cầu phê duyệt phải xử lý trong 24 giờ làm việc.
4. **Bảo mật RBAC:** Chỉ xem được thông tin trong phạm vi quyền hạn của mình.

---
**Kết thúc Hướng dẫn SOP HRM**
