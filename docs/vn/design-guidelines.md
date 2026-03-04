# Hướng dẫn Thiết kế WorkBoard

**Phiên bản 1.0 | 2026-02-25**
Dựa trên nghiên cứu thiết kế: `plans/reports/researcher-design-ui-ux-pm-app.md`

---

## 1. Hệ thống Màu sắc

Tất cả các màu được chỉ định dưới dạng giá trị hệ thập lục phân (hex) chính xác. Các thuộc tính CSS tùy chỉnh sử dụng HSL để tương thích với thư viện shadcn/ui.

### Bảng màu Chính

| Mã token (Token)        | Hex       | HSL           | Mục đích sử dụng                                            |
| ----------------------- | --------- | ------------- | ----------------------------------------------------------- |
| `--color-primary`       | `#5E6AD2` | `235 57% 60%` | Hành động chính, trạng thái active (hoạt động), liên kết    |
| `--color-primary-hover` | `#4F55C4` | `236 52% 54%` | Trạng thái hover cho màu chính                              |
| `--color-accent`        | `#F28C38` | `28 88% 58%`  | Lời gọi hành động (CTAs), sự khẩn cấp, vùng nổi bật màu cam |
| `--color-accent-hover`  | `#E07620` | `27 74% 50%`  | Trạng thái hover cho màu điểm nhấn (accent)                 |
| `--color-success`       | `#22C55E` | `142 71% 45%` | Trạng thái thành công, tác vụ hoàn thành                    |
| `--color-warning`       | `#F59E0B` | `38 92% 50%`  | Trạng thái cảnh báo, ưu tiên trung bình                     |
| `--color-danger`        | `#EF4444` | `0 84% 60%`   | Lỗi, ưu tiên cao, quá hạn                                   |
| `--color-info`          | `#38BDF8` | `199 89% 60%` | Trạng thái thông tin, ưu tiên thấp                          |

### Thang màu trung tính (Neutral)

| Token           | Hex       | Sử dụng                                                                      |
| --------------- | --------- | ---------------------------------------------------------------------------- |
| `--neutral-50`  | `#FAFAFA` | Màu pha cho hàng xen kẽ, nền báo vùng trống rỗng (empty state)               |
| `--neutral-100` | `#F4F4F5` | Nền mờ nhạc, nền trạng thái disabled vô hiệu hóa                             |
| `--neutral-200` | `#E4E4E7` | Ranh và viền, đường phân cách, biên thẻ tag và dạng thẻ cứng                 |
| `--neutral-400` | `#A1A1AA` | Các chữ làm sẵn giữ chỗ (placeholders text), cho biểu tượng phụ trợ icons ẩn |
| `--neutral-600` | `#52525B` | Phần nội văn text dạng thứ cấp, ghi chú dòng phía dưới chú giải              |
| `--neutral-800` | `#27272A` | Màu nhãn chính phần thô hệ chữ nền hiển giao dịch Sáng mode gốc              |
| `--neutral-900` | `#18181B` | Cấp thẻ h1/hướng trang Headings, văn mảng làm sắc hiển rõ                    |

### Mã token Bề mặt Ngữ nghĩa — Chế độ Sáng (Light Mode)

| Token              | Giá trị   | Mục đích                                                      |
| ------------------ | --------- | ------------------------------------------------------------- |
| `--bg-page`        | `#FFFFFF` | Nền của trang                                                 |
| `--bg-surface`     | `#F9F9FB` | Thanh bên (Sidebar), các bảng điều khiển (panels), bề mặt phụ |
| `--bg-elevated`    | `#FFFFFF` | Thẻ (Cards), menu thả xuống, cửa sổ bật lên (modals)          |
| `--border-default` | `#E4E4E7` | Viền mặc định                                                 |
| `--text-primary`   | `#18181B` | Văn bản nội dung cơ bản, chính yếu                            |
| `--text-secondary` | `#52525B` | Dòng làm ngầm mảng text đằng phụ màu thâm muted               |
| `--text-tertiary`  | `#A1A1AA` | Text giữ chỗ placeholders chữ định cấu nhã mờ mập             |

### Ánh xạ bảng phân sắc độ báo Priority

| Mức ưu tiên          | Màu tính                         | Mã hệ Hex | Lớp đuôi phần (Dot class tailwind) |
| -------------------- | -------------------------------- | --------- | ---------------------------------- |
| Khoá cấp tốc (High)  | Đỏ nguy hại Danger red           | `#EF4444` | `bg-red-500`                       |
| Báo hạn vừa (Medium) | Vàng trung độ cảnh Warning amber | `#F59E0B` | `bg-amber-500`                     |
| Hạn chậm thấp (Low)  | Xanh thông hiển Info báo         | `#38BDF8` | `bg-sky-400`                       |
| Trống None           | Neutral màu trung nhã tính       | `#A1A1AA` | `bg-neutral-400`                   |

