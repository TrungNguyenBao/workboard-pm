# SOP – Quy trình vận hành tiêu chuẩn Quản lý Dự án (PMS)

## Hệ thống Quản lý Nội bộ

---

# 1. Mục đích SOP

* Chuẩn hóa 100% các quy trình nghiệp vụ quản lý dự án trong doanh nghiệp.
* Đảm bảo tính minh bạch, nhất quán và có thể theo dõi được trong toàn bộ vòng đời dự án.
* Số hóa toàn bộ kế hoạch, task, sprint và mục tiêu trên hệ thống PMS.
* Làm căn cứ để đào tạo thành viên nhóm và kiểm soát chất lượng quản trị dự án.

---

# 2. Phạm vi áp dụng

Áp dụng cho toàn bộ nhóm dự án, quản lý và ban điều hành trong việc thực hiện các nghiệp vụ liên quan đến:
* Khởi tạo và cấu hình dự án.
* Quản lý task và quy trình Kanban Board.
* Lập kế hoạch và thực thi Sprint (Agile).
* Thiết lập và theo dõi mục tiêu (Goals).
* Cộng tác nhóm, bình luận và quản lý tài liệu đính kèm.

---

# 3. Vai trò & Trách nhiệm

## 3.1 Workspace Admin (Quản trị hệ thống)
* Toàn quyền truy cập và quản lý cấu hình workspace.
* Phân quyền thành viên, quản lý billing và thiết lập chính sách hệ thống.
* Giám sát tổng quan toàn bộ dự án trong workspace.

## 3.2 Project Owner (Chủ dự án)
* Tạo mới, chỉnh sửa và lưu trữ (archive) dự án.
* Quản lý thành viên dự án và phân quyền vai trò.
* Thiết lập milestone, mục tiêu và cấu trúc sprint.
* Cấu hình trường tùy chỉnh (custom fields) và trạng thái section.

## 3.3 Editor (Biên tập viên)
* Tạo, chỉnh sửa và xóa task trong dự án.
* Quản lý sprint: tạo sprint, di chuyển task vào/ra backlog.
* Cập nhật trạng thái task và kéo thả trên Kanban Board.
* Phân công task cho các thành viên trong nhóm.

## 3.4 Commenter (Người bình luận)
* Bình luận và thảo luận trên task.
* Theo dõi (follow) task để nhận thông báo cập nhật.
* Xem toàn bộ dữ liệu dự án, bao gồm board, list và timeline.

## 3.5 Viewer (Người xem)
* Quyền đọc (read-only) toàn bộ dữ liệu dự án.
* Không thể tạo, chỉnh sửa hay bình luận trên bất kỳ task nào.
* Thích hợp cho stakeholder bên ngoài cần theo dõi tiến độ.

---

# 4. SOP Khởi tạo & Cấu hình Dự án (Project Setup)

## 4.1 Tạo dự án mới
* **Bước 1:** Project Owner tạo dự án mới từ màn hình Workspace Dashboard.
* **Bước 2:** Đặt tên, mô tả và chọn loại hiển thị (kanban / list / board).
* **Bước 3:** Mời thành viên vào dự án và gán vai trò tương ứng (Editor, Commenter, Viewer).
* **Bước 4:** Cấu hình các Section (cột trạng thái) phù hợp với quy trình của nhóm (VD: Backlog, In Progress, Review, Done).
* **Bước 5:** Thiết lập mức độ hiển thị (visibility): nội bộ (private) hoặc toàn workspace (public).
* **Quy tắc:** Mọi dự án phải có ít nhất một Project Owner được chỉ định trước khi bắt đầu làm việc.

## 4.2 Cấu hình trường tùy chỉnh (Custom Fields)
* **Bước 1:** Project Owner truy cập phần cài đặt dự án và chọn `Custom Fields`.
* **Bước 2:** Định nghĩa các trường cần thiết cho dự án (VD: Story Points, Priority, Customer, Budget).
* **Bước 3:** Chọn kiểu dữ liệu cho từng trường: `text` / `number` / `date` / `select` / `multi-select`.
* **Bước 4:** Lưu cấu hình — các trường tùy chỉnh sẽ tự động áp dụng cho tất cả task trong dự án.
* **Lưu ý:** Chỉ Project Owner mới có quyền tạo, sửa hoặc xóa custom fields.

---

# 5. SOP Quản lý Task & Kanban (Task Management)

## 5.1 Tạo và phân công task
* **Bước 1:** Editor tạo task mới từ Kanban Board hoặc List View bằng nút `+ Add Task`.
* **Bước 2:** Nhập tiêu đề rõ ràng, mô tả chi tiết nội dung công việc cần thực hiện.
* **Bước 3:** Thiết lập mức độ ưu tiên (Priority): `Urgent` / `High` / `Medium` / `Low`.
* **Bước 4:** Đặt ngày đến hạn (Due Date) và gán task cho thành viên phụ trách.
* **Bước 5:** Thêm tag và nhãn phân loại để dễ tìm kiếm và lọc về sau.
* **Bước 6:** Tạo subtask nếu công việc cần chia nhỏ thành các bước thực hiện cụ thể.
* **Quy tắc:** Mỗi task phải có người được gán (assignee) và ngày đến hạn trước khi chuyển vào trạng thái In Progress.

## 5.2 Quy trình Kanban Board
* **Bước 1:** Thành viên vào màn hình Kanban Board để xem tổng quan công việc theo section.
* **Bước 2:** Kéo thả (drag & drop) task giữa các section để cập nhật trạng thái theo tiến độ thực tế.
* **Bước 3:** Tuân thủ giới hạn WIP (Work In Progress) — không để quá nhiều task đồng thời ở trạng thái In Progress.
* **Bước 4:** Cập nhật các trường thông tin liên quan (comment, checklist) khi task có thay đổi.
* **Bước 5:** Đánh dấu hoàn thành (Mark Complete) khi task đã được review và chấp nhận.
* **Quy tắc:** Không được tự ý xóa task — hãy chuyển về Backlog hoặc thảo luận với Project Owner nếu cần hủy bỏ.

---

# 6. SOP Agile / Sprint (Sprint Management)

## 6.1 Lập kế hoạch Sprint
* **Bước 1:** Project Owner tạo sprint mới từ màn hình Sprint hoặc Backlog.
* **Bước 2:** Đặt tên sprint, xác định mục tiêu (Sprint Goal) rõ ràng và ngắn gọn.
* **Bước 3:** Từ Backlog, di chuyển các task được ưu tiên vào sprint theo thứ tự quan trọng.
* **Bước 4:** Thành viên nhóm ước tính Story Points cho từng task trước khi sprint bắt đầu.
* **Bước 5:** Project Owner xác nhận danh sách task và bấm `Start Sprint` để chính thức bắt đầu.
* **Quy tắc:** Không thêm task mới vào sprint đang chạy mà không có sự đồng ý của Project Owner.

## 6.2 Thực thi và Hoàn thành Sprint
* **Bước 1:** Thành viên nhóm làm việc theo task đã cam kết trong sprint, cập nhật trạng thái hàng ngày.
* **Bước 2:** Tổ chức Daily Standup ngắn (15 phút): cập nhật tiến độ, blockers và kế hoạch trong ngày.
* **Bước 3:** Project Owner theo dõi Burndown Chart để phát hiện sớm các rủi ro trễ deadline.
* **Bước 4:** Khi đến ngày kết thúc, Project Owner bấm `Complete Sprint` — các task chưa hoàn thành sẽ được chuyển về Backlog.
* **Bước 5:** Tổ chức Sprint Review và Retrospective, ghi nhận velocity thực tế để lập kế hoạch cho sprint tiếp theo.
* **Quy tắc:** Sprint completion rate (tỉ lệ task hoàn thành trong sprint) phải đạt tối thiểu 80%.

---

# 7. SOP Mục tiêu & Theo dõi (Goals & Tracking)