---

## 2. Nghệ thuật kiểu chữ Typography

### Hệ thống Phông chữ

**Quán chiếu chính (Primary): DM Sans** — tải nhập liên chiếu hệ CDN cho trích liên kết lấy phác nét Font của Google Fonts.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
```

**Dùng cách biệt đơn dòng Monospace đơn cấu kết: JetBrains Mono** — chừa mục cho chèn khối code cấu trích (snippets) và dạng lớp tổ liên bám nút gõ (khối bảng phím chồng overlay chỉ báo key binds).

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Thang căn điểm Kích cỡ 

Cỡ gốc (Base size) sử dụng là **14px** (không dùng quá nét 16px — cho thấy với PM app nhét ứng mục thông nhét dạng 14px nạp thông cấu khối sẽ đậm chắc mượt information density cao độ cấp).

| Token         | Size  (cỡ phân) | Chiều cao dòng (Line Height) | Độ đậm chữ | Tùy ngữ ứng mục Usage                                                                        |
| ------------- | --------------- | ---------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `--text-xs`   | `11px`          | `1.4`                        | 400/500    | Nhãn gán báo (Labels), thẻ nổi text chíp, meta data nhỏ hệ số ghi log timestamp thời điểm    |
| `--text-sm`   | `13px`          | `1.5`                        | 400        | Chữ thô mô ngầm nền thân thân con, khung bao ghi ảnh captions hiển, chữ phân trong báo trình |
| `--text-base` | `14px`          | `1.6`                        | 400        | Nhãn body chữ thô ngầm mục cơ nội báo cho phần diễn mục chính, dọc task row biểu hàng khối   |
| `--text-md`   | `16px`          | `1.5`                        | 500/600    | Các tít gắn cho thẻ, thẻ nạp label form khai gạch (inputs)                                   |
| `--text-lg`   | `20px`          | `1.3`                        | 600        | Phần h2 ranh tách phần mục ghi mục title hệ ngăn hốc kéo bảng drawer hiển                    |
| `--text-xl`   | `24px`          | `1.2`                        | 600        | Khái trang hiển tựa h1 lớn Page main titles pages                                            |
| `--text-2xl`  | `30px`          | `1.15`                       | 700        | Tích đánh mục phân lớn chỉ dashboard đếm mốc con metrics số hiển to điểm                     |

### Trọng số Cỡ chữ Độ Đậm Bold Weights

| Mã Token        | Định Mức Value | Dùng khi Usage                                                                                                           |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `font-normal`   | `400`          | Phần copy nội chữ Body copy, description của giải cấu nội miêu                                                           |
| `font-medium`   | `500`          | Thẻ phân mác chữ UI labels, định menu mục cho báo danh nav items, gắn chỉ trên mốc phần Text Buttons text                |
| `font-semibold` | `600`          | Headings thẻ lớn chỉ khung tựa h2 h3 ranh, thẻ bảng chia phần, đầu mục phân chỉ các công việc bám sát task titkes titles |
| `font-bold`     | `700`          | Chi riêng phần số mộc của đo count lớn dùng màn chính Dashboard metrics dán riêng                                        |

### Các Biến CSS

```css
:root {
  --font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 0.6875rem;    /* 11px */
  --text-sm: 0.8125rem;    /* 13px */
  --text-base: 0.875rem;   /* 14px */
  --text-md: 1rem;         /* 16px */
  --text-lg: 1.25rem;      /* 20px */
  --text-xl: 1.5rem;       /* 24px */
  --text-2xl: 1.875rem;    /* 30px */
}
```

---

## 3. Hệ thống Khoảng cách (Spacing)

**Lưới cơ sở: 4px.** Tất cả các giá trị khoảng cách đều là bội số của 4px.

### Khoảng Lề Spacing Tokens

| Token mã lấp lề | Đánh chập định Value | Nơi sử chỉ Usage                                                                                                                |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--space-1`     | `4px`                | Khe vi kẽ mục, phân định ép sát icon mốc điểm vs phần dòng chữ                                                                  |
| `--space-2`     | `8px`                | Khoảng kẽ của cụm Icons rời mộc, mục khe nhỏ nằm song, độ tản của khe lấp dồn nhiều block ngăn dính                             |
| `--space-3`     | `12px`               | Bo mút phía đệm khoảng nén ranh bên ở dính ranh lẩn lách bên block Component padding                                            |
| `--space-4`     | `16px`               | Bộ nén ranh lẩn component (chuẩn áp default), gap của khu cột mục Lưới grid chung                                               |
| `--space-5`     | `20px`               | Bo khe vi lẩn thành tường đệm padding lồng khối thành trong dễ chịu thoáng                                                      |
| `--space-6`     | `24px`               | Kẻ khối lọt cho bảng panel vỉ nền, gap chia khu thong thả, khe page hông ngách lateral                                          |
| `--space-8`     | `32px`               | Viền cách dãn khoảng cách khung mục nội bám cho khung sườn, dãn mé khoảng trong thành tổng tường bìa trang page dán đệm padding |
| `--space-10`    | `40px`               | Rút lớn viền khu cho mục lớn ngã khoảng cách vĩ cách section                                                                    |
| `--space-12`    | `48px`               | Điểm dài định mốc chuẩn cấu độ vưng khung dật Top bar chiều của ranh thanh bên bám chiều, đai page mốc Header đằng biên         |
| `--space-16`    | `64px`               | Khai to cho Empty size cấu rỗng khu, vùng section ranh mục châm kẽ hở phả                                                       |

### Khoảng cách theo bối cảnh

| Bối cảnh khu cảnh (Context)                                      | Lề đệm nén (Padding) | Khoảng cách hở (Gap) |
| ---------------------------------------------------------------- | -------------------- | -------------------- |
| Phía trong các mục vỉ Card / thẻ Input khung kẽ điền             | `12px 16px`          | —                    |
| Hộc của mảng Panel thả dọc Drawer / vĩ bung Modals bảng modal    | `16px 24px`          | —                    |
| Vị trí chính dán Nội trang Page main content body phần thân      | `24px 32px`          | —                    |
| Bán từ mốc Icon nhét ranh chữ chốt nhãn Label đè vạch            | `8px`                | —                    |
| Xếp thẻ đè xếp (theo trục tụ tịnh phương dọc vi đứng vertical)   | —                    | `8–12px`             |
| Các hàng chia Cột cho Grid cột Lưới                              | —                    | `16–24px`            |
| Kẹt khe mảng ngang Task dải hàng nằm nhỏ thu compact rút         | `6px 12px`           | —                    |
| Đằng vi đầu của khung vạch giới chia mục dán cho header phần dán | `8px 12px`           | —                    |

### Kích thước Bố cục

| Thành phần khối bao ranh vĩ                                                                            | Không mảng giãn (Size) |
| ------------------------------------------------------------------------------------------------------ | ---------------------- |
| Thanh điều hướng góc sườn Sidebar (trưng dải rộng)                                                     | `240px`                |
| Thanh bên (bị nén đóng rút xẹp)                                                                        | `48px`                 |
| Độ của thanh ngang nóc đai vách chặn chiều cao trên Top Bar                                            | `48px`                 |
| Bảng Drawer phơi thả hiển mảng chép công việc Task Detail kéo sườn                                     | `480px`                |
| Khoảng nằm dàn dãn rộng của ngăn cột chứa Kanban hộc Cột column width                                  | `240–280px`            |
| Khe mút chắn ranh chia phàn cột Kanban gap                                                             | `16px`                 |
| Khẩu ranh chặn chốt độ bự Max của trục dãn thân của cấu chính mút content chính main max-width cực cặn | `1400px`               |
| Khảm ranh báo thẻ đổ xuống ranh danh cho bản mục thông Notification hộc vỉ                             | `360px`                |
| Quả bóng người hiển hột avatar cỡ mặc size Default chuẫn mặc Avatar                                    | `32px`                 |
| Quả bóng nhạt nhỏ thu gọn Small                                                                        | `20px`                 |
| Khổ lớn cho bự Large                                                                                   | `40px`                 |

---

## 4. Biên độ Bán kính Viền Border Radius Xoay Góc 