## 7.1 Thiết lập mục tiêu
* **Bước 1:** Project Owner tạo mục tiêu (Goal) mới từ màn hình Goals.
* **Bước 2:** Liên kết mục tiêu với các dự án hoặc task cụ thể để tự động cập nhật tiến độ.
* **Bước 3:** Đặt ngày đến hạn (Due Date) cho mục tiêu.
* **Bước 4:** Chọn phương pháp tính tiến độ: `manual` (cập nhật thủ công) hoặc `auto` (tự động từ task liên kết).
* **Quy tắc:** Mỗi mục tiêu cần có ít nhất một Key Result hoặc task liên kết để có thể đo lường được.

## 7.2 Theo dõi tiến độ
* **Bước 1:** Thành viên và Owner theo dõi các thanh tiến độ (progress bar) trên màn hình Goals.
* **Bước 2:** Cập nhật trạng thái sức khỏe mục tiêu: `On Track` / `At Risk` / `Off Track` theo tình hình thực tế.
* **Bước 3:** Khi mục tiêu đạt 100%, Project Owner đánh dấu `Achieved` để ghi nhận kết quả.
* **Lưu ý:** Mục tiêu bị `Off Track` quá 2 tuần phải được đưa vào agenda họp review để xử lý.

---

# 8. SOP Cộng tác & Tài liệu (Collaboration)

## 8.1 Bình luận và Thảo luận
* **Bước 1:** Thành viên mở task cần thảo luận và chuyển đến tab `Comments`.
* **Bước 2:** Viết bình luận bằng rich-text editor — có thể định dạng văn bản, chèn code block hoặc checklist.
* **Bước 3:** Dùng `@mention` để gắn thẻ thành viên liên quan — họ sẽ nhận thông báo qua hệ thống.
* **Bước 4:** Nhấn `Follow` trên task quan trọng để nhận thông báo khi có bất kỳ cập nhật nào.
* **Quy tắc:** Mọi quyết định về task phải được ghi lại trong phần comment, không được trao đổi chỉ qua chat/email bên ngoài.

## 8.2 Đính kèm tài liệu
* **Bước 1:** Mở task và kéo thả (drag & drop) hoặc nhấn `Upload` để đính kèm file tài liệu liên quan.
* **Bước 2:** Thành viên có quyền truy cập task có thể download hoặc xem preview file trực tiếp trên hệ thống.
* **Bước 3:** Định kỳ rà soát và xóa các file đính kèm cũ, không còn liên quan để tiết kiệm dung lượng lưu trữ.
* **Lưu ý:** Không đính kèm file chứa thông tin nhạy cảm (mật khẩu, dữ liệu khách hàng) vào task không có giới hạn quyền truy cập.

---

# 9. Nguyên tắc cốt lõi

1. **Sự thật duy nhất (Single Source of Truth):** Mọi dữ liệu dự án — task, tiến độ, quyết định — phải tồn tại trên hệ thống PMS, không phân tán qua email hay chat.
2. **Kanban discipline (Kỷ luật Kanban):** Tuân thủ giới hạn WIP, duy trì luồng công việc liên tục và không để task tồn đọng quá lâu ở một trạng thái.
3. **Sprint commitment (Cam kết Sprint):** Công việc đã cam kết trong sprint phải được hoàn thành trong sprint đó; chỉ thêm task mới khi có sự đồng ý rõ ràng của Owner.
4. **Continuous improvement (Cải tiến liên tục):** Đánh giá velocity sau mỗi sprint, tổ chức retrospective đều đặn để cải thiện quy trình làm việc của nhóm.

---

# 10. KPI Vận hành

* 100% task công việc được tạo và theo dõi trên hệ thống PMS.
* Sprint completion rate (tỉ lệ hoàn thành sprint) đạt trên 80%.
* Thời gian chu kỳ trung bình của task (Average Cycle Time) dưới 5 ngày làm việc.
* Tỉ lệ đạt mục tiêu (Goal Achievement Rate) trên 70% mỗi quý.

---
**Kết thúc SOP PMS**