| Khóa Token dán tham | Phận của Số trị Value | Mốc dùng Usage                                                                                                                                                                                                                   |
| ------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--radius-xs`       | `4px`                 | Khuy nhỏ đai mạc hột thẻ Tag bọc tags, khung biểu hiệu (badges), khuyên lọt chips cấu chip                                                                                                                                       |
| `--radius-sm`       | `6px`                 | Mục khối Nút bóp nén (compact nút ấn Button), Các chốt khuyên điền ghi đầu vào (input fields ranh trống vạch)                                                                                                                    |
| `--radius-md`       | `8px`                 | Thẻ khoanh vuông dẻn Cards chung, thẻ trích dán cắm khung bảng Kanban bóc nhãn cho vỉ Kanban cards, nhãn bóng thoại nhắc (tooltips báo hiệu ghi bồi)                                                                             |
| `--radius-lg`       | `12px`                | Bổ tấm khối ngăn vỉ vi Panels khung đắp mốc, các widgets phụ tiểu, khối hộc ô khoảnh chứa đếm thông ghi thẻ mộc dán báo chi số metrics card ghi chỉ metric card                                                                  |
| `--radius-xl`       | `16px`                | Cửa vỉ bảng nổi phóc phủ chặn trập (Modals bóc chận ngắt báo bảng nhảy dán), loại thẻ vỉ Cards siêu chứa size chứa nhiều ranh hốc (large cỡ khung bự chặn), bộc dải ngăn mở cửa tuông (ngọn dải xổ từ mép biên Drawers kéo ghim) |
| `--radius-full`     | `9999px`              | Bọc kín theo dáng biên hạt nhộng viên dài Pill badges đánh dấu nhộng, chíp phân mảng ranh cấu chóp khuyên góc chặn dạng vảy statuses trạng, bóng nhãn ngách chừa icon danh Avatar hột người                                      |

```css
:root {
  --radius-xs:   0.25rem;   /* 4px */
  --radius-sm:   0.375rem;  /* 6px */
  --radius-md:   0.5rem;    /* 8px */
  --radius-lg:   0.75rem;   /* 12px */
  --radius-xl:   1rem;      /* 16px */
  --radius-full: 9999px;
}
```

---

## 5. Bóng đổ ranh bốc chặn độ sáng tối Shadows bóng 

Hệ thiết lập phần cấu của app PM thiên chiều dẹp phẳng dán Flat design cùng biên góc Border. Chỉ kết bợng Shadow tạo nét dán depth ở ít hiếm chỗ xài điểm.

| Token dán khóa      | Chỉ Trị                       | Điểm dùng Usage                                                                                                                                                                                |
| ------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--shadow-card`     | `0 1px 3px rgba(0,0,0,0.08)`  | Thẻ bốc ghim Kanban cards vạch bồi card, Bọc thẻ card mặc bồi chẩn default chung card cấu                                                                                                      |
| `--shadow-elevated` | `0 4px 12px rgba(0,0,0,0.10)` | Bóng khung sập đùn Dropdowns nẩy rụng trỏ bung ranh sổ thả xuống, vỉ bung nhảy thẻ ranh màng nhảy bọt popovers bốc hiển trỏ bóng lố bộc hiện khung rập ranh trào chồi ranh trượt lật xổ        |
| `--shadow-drawer`   | `0 0 40px rgba(0,0,0,0.14)`   | Bóng băm màn chéo tạt xổ trồi ranh hộc bóc lật ranh phơi che phủ lộn trật hộc sườn vách xượt nhéo Task Drawer lớp chặn hâm                                                                     |
| `--shadow-drag`     | `0 8px 24px rgba(0,0,0,0.18)` | Khúc bấm bóc nắm chặn của chóp của con trỏ kéo con lướt mạc thao card ghì nhéo ghì quăng vớt ranh bóng bóng nháo nới (bướu ghì kéo bong ghost trỏ nắm bưng)                                    |
| `--shadow-tooltip`  | `0 2px 8px rgba(0,0,0,0.16)`  | Bóng phập mọc nổi tròn bọng của bảng báo khí đọng hột báo chú ý nhãn (tooltip bóc bóng bọt sủi bong chóp bóng cọt trôi bong phập khói bọt bubble bong mút chú note)                            |
| `--shadow-none`     | `none`                        | Cấu bỏ chừa kĩ bóng dành khoanh không phủ chặn bóng chặn, ô card bóc nhãn gắn cho (thẻ báo ghi mét), khối tiểu trỏ tiện chặn widget (thấm bóc kĩ flat trend độ hot nhẵng 2025 phẳng chót nhẵn) |

**Quy tắc áp định:** Chỉ mét thẻ (thẻ đo đếm mục khối metric cards ranh)/hay ngăn tiện báo (widget phẳng trỏ) đi viền chặn dẹp phẳng cứng nhét `border: 1px solid #E4E4E7` phẳng dán cạch ranh nhẵn bặt khước shadow none bóng đè không báo chặp có bóng đổ chặp phủ ngăn bóc chặp chui ranh chặn chắn bọc chóp ranh xài bóng cằm viền bóng bóng chóp. Kanban card trượt dạt dùng dạt bóng có shadow: `--shadow-card`. Khối mút hộc mạc bưng sườn kéo trỏDrawer lướt dạt xượt xài shadow móc: `--shadow-drawer` bóc dạt hông viền xước quét ngầm che cắm bóng.

---

*(Bỏ qua dịch chi tiết phần mã CSS Override và thiết lập hoạt cảnh (Animations) vì có thể không cần thiết ở mức chuyển ngữ sang tiếng Việt, giữ nguyên logic cốt yếu)*

Vui lòng tham khảo tệp nội bộ nếu cần cấu hình React shadcn/ui.
