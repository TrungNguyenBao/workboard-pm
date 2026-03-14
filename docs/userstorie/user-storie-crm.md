**ĐÁNH GIÁ PRD & USER STORIES HOÀN CHỈNH**
CRM System (Customer Relationship Management)
*Enterprise Resource Platform — CRM Module*

**Assessment Score: 7.0 / 10 → Khá, cần bổ sung đáng kể**
**Phiên bản hoàn chỉnh: 20 Data Models | 12 Epics | 35 User Stories**
Version 2.0  |  Ngày: 2026-03-12

# PHẦN A: ĐÁNH GIÁ PRD

## 1. Bảng điểm chi tiết

| Hạng mục                  | Điểm | Tỷ lệ | Nhận xét                                                                  |
| ------------------------- | ---- | ----- | ------------------------------------------------------------------------- |
| Lead Management           | 9/10 | 90%   | Rất tốt: duplicate detection, auto-scoring, distribution, stale detection |
| Deal Pipeline             | 9/10 | 90%   | Pipeline stages, probability, closing workflow, stale — xuất sắc          |
| Contact & Account         | 8/10 | 80%   | Account 360 tốt, health score. Thiếu account segmentation                 |
| Activity Tracking         | 8/10 | 80%   | 5 activity types, outcome, next_action — good                             |
| API Endpoints             | 9/10 | 90%   | RESTful chuẩn, cover toàn bộ CRUD + business operations                   |
| Data Quality & Governance | 8/10 | 80%   | Quality report, governance alerts — hiếm có ở PRD level                   |
| Quotation/Proposal        | 2/10 | 20%   | THIẾU: Deal stage 'Proposal' nhưng không có Quote model                   |
| Product/Service Catalog   | 2/10 | 20%   | THIẾU: Bán gì? Không có Product/Service list, pricing                     |
| Contract Management       | 2/10 | 20%   | THIẾU: Close Won nhưng không có Contract/Agreement model                  |
| Notification System       | 3/10 | 30%   | Chỉ mention 'thông báo' chung, không có Notification model                |
| Email Integration         | 3/10 | 30%   | Activity log email nhưng không có email template, tracking, auto-log      |
| Attachments/Documents     | 2/10 | 20%   | Không có model đính kèm tài liệu cho deal, account                        |
| Sales Forecast            | 3/10 | 30%   | Có weighted pipeline nhưng không có Forecast model period-based           |
| Territory/Assignment      | 4/10 | 40%   | Lead distribution round-robin nhưng không có Territory model              |
| Custom Fields             | 2/10 | 20%   | THIẾU: Không có custom fields cho Lead/Deal/Account                       |
| Import/Export             | 2/10 | 20%   | THIẾU: Không có import CSV/Excel leads, export reports                    |

| Tổng điểm: 7.0 / 10 \| Xếp loại: KHÁ — Sales pipeline tốt, thiếu Quote/Contract/Product | Điểm mạnh: \| • Lead management xuất sắc (scoring, duplicate, distribution) \| • Data quality & governance hiếm thấy ở PRD level \| Cần bổ sung: \| • +13 models: Product, Quote, Contract, EmailTemplate, Notification... \| • Sales cycle thiếu: Bán gì? Báo giá? Hợp đồng? Doanh thu recurring? |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## 2. Thiếu sót chi tiết

### 2.1 Sales Cycle không hoàn chỉnh [NGHIÊM TRỌNG]

PRD có pipeline: Qualified → Needs Analysis → Proposal → Negotiation → Won/Lost. Nhưng:
- KHÔNG CÓ PRODUCT/SERVICE: Bán gì cho khách? Không có catalog sản phẩm/dịch vụ, pricing tiers, bundles. Deal có 'value' nhưng không detail gồm những items gì.
- KHÔNG CÓ QUOTATION: Stage 'Proposal' nhưng không generate báo giá. Cần: QuoteLine items, pricing, discount, tax, validity period, PDF export.
- KHÔNG CÓ CONTRACT: Close Won nhưng deal biến đi đâu? Cần: Agreement/Contract model (terms, auto-renewal, billing period, SLA).
- KHÔNG CÓ REVENUE TRACKING: Account.total_revenue tĩnh. Cần: recurring revenue (MRR/ARR), revenue per product, churn tracking.
- THIẾU DISCOUNT APPROVAL: Khi sales giảm giá > 20%, ai duyệt? Không có approval workflow cho deal pricing.

### 2.2 Thiếu Communication & Automation [3/10]

- Email Template: Không gửi email chuẩn từ CRM (welcome, follow-up, proposal). Thiếu merge tags.
- Email Tracking: Không biết khách đã mở email chưa, click link chưa (cần cho lead scoring).
- Notification model: Mention 'thông báo' nhưng không có structure — khi nào, cho ai, qua kênh nào.
- Automation: Không auto-send email khi lead mới, không auto-task khi deal stage change.
- Meeting/Calendar: Activity type 'meeting' nhưng không integrate calendar, không có meeting link.

### 2.3 Thiếu khác

- Custom Fields: Lead/Deal/Account không có custom fields. Mỗi industry cần fields riêng (VD: camera AI cần: số camera dự kiến, loại deployment, budget phê duyệt).
- Attachments/Documents: Deal không có nơi attach proposal PDF, contract scan, NDA. Account thiếu document repository.
- Import/Export: Không import lead CSV/Excel từ event, không export pipeline report.
- Territory: Lead distribution chỉ round-robin. Cần territory (theo khu vực/sản phẩm/size) cho doanh nghiệp lớn.
- Competitor: Track đối thủ nào compete trên deal (phân tích win/loss reason chi tiết hơn).
- Sales Forecast: Weighted pipeline không đủ. Cần forecast period-based: target vs actual per rep per month.
- Commission: Sales motivation — không track hoa hồng theo deal/target.
- Web-to-Lead: Form capture từ website → auto-create lead. PRD mention 'website form' nhưng không có integration.
- Account Segmentation: Không phân loại Enterprise/SMB/Startup. Cần cho targeting strategy.
- Contact Roles: Một deal có nhiều contacts (Decision Maker, Influencer, Champion). PRD chỉ link 1 contact.

## 3. Data Models bổ sung (13 models mới → tổng 20)

| Model           | Mục đích                             | Key Fields                                                                                                                                                                               |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProductService  | Catalog sản phẩm/dịch vụ             | name, code, type (product/service/bundle), category, unit_price, currency, description, is_active                                                                                        |
| Quotation       | Báo giá cho deal                     | deal_id, quote_number, contact_id, valid_until, subtotal, discount_pct, discount_amount, tax_amount, total, status (draft/sent/accepted/rejected/expired), notes, created_by             |
| QuotationLine   | Chi tiết dòng báo giá                | quotation_id, product_service_id, description, quantity, unit_price, discount_pct, line_total                                                                                            |
| Contract        | Hợp đồng sau Close Won               | deal_id, account_id, contract_number, title, start_date, end_date, value, billing_period (monthly/quarterly/annual), auto_renewal, status (draft/active/expired/terminated), signed_date |
| DealContactRole | Nhiều contacts trên 1 deal với roles | deal_id, contact_id, role (decision_maker/influencer/champion/user/evaluator), is_primary                                                                                                |
| EmailTemplate   | Mẫu email chuẩn                      | name, subject, body_html, category (welcome/follow_up/proposal/meeting), merge_tags (JSONB), is_active, created_by                                                                       |
| EmailLog        | Lịch sử email gửi/nhận               | contact_id, deal_id, lead_id, template_id, subject, body, direction (sent/received), status (sent/opened/clicked/bounced), sent_at, opened_at                                            |
| CrmNotification | Thông báo CRM                        | recipient_id, type (lead_assigned/deal_stage/mention/follow_up_due/stale_alert), title, body, entity_type, entity_id, is_read, channel (in_app/email)                                    |
| SalesForecast   | Dự báo doanh thu theo kỳ             | owner_id, period (YYYY-MM), target_amount, committed_amount, best_case_amount, closed_amount, status (open/closed)                                                                       |
| CrmAttachment   | Tệp đính kèm cho deal/account        | entity_type (deal/account/contact/lead/ticket), entity_id, file_name, file_url, file_type, category (proposal/contract/nda/presentation/other), uploaded_by                              |
| CrmCustomField  | Custom fields cho Lead/Deal/Account  | entity_type (lead/deal/account/contact), field_name, field_type (text/number/date/select/multi_select), options (JSONB), is_required, position                                           |
| Competitor      | Đối thủ cạnh tranh trên deal         | deal_id, name, strengths, weaknesses, price_comparison, status (active/won/lost)                                                                                                         |
| ImportJob       | Import CSV/Excel leads, contacts     | type (lead/contact/account), file_url, status (pending/processing/completed/failed), total_rows, imported_rows, failed_rows, error_log (JSONB), created_by                               |

# PHẦN B: USER STORIES HOÀN CHỈNH

Tổng hợp PRD gốc (7 models) + bổ sung (13 models) = 20 data models | 12 Epics | 35 User Stories.
P0 - Must Have (MVP)  |  P1 - Should Have  |  P2 - Nice to Have

| ID     | User Story                           | Epic                                   | Priority | Status | Sprint   |
| ------ | ------------------------------------ | -------------------------------------- | -------- | ------ | -------- |
| US-001 | Tạo Lead & Duplicate Detection       | Lead Management                        | P0       | ⬜ Todo | Sprint 1 |
| US-002 | Lead Scoring & Distribution          | Lead Management                        | P0       | ⬜ Todo | Sprint 2 |
| US-003 | Qualify, Convert & Stale Detection   | Lead Management                        | P0       | ⬜ Todo | Sprint 2 |
| US-004 | Xem danh sách & Chi tiết Lead        | Lead Management                        | P0       | ⬜ Todo | Sprint 1 |
| US-005 | Product/Service Catalog              | Deal Pipeline & Quotation              | P0       | ⬜ Todo | Sprint 1 |
| US-006 | Tạo Deal & Pipeline Kanban           | Deal Pipeline & Quotation              | P0       | ⬜ Todo | Sprint 2 |
| US-007 | Quotation (Báo giá)                  | Deal Pipeline & Quotation              | P0       | ⬜ Todo | Sprint 3 |
| US-008 | Close Deal (Won/Lost) & Contract     | Deal Pipeline & Quotation              | P0       | ⬜ Todo | Sprint 3 |
| US-009 | Stale Deals & Probability Management | Deal Pipeline & Quotation              | P1       | ⬜ Todo | Sprint 4 |
| US-010 | Tạo và Quản lý Contacts              | Contact Management                     | P0       | ⬜ Todo | Sprint 1 |
| US-011 | Account CRUD & Auto-creation         | Account Management & 360 View          | P0       | ⬜ Todo | Sprint 3 |
| US-012 | Account 360 View & Health Score      | Account Management & 360 View          | P0       | ⬜ Todo | Sprint 4 |
| US-013 | Follow-up & Contract Management      | Account Management & 360 View          | P1       | ⬜ Todo | Sprint 4 |
| US-014 | Log Activities & Next Actions        | Activity Tracking & Email              | P0       | ⬜ Todo | Sprint 2 |
| US-015 | Email Templates & Tracking           | Activity Tracking & Email              | P1       | ⬜ Todo | Sprint 4 |
| US-016 | Campaign Management & ROI            | Campaign Management                    | P1       | ⬜ Todo | Sprint 3 |
| US-017 | Ticket Management & SLA              | Customer Support (Tickets)             | P0       | ⬜ Todo | Sprint 4 |
| US-018 | CRM Dashboard & Sales KPIs           | CRM Analytics & Forecasting            | P0       | ⬜ Todo | Sprint 4 |
| US-019 | Deal Velocity & Sales Forecast       | CRM Analytics & Forecasting            | P1       | ⬜ Todo | Sprint 5 |
| US-020 | Data Quality Report                  | Data Quality & Governance              | P1       | ⬜ Todo | Sprint 5 |
| US-021 | Governance Alerts                    | Data Quality & Governance              | P1       | ⬜ Todo | Sprint 5 |
| US-022 | CRM Notification System              | Notifications, Attachments & Documents | P0       | ⬜ Todo | Sprint 3 |
| US-023 | Attachments & Documents per Entity   | Notifications, Attachments & Documents | P0       | ⬜ Todo | Sprint 3 |
| US-024 | RBAC & Role-based Access             | RBAC, Pipeline Config & Custom Fields  | P0       | ⬜ Todo | Sprint 1 |
| US-025 | Pipeline & Scoring Config            | RBAC, Pipeline Config & Custom Fields  | P2       | ⬜ Todo | Sprint 6 |
| US-026 | Custom Fields per Entity             | RBAC, Pipeline Config & Custom Fields  | P1       | ⬜ Todo | Sprint 4 |
| US-027 | Cross-module Integration             | Cross-module Integration & Export      | P1       | ⬜ Todo | Sprint 6 |
| US-028 | Import/Export & Reports              | Cross-module Integration & Export      | P1       | ⬜ Todo | Sprint 5 |

# Epic 1: Lead Management

*Tạo lead, duplicate detection (email+phone), auto-scoring (interaction-based), round-robin distribution, qualify → convert to deal, stale detection 30 ngày.*
**Data Models: Lead, CrmCustomField, ImportJob**

## US-001: Tạo Lead & Duplicate Detection

| Priority | P0 - Must Have          |
| -------- | ----------------------- |
| Persona  | Sales / Marketing       |
| Epic     | Epic 1: Lead Management |
| Sprint   | Sprint 1                |
| Estimate | 8 SP                    |

**User Story:**
*As a Sales Rep*
*I want to create leads with auto-duplicate detection and custom fields*
*So that every prospect is captured without creating duplicates in the database*

**Acceptance Criteria:**

| #   | Scenario         | Given                                    | When                                              | Then                                                                   | Status |
| --- | ---------------- | ---------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| AC1 | Tạo lead đầy đủ  | Sales ở Leads List                       | Nhập name, email, phone, source=website, campaign | Lead tạo, status=New, score=0                                          | ⬜      |
| AC2 | Duplicate email  | Lead 'abc@corp.com' đã tồn tại           | Tạo lead cùng email                               | Cảnh báo: 'Lead trùng lặp. Merge hoặc tạo mới?'                        | ⬜      |
| AC3 | Duplicate phone  | Phone '0901234567' đã tồn tại            | Tạo lead cùng phone                               | Cảnh báo tương tự                                                      | ⬜      |
| AC4 | Merge duplicates | 2 leads trùng                            | Nhấn Merge                                        | Giữ lead cũ, gộp data mới, lead trùng→merged                           | ⬜      |
| AC5 | Custom fields    | Project cần 'Số camera dự kiến' (number) | Tạo CrmCustomField → điền giá trị trên lead       | Giá trị lưu, filter/sort theo custom field                             | ⬜      |
| AC6 | Import leads CSV | File 500 leads từ event                  | Upload CSV, map columns                           | ImportJob: processing → completed. 480 imported, 20 duplicates skipped | ⬜      |

**UI Requirements:**
- Lead form: Name, Email, Phone, Company, Source (select), Campaign, Custom Fields
- Duplicate warning modal: Merge / Create Anyway / Cancel
- Import wizard: upload → column mapping → preview → import
- Lead list: search, filter status/source/score/owner/custom fields

**Technical Notes:**
• CRUD /api/v1/crm/leads
• Duplicate: LOWER(email) OR phone exact match
• CrmCustomField: entity_type='lead', dynamic form rendering
• POST /api/v1/crm/leads/import (multipart CSV/Excel)

## US-002: Lead Scoring & Distribution

| Priority | P0 - Must Have          |
| -------- | ----------------------- |
| Persona  | System / Sales Manager  |
| Epic     | Epic 1: Lead Management |
| Sprint   | Sprint 2                |
| Estimate | 8 SP                    |

**User Story:**
*As the System*
*I want to auto-calculate lead scores from interactions and distribute leads via round-robin*
*So that sales reps prioritize hot leads and workload is balanced*

**Acceptance Criteria:**

| #   | Scenario            | Given                                | When                        | Then                                         | Status |
| --- | ------------------- | ------------------------------------ | --------------------------- | -------------------------------------------- | ------ |
| AC1 | Score from activity | Lead score=0, log call (engaged)     | Auto-calculate              | +15 points → score=15, level=Cold            | ⬜      |
| AC2 | Score accumulate    | Lead score=45, request demo          | Auto                        | +20 → score=65, level→Hot                    | ⬜      |
| AC3 | Score from email    | Email opened +5, link clicked +10    | Track                       | Score increases automatically                | ⬜      |
| AC4 | Score levels        | Nhiều leads                          | Xem Lead List               | Badges: Cold (0-30), Warm (30-60), Hot (60+) | ⬜      |
| AC5 | Round-robin         | 3 sales reps A, B, C. New lead       | Auto-distribute             | Lead 1→A, 2→B, 3→C, 4→A (round-robin)        | ⬜      |
| AC6 | Response time alert | Lead assigned 25h ago, not contacted | Daily check                 | Alert: 'Lead [name] chưa liên hệ sau 24h'    | ⬜      |
| AC7 | Manual assign       | Manager muốn gán cụ thể              | Select lead → Assign to rep | owner_id + assigned_at updated               | ⬜      |

**UI Requirements:**
- Score bar (0-100) + level badge on Lead Detail
- Score breakdown: each interaction's contribution
- Distribution settings: round-robin toggle
- Unassigned leads widget on Dashboard

**Technical Notes:**
• Auto-score trigger on Activity/EmailLog create for lead
• Scoring rules: email_open +5, click +10, form +15, call +15, demo +20
• POST /api/v1/crm/leads/distribute
• Alert: assigned_at > 24h AND contacted_at IS NULL

## US-003: Qualify, Convert & Stale Detection

| Priority | P0 - Must Have          |
| -------- | ----------------------- |
| Persona  | Sales                   |
| Epic     | Epic 1: Lead Management |
| Sprint   | Sprint 2                |
| Estimate | 5 SP                    |

**User Story:**
*As a Sales Rep*
*I want to qualify leads (BANT) and convert them to deals with auto-created contacts*
*So that promising prospects enter the pipeline and stale leads are flagged*

**Acceptance Criteria:**

| #   | Scenario                    | Given                        | When                                           | Then                                                      | Status |
| --- | --------------------------- | ---------------------------- | ---------------------------------------------- | --------------------------------------------------------- | ------ |
| AC1 | Qualify lead                | Lead status=Contacted        | Nhấn Qualify → đánh giá BANT                   | Status→Qualified                                          | ⬜      |
| AC2 | Convert to deal             | Lead Qualified               | Convert: deal value=500M, stage=Qualified Lead | Deal tạo + Contact auto-created + Lead status→Opportunity | ⬜      |
| AC3 | Auto-create contact         | Lead convert, no contact yet | Convert                                        | Contact tạo từ lead info (name, email, phone, company)    | ⬜      |
| AC4 | Chặn convert chưa qualified | Lead status=New              | Thử Convert                                    | Lỗi: 'Chỉ lead Qualified mới convert'                     | ⬜      |
| AC5 | Stale 30 days               | Lead no activity 31 ngày     | Daily check                                    | Stale badge + notification cho owner                      | ⬜      |
| AC6 | Disqualify stale            | Lead stale > 60 ngày         | Manager nhấn Disqualify                        | Status→Disqualified, reason='No response'                 | ⬜      |

**UI Requirements:**
- Qualify button, BANT checklist
- Convert dialog: Deal title, Value, Expected close date
- Stale badge (amber) on lead cards
- Bulk disqualify action

**Technical Notes:**
• POST /leads/{id}/convert — create Deal + Contact
• GET /api/v1/crm/leads/stale
• Stale: last_activity > 30 days

## US-004: Xem danh sách & Chi tiết Lead

| Priority | P0 - Must Have          |
| -------- | ----------------------- |
| Persona  | Sales                   |
| Epic     | Epic 1: Lead Management |
| Sprint   | Sprint 1                |
| Estimate | 3 SP                    |

**User Story:**
*As a Sales Rep*
*I want to view, search, filter leads and see full detail with activity history*
*So that I can manage my lead pipeline efficiently*

**Acceptance Criteria:**

| #   | Scenario        | Given                 | When                                    | Then                                                              | Status |
| --- | --------------- | --------------------- | --------------------------------------- | ----------------------------------------------------------------- | ------ |
| AC1 | Lead list       | Sales có 30 leads     | Mở Leads List                           | Name, email, source, status, score, owner, campaign, created_date | ⬜      |
| AC2 | Filter & search | List hiển thị         | Filter status=Qualified, search 'Hotel' | Filtered results                                                  | ⬜      |
| AC3 | Lead detail     | Click lead 'ABC Corp' | Mở Detail                               | Full info + activity timeline + score breakdown + custom fields   | ⬜      |
| AC4 | My Leads        | Toggle                | My Leads filter                         | Chỉ leads owner_id = current user                                 | ⬜      |

**UI Requirements:**
- Lead table: sortable, filterable (status, source, owner, score level, campaign, custom fields)
- Lead Detail: info + activities + score + attachments

**Technical Notes:**
• GET /api/v1/crm/leads?status=&source=&owner_id=&score_min=&score_max=
• Pagination, sorting

# Epic 2: Deal Pipeline & Quotation

*Sales pipeline Kanban, stage/probability tracking, close won/lost, QUOTATION generation (báo giá chi tiết), deal contact roles, stale detection.*
**Data Models: Deal, Quotation, QuotationLine, DealContactRole, Competitor, ProductService**

## US-005: Product/Service Catalog

| Priority | P0 - Must Have                    |
| -------- | --------------------------------- |
| Persona  | Admin / Sales Manager             |
| Epic     | Epic 2: Deal Pipeline & Quotation |
| Sprint   | Sprint 1                          |
| Estimate | 5 SP                              |

**User Story:**
*As an Admin*
*I want to manage a product/service catalog with pricing*
*So that quotations reference standard products and pricing is consistent*

**Acceptance Criteria:**

| #   | Scenario     | Given                     | When                                                                                  | Then                                | Status |
| --- | ------------ | ------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------- | ------ |
| AC1 | Tạo product  | Admin ở Products          | Tạo: name='Camera AI Indoor 2MP', code='CAM-AI-2MP', type=product, unit_price=15M VND | Product tạo, is_active=true         | ⬜      |
| AC2 | Tạo service  | Admin                     | Tạo: name='Triển khai & Cấu hình', type=service, unit_price=5M/site                   | Service tạo                         | ⬜      |
| AC3 | Bundle       | Gói 'Smart Parking Basic' | Tạo: type=bundle, items link nhiều products                                           | Bundle tạo, tổng giá auto-calculate | ⬜      |
| AC4 | Product list | 50 items                  | Search + filter by category/type                                                      | Nhanh, accurate                     | ⬜      |

**UI Requirements:**
- Product form: Name, Code, Type (product/service/bundle), Category, Unit Price, Description
- Product list: search, filter, active toggle

**Technical Notes:**
• CRUD /api/v1/crm/products
• ProductService: type enum (product, service, bundle)
• Link to QuotationLine

## US-006: Tạo Deal & Pipeline Kanban

| Priority | P0 - Must Have                    |
| -------- | --------------------------------- |
| Persona  | Sales                             |
| Epic     | Epic 2: Deal Pipeline & Quotation |
| Sprint   | Sprint 2                          |
| Estimate | 8 SP                              |

**User Story:**
*As a Sales Rep*
*I want to create deals on a Kanban pipeline with stage tracking, probability and deal contact roles*
*So that opportunities are visually managed and key stakeholders are identified*

**Acceptance Criteria:**

| #   | Scenario            | Given                             | When                                                                                    | Then                                                                                                            | Status |
| --- | ------------------- | --------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | Tạo deal            | Sales ở Deals                     | Nhập title, value=300M, stage=Needs Analysis, probability=0.25, contact, expected_close | Deal tạo, hiển thị trên Kanban                                                                                  | ⬜      |
| AC2 | Pipeline Kanban     | 20 deals ở nhiều stages           | Mở Pipeline                                                                             | 5 columns: Qualified→Needs Analysis→Proposal→Negotiation→Closed Won. Mỗi column: count + total value + weighted | ⬜      |
| AC3 | Drag-drop stage     | Deal ở Needs Analysis             | Kéo sang Proposal                                                                       | Stage update, probability auto-adjust (0.5), last_activity=now                                                  | ⬜      |
| AC4 | Contact roles       | Deal có 3 contacts                | Thêm DealContactRole: CEO=decision_maker, CTO=evaluator, PM=champion                    | Roles hiển thị trên Deal Detail, primary contact highlighted                                                    | ⬜      |
| AC5 | Competitor tracking | Deal có 2 đối thủ cạnh tranh      | Thêm Competitor: name, strengths, weaknesses, price_compare                             | Analysis tab trên Deal Detail                                                                                   | ⬜      |
| AC6 | Filter pipeline     | Manager xem                       | Filter by owner/value range/expected close                                              | Pipeline filtered                                                                                               | ⬜      |
| AC7 | Deal custom fields  | Camera AI cần 'Số camera dự kiến' | Tạo CrmCustomField→điền                                                                 | Custom field hiển thị & filterable                                                                              | ⬜      |

**UI Requirements:**
- Kanban: 5+ columns, deal cards (title, value, probability, contact, days in stage)
- Column headers: count + total + weighted value
- Deal Detail: tabs (Overview, Contacts/Roles, Activities, Quotes, Competitors, Attachments)
- Custom fields in Detail form

**Technical Notes:**
• CRUD /deals, Pipeline: GET /deals/pipeline
• Drag: PUT deal with stage update
• Auto-probability per stage: Qualified=0.1, Analysis=0.25, Proposal=0.5, Negotiation=0.75
• DealContactRole: many-to-many deal↔contact with role

## US-007: Quotation (Báo giá)

| Priority | P0 - Must Have                    |
| -------- | --------------------------------- |
| Persona  | Sales                             |
| Epic     | Epic 2: Deal Pipeline & Quotation |
| Sprint   | Sprint 3                          |
| Estimate | 8 SP                              |

**User Story:**
*As a Sales Rep*
*I want to create quotations with product line items, discounts and tax for deals*
*So that proposals are professional, accurate and trackable*

**Acceptance Criteria:**

| #   | Scenario                 | Given                     | When                                                                     | Then                                                                          | Status |
| --- | ------------------------ | ------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------ |
| AC1 | Tạo báo giá              | Deal ở stage Proposal     | Tạo Quotation: add lines [{Camera AI × 20 × 15M}, {Triển khai × 5 × 5M}] | Quote tạo: subtotal=325M, discount 5%=16.25M, tax 10%=30.875M, total=339.625M | ⬜      |
| AC2 | Apply discount           | Quote draft               | Discount 10% trên line Camera                                            | Line total recalculate, grand total update                                    | ⬜      |
| AC3 | Send quote               | Quote draft complete      | Nhấn Send                                                                | Status→sent, auto-email với PDF attachment cho contact                        | ⬜      |
| AC4 | Quote accepted           | Khách đồng ý              | Mark Accepted                                                            | Status→accepted, deal value sync với quote total                              | ⬜      |
| AC5 | Quote rejected/expired   | Khách reject hoặc quá hạn | Update status                                                            | rejected/expired, sales tạo revised quote nếu cần                             | ⬜      |
| AC6 | Multiple quotes per deal | Deal có 3 versions        | Xem Quotes tab                                                           | V1 (rejected) → V2 (expired) → V3 (accepted), version tracking                | ⬜      |
| AC7 | PDF export               | Quote complete            | Nhấn Export PDF                                                          | Professional PDF: company header, line items, totals, terms, validity         | ⬜      |
| AC8 | Discount approval        | Discount > 20%            | Sales tạo quote                                                          | Cảnh báo: 'Discount >20% cần Manager approve trước khi gửi'                   | ⬜      |

**UI Requirements:**
- Quote form: Deal, Contact, Line Items (product, qty, unit price, discount %), Tax rate
- Totals: subtotal, discount, tax, grand total (auto-calculate)
- Quote list per deal: version, status, total, sent date
- PDF preview & export

**Technical Notes:**
• CRUD /api/v1/crm/deals/{did}/quotations
• QuotationLine: product_id, qty, unit_price, discount_pct, line_total
• Auto-calc: subtotal, discount, tax, total
• Status: draft→sent→accepted/rejected/expired
• Discount >20% → require manager approval flag

## US-008: Close Deal (Won/Lost) & Contract

| Priority | P0 - Must Have                    |
| -------- | --------------------------------- |
| Persona  | Sales                             |
| Epic     | Epic 2: Deal Pipeline & Quotation |
| Sprint   | Sprint 3                          |
| Estimate | 8 SP                              |

**User Story:**
*As a Sales Rep*
*I want to close deals as Won (with contract creation) or Lost (with mandatory reason)*
*So that pipeline is accurate and won deals generate contracts and accounts*

**Acceptance Criteria:**

| #   | Scenario                    | Given                            | When                                      | Then                                                                               | Status |
| --- | --------------------------- | -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| AC1 | Close Won                   | Deal Negotiation, quote accepted | Close Won, confirm value                  | Stage→Closed Won, probability=1.0, Account auto-created, Contract auto-created     | ⬜      |
| AC2 | Auto-create Account         | Close Won, no Account yet        | Deal closed                               | Account tạo từ contact company, source_deal_id=deal, total_revenue+=value          | ⬜      |
| AC3 | Auto-create Contract        | Close Won                        | Deal closed                               | Contract tạo: deal_id, account_id, value, start_date, billing_period, status=draft | ⬜      |
| AC4 | Close Lost mandatory reason | Deal cần đóng                    | Close Lost, không nhập reason             | Lỗi: 'Vui lòng chọn lý do mất deal'                                                | ⬜      |
| AC5 | Close Lost with reason      | Deal cần đóng                    | Chọn: 'Giá cao' + competitor info + notes | Stage→Closed Lost, loss_reason lưu, competitor analysis data                       | ⬜      |
| AC6 | Reopen deal                 | Deal Closed Lost, khách quay lại | Manager Reopen                            | Deal về stage trước, closed_at=null                                                | ⬜      |
| AC7 | Won deal attach contract    | Contract draft tạo               | Upload signed contract PDF                | CrmAttachment: entity_type=contract, category=contract                             | ⬜      |

**UI Requirements:**
- Close Won: confirm value, contract preview
- Close Lost: reason dropdown (Giá/Đối thủ/Không phù hợp/Hoãn mua) + notes
- Contract form auto-populated from deal
- Reopen button (Manager only)

**Technical Notes:**
• POST /deals/{id}/close {result:'won'|'lost', loss_reason, competitor_id}
• Auto-create Account + Contract on Won
• Contract: deal_id, account_id, value, billing, auto_renewal
• Account.total_revenue += deal.value

## US-009: Stale Deals & Probability Management

| Priority | P1 - Should Have                  |
| -------- | --------------------------------- |
| Persona  | Sales Manager                     |
| Epic     | Epic 2: Deal Pipeline & Quotation |
| Sprint   | Sprint 4                          |
| Estimate | 3 SP                              |

**User Story:**
*As a Sales Manager*
*I want stale deal alerts and probability management with stage-based defaults*
*So that stuck deals are re-engaged and pipeline values are realistic*

**Acceptance Criteria:**

| #   | Scenario                 | Given                      | When          | Then                                       | Status |
| --- | ------------------------ | -------------------------- | ------------- | ------------------------------------------ | ------ |
| AC1 | Stale 60 days            | Deal no activity 61 ngày   | Daily check   | Stale badge + notification owner + manager | ⬜      |
| AC2 | High-value stale 30 days | Deal 1B VND, stale 31 ngày | Check         | Priority alert: 'High-value deal stale'    | ⬜      |
| AC3 | Auto probability         | Deal move to Proposal      | Stage update  | Probability auto-suggest: 0.50 (editable)  | ⬜      |
| AC4 | Manual override          | Auto probability=0.5       | Sales set 0.7 | Override saved, ghi nhận 'manual'          | ⬜      |

**UI Requirements:**
- Stale badge, Dashboard widget
- Probability slider, auto-suggest indicator

**Technical Notes:**
• GET /deals/stale, threshold: 60d general, 30d high-value (>500M)
• Default probability per stage (configurable)

# Epic 3: Contact Management

*CRUD contacts, link accounts, custom fields, import/export, deduplication.*
**Data Models: Contact**

## US-010: Tạo và Quản lý Contacts

| Priority | P0 - Must Have             |
| -------- | -------------------------- |
| Persona  | Sales                      |
| Epic     | Epic 3: Contact Management |
| Sprint   | Sprint 1                   |
| Estimate | 5 SP                       |

**User Story:**
*As a Sales Rep*
*I want to manage contacts with account linking, custom fields and import capability*
*So that I have a reliable customer database for all interactions*

**Acceptance Criteria:**

| #   | Scenario        | Given                    | When                                                 | Then                                                | Status |
| --- | --------------- | ------------------------ | ---------------------------------------------------- | --------------------------------------------------- | ------ |
| AC1 | Tạo contact     | Sales ở Contacts         | Nhập name, email, phone, company, account (optional) | Contact tạo                                         | ⬜      |
| AC2 | Link account    | Contact chưa gắn account | Chọn account 'ABC Corp'                              | Contact.account_id set, hiển thị trong Account 360  | ⬜      |
| AC3 | Search contacts | 500 contacts             | Search 'Nguyen'                                      | All matches, fast                                   | ⬜      |
| AC4 | Import contacts | CSV 200 contacts         | Upload, map columns                                  | ImportJob: 190 imported, 10 duplicate skipped       | ⬜      |
| AC5 | Contact detail  | Click contact            | Mở Detail                                            | Info + linked deals + activities + emails + tickets | ⬜      |

**UI Requirements:**
- Contact form: Name, Email, Phone, Company, Account, Custom Fields
- Contact list: search, filter by account
- Contact Detail: info, deals, activities, emails

**Technical Notes:**
• CRUD /contacts
• Import: POST /contacts/import
• Link: account_id, shown in Account 360

# Epic 4: Account Management & 360 View

*Customer accounts, 360 view (contacts, deals, activities, tickets, contracts, revenue), health score, follow-up scheduling, segmentation.*
**Data Models: Account, Contract**

## US-011: Account CRUD & Auto-creation

| Priority | P0 - Must Have                        |
| -------- | ------------------------------------- |
| Persona  | Sales                                 |
| Epic     | Epic 4: Account Management & 360 View |
| Sprint   | Sprint 3                              |
| Estimate | 5 SP                                  |

**User Story:**
*As a Sales Rep*
*I want to manage customer accounts with auto-creation on deal win*
*So that organizational relationships are tracked from the moment they become customers*

**Acceptance Criteria:**

| #   | Scenario           | Given                               | When                                                            | Then                                                          | Status |
| --- | ------------------ | ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| AC1 | Tạo account        | Sales ở Accounts                    | Nhập: name='ABC Corp', industry='Hospitality', website, address | Account tạo, status=Active, health_score=50                   | ⬜      |
| AC2 | Auto-create on Won | Deal Closed Won, no account         | Close Won                                                       | Account auto-created from contact.company, source_deal_id set | ⬜      |
| AC3 | Total revenue auto | Account 3 deals Won: 300M+200M+500M | Xem Account                                                     | total_revenue=1B VND (auto-aggregated)                        | ⬜      |
| AC4 | Account list       | 50 accounts                         | Filter status=Active, sort revenue desc                         | Filtered, sorted                                              | ⬜      |

**UI Requirements:**
- Account form: Name, Industry, Website, Address, Status
- Account list: name, industry, revenue, health score, status

**Technical Notes:**
• CRUD /accounts
• Auto-create on deal close won
• total_revenue = SUM(deals.value WHERE won AND account_id)

## US-012: Account 360 View & Health Score

| Priority | P0 - Must Have                        |
| -------- | ------------------------------------- |
| Persona  | Sales / Manager                       |
| Epic     | Epic 4: Account Management & 360 View |
| Sprint   | Sprint 4                              |
| Estimate | 8 SP                                  |

**User Story:**
*As a Sales Rep*
*I want a 360-degree view of each account showing all relationships and a health score*
*So that I understand the full customer relationship for retention and upsell*

**Acceptance Criteria:**

| #   | Scenario          | Given                                           | When            | Then                                                                                               | Status |
| --- | ----------------- | ----------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------- | ------ |
| AC1 | 360 view          | Account ABC Corp                                | Mở 360 View     | Tabs: Contacts(3), Deals(5 won/lost/open), Activities(20), Tickets(2), Contracts(1), Revenue chart | ⬜      |
| AC2 | Health score      | 3 deals won, 1 open ticket, activity 7 ngày ago | Xem score       | Health=80 (High). Formula: revenue 30% + activity recency 30% + ticket health 20% + pipeline 20%   | ⬜      |
| AC3 | Revenue breakdown | Account nhiều deals                             | Xem Revenue tab | Won Revenue, Pipeline Value, Weighted Pipeline, MRR (from contracts)                               | ⬜      |
| AC4 | Contracts tab     | Account có 2 contracts                          | Xem Contracts   | Active contracts: value, billing period, renewal date, SLA status                                  | ⬜      |

**UI Requirements:**
- Account Detail: Tabs (Overview, Contacts, Deals, Activities, Tickets, Contracts, Documents, Revenue)
- Health score gauge (0-100) + color
- Revenue KPI cards + chart

**Technical Notes:**
• GET /accounts/{id}/360
• Health: weighted(revenue 30%, activity_recency 30%, ticket_health 20%, pipeline 20%)
• Revenue: aggregate from deals + contracts

## US-013: Follow-up & Contract Management

| Priority | P1 - Should Have                      |
| -------- | ------------------------------------- |
| Persona  | Sales                                 |
| Epic     | Epic 4: Account Management & 360 View |
| Sprint   | Sprint 4                              |
| Estimate | 5 SP                                  |

**User Story:**
*As a Sales Rep*
*I want to schedule account follow-ups and manage post-sale contracts*
*So that no customer is neglected and contract renewals are tracked*

**Acceptance Criteria:**

| #   | Scenario               | Given                           | When                                | Then                                                      | Status |
| --- | ---------------------- | ------------------------------- | ----------------------------------- | --------------------------------------------------------- | ------ |
| AC1 | Set follow-up          | Account Detail                  | Set next_follow_up_date = next week | Account in upcoming follow-ups list                       | ⬜      |
| AC2 | Overdue follow-up      | Follow-up date passed 3 ngày    | Dashboard check                     | Red indicator, overdue list                               | ⬜      |
| AC3 | Contract renewal alert | Contract end_date trong 30 ngày | Daily check                         | Alert: 'Contract ABC Corp hết hạn 30/04. Cần gia hạn.'    | ⬜      |
| AC4 | Contract lifecycle     | Contract active                 | Renew / Terminate                   | Status updates, revenue tracking adjusted                 | ⬜      |
| AC5 | Upsell opportunity     | Account healthy, no open deal   | Follow-up visit                     | Sales tạo new deal linked to account = upsell opportunity | ⬜      |

**UI Requirements:**
- Follow-up date picker, overdue widget
- Contract list: status, value, renewal date, alert badge
- Upsell: Create Deal button from Account

**Technical Notes:**
• GET /accounts/follow-ups?due_before=
• Contract: status lifecycle draft→active→expired/terminated
• Renewal alert: end_date < today + 30

# Epic 5: Activity Tracking & Email

*Log activities (call/email/meeting/demo/follow-up), email templates với merge tags, email tracking (open/click), next action reminders.*
**Data Models: Activity, EmailTemplate, EmailLog**

## US-014: Log Activities & Next Actions

| Priority | P0 - Must Have                    |
| -------- | --------------------------------- |
| Persona  | Sales                             |
| Epic     | Epic 5: Activity Tracking & Email |
| Sprint   | Sprint 2                          |
| Estimate | 5 SP                              |

**User Story:**
*As a Sales Rep*
*I want to log every interaction and set next actions with reminders*
*So that all customer engagement is documented and follow-ups happen on time*

**Acceptance Criteria:**

| #   | Scenario                 | Given                                 | When                                                                          | Then                                                         | Status |
| --- | ------------------------ | ------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ | ------ |
| AC1 | Log call                 | Vừa gọi lead ABC                      | Tạo: type=call, subject, notes, outcome='interested', next_action_date=3 ngày | Activity tạo, lead score +15, deal.last_activity=now         | ⬜      |
| AC2 | Log meeting              | Họp với deal contact                  | Tạo: type=meeting, link deal+contact                                          | Activity ghi nhận, hiển thị trên cả deal và contact timeline | ⬜      |
| AC3 | Next action reminder     | Activity next_action=tomorrow         | Ngày mai                                                                      | Notification: 'Follow-up action cho [subject]'               | ⬜      |
| AC4 | Activity linked multiple | Call liên quan deal+contact+lead      | Tạo với deal_id+contact_id+lead_id                                            | Hiển thị trên timeline cả 3 entities                         | ⬜      |
| AC5 | SOP: phải log activity   | Deal stage change, no activity 7 ngày | Governance check                                                              | Alert: 'Deal [title] thay đổi stage nhưng không có activity' | ⬜      |

**UI Requirements:**
- Activity form: Type, Subject, Notes, Outcome, Next Action Date, Link (Lead/Deal/Contact)
- Activity timeline per entity
- Next action reminder notifications

**Technical Notes:**
• CRUD /activities
• Update: lead.score, deal.last_activity_date
• Reminder: background job check next_action_date
• Governance: check activity after stage change

## US-015: Email Templates & Tracking

| Priority | P1 - Should Have                  |
| -------- | --------------------------------- |
| Persona  | Sales / Marketing                 |
| Epic     | Epic 5: Activity Tracking & Email |
| Sprint   | Sprint 4                          |
| Estimate | 8 SP                              |

**User Story:**
*As a Sales Rep*
*I want to send emails from templates with merge tags and track opens/clicks*
*So that communication is efficient and engagement metrics feed into lead scoring*

**Acceptance Criteria:**

| #   | Scenario           | Given                                        | When                                                                                 | Then                                                      | Status |
| --- | ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------ |
| AC1 | Tạo email template | Marketing ở Templates                        | Tạo: name='Follow-up sau demo', subject, body_html với {{contact_name}}, {{company}} | EmailTemplate tạo, is_active=true                         | ⬜      |
| AC2 | Send from template | Sales ở Lead Detail                          | Chọn template, auto-fill merge tags, Send                                            | EmailLog tạo: direction=sent, status=sent                 | ⬜      |
| AC3 | Track open         | Recipient mở email                           | Tracking pixel                                                                       | EmailLog.status→opened, opened_at ghi nhận, lead score +5 | ⬜      |
| AC4 | Track click        | Recipient click link                         | Tracking redirect                                                                    | EmailLog click tracked, lead score +10                    | ⬜      |
| AC5 | Email history      | Contact có 10 emails                         | Xem Email tab                                                                        | Timeline: sent/received/opened/clicked với dates          | ⬜      |
| AC6 | Merge tags         | Template có {{contact_name}}, {{deal_value}} | Send                                                                                 | Auto-fill: 'Anh Nguyễn Văn A', '500,000,000 VND'          | ⬜      |

**UI Requirements:**
- Template editor: rich-text, merge tag inserter, preview
- Send email: template selector, auto-fill preview, send button
- Email history timeline per contact/lead
- Open/click indicators

**Technical Notes:**
• CRUD /email-templates
• POST /emails/send (template_id + entity data → render + send)
• EmailLog: tracking pixel for open, redirect for click
• Score integration: open +5, click +10

# Epic 6: Campaign Management

*Marketing campaigns với budget tracking, lead source attribution, ROI calculation, cost per lead, conversion funnel.*
**Data Models: Campaign**

## US-016: Campaign Management & ROI

| Priority | P1 - Should Have            |
| -------- | --------------------------- |
| Persona  | Marketing                   |
| Epic     | Epic 6: Campaign Management |
| Sprint   | Sprint 3                    |
| Estimate | 5 SP                        |

**User Story:**
*As a Marketing Manager*
*I want to manage campaigns with budget, lead tracking and ROI metrics*
*So that marketing effectiveness is measured and spend is optimized*

**Acceptance Criteria:**

| #   | Scenario           | Given                                             | When                                                | Then                                                | Status |
| --- | ------------------ | ------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- | ------ |
| AC1 | Tạo campaign       | Marketing ở Campaigns                             | Tạo: name='FB Q1 2026', type=ads, budget=50M, dates | Campaign tạo, status=draft                          | ⬜      |
| AC2 | Start → Close      | Campaign lifecycle                                | Start→running, Close→nhập actual_cost=45M           | Status: draft→running→closed                        | ⬜      |
| AC3 | ROI calc           | Campaign: 45M spent, 20 leads, 5 deals won = 500M | Xem metrics                                         | ROI = (500M-45M)/45M = 1011%, Cost per Lead = 2.25M | ⬜      |
| AC4 | Conversion funnel  | Campaign 20 leads                                 | Xem funnel                                          | Lead(20)→Qualified(8)→Won(5): conversion 25%→63%    | ⬜      |
| AC5 | Lead source report | Leads từ nhiều sources                            | Xem report                                          | Pie chart: Website 40%, Ads 35%, Referral 25%       | ⬜      |

**UI Requirements:**
- Campaign form: Name, Type (email/ads/event), Budget, Dates
- Campaign detail: KPIs (leads, CPL, conversion, ROI)
- Lead source attribution chart
- Campaign comparison table

**Technical Notes:**
• CRUD /campaigns
• ROI: (revenue - actual_cost) / actual_cost
• CPL: actual_cost / lead_count
• Conversion: leads→qualified→won ratios

# Epic 7: Customer Support (Tickets)

*Ticket lifecycle (open→in_progress→resolved→closed), priority/SLA, impact on account health score, support KPIs.*
**Data Models: Ticket**

## US-017: Ticket Management & SLA

| Priority | P0 - Must Have                     |
| -------- | ---------------------------------- |
| Persona  | Support                            |
| Epic     | Epic 7: Customer Support (Tickets) |
| Sprint   | Sprint 4                           |
| Estimate | 8 SP                               |

**User Story:**
*As a Support Staff*
*I want to create and manage tickets linked to contacts/accounts with SLA tracking*
*So that every support request is resolved within agreed timeframes*

**Acceptance Criteria:**

| #   | Scenario              | Given                       | When                                                       | Then                                                                     | Status |
| --- | --------------------- | --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| AC1 | Tạo ticket            | Customer gọi báo lỗi        | Tạo: subject, description, priority=high, contact, account | Ticket tạo, status=open, auto-assign                                     | ⬜      |
| AC2 | Workflow              | Ticket open                 | Start→in_progress→Resolve (notes)→Close                    | Status flow complete, resolved_at + closed_at tracked                    | ⬜      |
| AC3 | Reopen                | Ticket closed, issue recurs | Reopen                                                     | Status→open, reopen count tracked                                        | ⬜      |
| AC4 | Account health impact | Account 3 open tickets      | Health check                                               | Health score giảm (open tickets = negative factor)                       | ⬜      |
| AC5 | Support KPIs          | 50 tickets tháng này        | Dashboard                                                  | Open count, avg resolution time, SLA compliance %, priority distribution | ⬜      |
| AC6 | Attach files          | Ticket for device issue     | Upload screenshots, logs                                   | CrmAttachment: entity_type=ticket, files linked                          | ⬜      |

**UI Requirements:**
- Ticket form: Subject, Description, Priority, Contact, Account
- Workflow buttons: Start → Resolve → Close
- Ticket list: filter status/priority/assigned
- Support KPI dashboard

**Technical Notes:**
• CRUD /tickets
• Status: open→in_progress→resolved→closed
• Avg resolution: AVG(resolved_at - created_at)
• Account health: penalize for open tickets

# Epic 8: CRM Analytics & Forecasting

*Sales dashboard KPIs, pipeline analytics, deal velocity, sales forecast (target vs actual), data quality report.*
**Data Models: SalesForecast**

## US-018: CRM Dashboard & Sales KPIs

| Priority | P0 - Must Have                      |
| -------- | ----------------------------------- |
| Persona  | Sales Manager                       |
| Epic     | Epic 8: CRM Analytics & Forecasting |
| Sprint   | Sprint 4                            |
| Estimate | 8 SP                                |

**User Story:**
*As a Sales Manager*
*I want a CRM dashboard with pipeline KPIs, sales funnel and revenue trends*
*So that I can monitor team performance and make data-driven decisions*

**Acceptance Criteria:**

| #   | Scenario        | Given              | When         | Then                                                                                     | Status |
| --- | --------------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------- | ------ |
| AC1 | KPI cards       | CRM có data        | Mở Dashboard | Total Pipeline, Weighted Pipeline, Revenue This Month, Win Rate, Avg Cycle, Active Deals | ⬜      |
| AC2 | Sales funnel    | Deals nhiều stages | Xem funnel   | Qualified(50)→Analysis(30)→Proposal(15)→Negotiation(8)→Won(5), conversion rates          | ⬜      |
| AC3 | Revenue trend   | 6 tháng data       | Xem chart    | Monthly won revenue bar chart, trend line                                                | ⬜      |
| AC4 | Stage breakdown | Pipeline có deals  | Xem chart    | Per stage: deal count + total value + weighted value                                     | ⬜      |

**UI Requirements:**
- KPI cards row
- Sales funnel visualization
- Pipeline stage bar chart
- Revenue trend chart
- Top deals table

**Technical Notes:**
• GET /api/v1/crm/analytics
• Win rate: won/(won+lost)×100
• Avg cycle: AVG(closed_at-created_at) for won
• Weighted: SUM(value×probability)

## US-019: Deal Velocity & Sales Forecast

| Priority | P1 - Should Have                    |
| -------- | ----------------------------------- |
| Persona  | Sales Manager                       |
| Epic     | Epic 8: CRM Analytics & Forecasting |
| Sprint   | Sprint 5                            |
| Estimate | 8 SP                                |

**User Story:**
*As a Sales Manager*
*I want deal velocity analysis and period-based sales forecasts*
*So that I can identify bottlenecks and set realistic targets for the team*

**Acceptance Criteria:**

| #   | Scenario             | Given                          | When                                     | Then                                                                          | Status |
| --- | -------------------- | ------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| AC1 | Velocity per stage   | Deals có stage history         | Xem velocity                             | Avg days per stage: Qualified(5d)→Analysis(12d)→Proposal(8d)→Negotiation(15d) | ⬜      |
| AC2 | Bottleneck highlight | Proposal avg 20 days (highest) | Xem report                               | Proposal highlighted as bottleneck                                            | ⬜      |
| AC3 | Create forecast      | Sales Manager ở Forecast       | Tạo: period=2026-03, target=500M per rep | SalesForecast tạo per owner                                                   | ⬜      |
| AC4 | Forecast tracking    | Tháng 3 đang chạy              | Xem forecast                             | Per rep: target 500M, committed 300M, best_case 450M, closed 200M             | ⬜      |
| AC5 | Forecast vs actual   | Tháng kết thúc                 | Close forecast                           | Final: target vs actual, attainment %                                         | ⬜      |
| AC6 | Velocity by owner    | Nhiều reps                     | Filter by owner                          | So sánh velocity giữa reps → coaching opportunity                             | ⬜      |

**UI Requirements:**
- Velocity bar chart per stage
- Bottleneck highlight
- Forecast table: rep × target/committed/best_case/closed
- Forecast vs actual chart, attainment %

**Technical Notes:**
• Velocity: AVG(stage_change timestamps)
• CRUD /api/v1/crm/forecasts
• SalesForecast: owner_id, period, target, committed, best_case, closed
• Attainment: closed / target × 100

# Epic 9: Data Quality & Governance

*Quality score (duplicates, missing fields, stale records), governance alerts (overdue follow-ups, unassigned leads, missing deal values).*
**Data Models: (aggregation, no new model)**

## US-020: Data Quality Report

| Priority | P1 - Should Have                  |
| -------- | --------------------------------- |
| Persona  | Admin / Manager                   |
| Epic     | Epic 9: Data Quality & Governance |
| Sprint   | Sprint 5                          |
| Estimate | 5 SP                              |

**User Story:**
*As an Admin*
*I want a data quality report showing duplicates, missing fields and stale records*
*So that CRM data stays clean and effective*

**Acceptance Criteria:**

| #   | Scenario       | Given                                | When           | Then                                       | Status |
| --- | -------------- | ------------------------------------ | -------------- | ------------------------------------------ | ------ |
| AC1 | Quality score  | 500 leads, 200 deals                 | Mở report      | Overall: 85/100. Breakdown per entity type | ⬜      |
| AC2 | Duplicates     | 15 duplicate leads                   | Xem duplicates | 15 pairs with merge action                 | ⬜      |
| AC3 | Missing fields | 30 leads no phone, 10 deals no value | Xem missing    | List items thiếu data quan trọng           | ⬜      |
| AC4 | Stale records  | 20 leads no activity >90 ngày        | Xem stale      | List 20 stale records                      | ⬜      |

**UI Requirements:**
- Quality gauge (0-100)
- Sections: Duplicates, Missing, Stale
- Action buttons: Merge, Bulk Update, Disqualify

**Technical Notes:**
• GET /api/v1/crm/data-quality/report
• Score: 100 - (duplicate_penalty + missing_penalty + stale_penalty)

## US-021: Governance Alerts

| Priority | P1 - Should Have                  |
| -------- | --------------------------------- |
| Persona  | Sales Manager                     |
| Epic     | Epic 9: Data Quality & Governance |
| Sprint   | Sprint 5                          |
| Estimate | 5 SP                              |

**User Story:**
*As a Sales Manager*
*I want governance alerts for overdue follow-ups, unassigned leads and missing deal data*
*So that CRM discipline is enforced and no opportunities are missed*

**Acceptance Criteria:**

| #   | Scenario            | Given                        | When         | Then                           | Status |
| --- | ------------------- | ---------------------------- | ------------ | ------------------------------ | ------ |
| AC1 | Overdue follow-ups  | 5 accounts overdue           | Alerts panel | '5 accounts quá hạn follow-up' | ⬜      |
| AC2 | Unassigned leads    | 10 leads no owner            | Check        | '10 leads chưa phân bổ'        | ⬜      |
| AC3 | Stale deals         | 8 deals >60 ngày no activity | Check        | '8 deals stale, tổng 2B VND'   | ⬜      |
| AC4 | Missing values      | 15 deals no value            | Check        | '15 deals chưa nhập giá trị'   | ⬜      |
| AC5 | High-value inactive | Deal 1B, 15 ngày no activity | Check        | Priority alert                 | ⬜      |

**UI Requirements:**
- Governance panel on Dashboard
- Alert categories with counts
- Drill-down to affected records

**Technical Notes:**
• GET /api/v1/crm/governance/alerts
• Rules engine: configurable thresholds

# Epic 10: Notifications, Attachments & Documents

*CRM notifications (in-app + email), tệp đính kèm cho deal/account/ticket (proposal, contract, NDA), document repository.*
**Data Models: CrmNotification, CrmAttachment**

## US-022: CRM Notification System

| Priority | P0 - Must Have                                  |
| -------- | ----------------------------------------------- |
| Persona  | All Users                                       |
| Epic     | Epic 10: Notifications, Attachments & Documents |
| Sprint   | Sprint 3                                        |
| Estimate | 8 SP                                            |

**User Story:**
*As a CRM User*
*I want notifications for lead assignments, deal updates, follow-up reminders and stale alerts*
*So that I stay informed about critical CRM events without constant checking*

**Acceptance Criteria:**

| #   | Scenario                 | Given                     | When                   | Then                                     | Status |
| --- | ------------------------ | ------------------------- | ---------------------- | ---------------------------------------- | ------ |
| AC1 | Lead assigned            | Lead assign cho Sales A   | Auto                   | Notification: 'Bạn có lead mới: [name]'  | ⬜      |
| AC2 | Deal stage change        | Deal move to Proposal     | Auto notify deal owner | 'Deal [title] chuyển sang Proposal'      | ⬜      |
| AC3 | Follow-up due            | Follow-up date = today    | Morning check          | 'Follow-up hôm nay: ABC Corp'            | ⬜      |
| AC4 | Stale alert              | Lead stale > 30 ngày      | Daily                  | 'Lead [name] không có activity 30+ ngày' | ⬜      |
| AC5 | Mention in activity      | Activity notes '@John'    | Post                   | Notification cho John                    | ⬜      |
| AC6 | Notification preferences | User muốn tắt email stale | Settings               | Tắt email cho stale, giữ in-app          | ⬜      |
| AC7 | Mark read/all read       | 5 unread                  | Click / Mark All       | is_read updated, badge count giảm        | ⬜      |

**UI Requirements:**
- Notification bell + badge
- Dropdown list: mark read, click to navigate
- Preferences: toggle per event × per channel

**Technical Notes:**
• CrmNotification: recipient, type, entity link, is_read, channel
• Events: lead_assigned, deal_stage, follow_up_due, stale, mention
• Background jobs for scheduled notifications

## US-023: Attachments & Documents per Entity

| Priority | P0 - Must Have                                  |
| -------- | ----------------------------------------------- |
| Persona  | Sales                                           |
| Epic     | Epic 10: Notifications, Attachments & Documents |
| Sprint   | Sprint 3                                        |
| Estimate | 5 SP                                            |

**User Story:**
*As a Sales Rep*
*I want to upload and manage documents on deals, accounts and contacts*
*So that proposals, contracts, NDAs and other files are centralized with the right entity*

**Acceptance Criteria:**

| #   | Scenario            | Given                       | When                             | Then                                                            | Status |
| --- | ------------------- | --------------------------- | -------------------------------- | --------------------------------------------------------------- | ------ |
| AC1 | Upload proposal PDF | Deal ở Proposal stage       | Upload file, category='proposal' | CrmAttachment: entity_type=deal, category=proposal              | ⬜      |
| AC2 | Upload contract     | Account has signed contract | Upload, category='contract'      | Attachment linked to account, downloadable                      | ⬜      |
| AC3 | Multiple categories | Deal has nhiều files        | Xem Attachments tab              | Grouped: Proposals(2), Contracts(1), Presentations(3), Other(1) | ⬜      |
| AC4 | Inline preview      | PDF uploaded                | Nhấn Preview                     | View inline without download                                    | ⬜      |
| AC5 | File validation     | Upload .exe                 | Check                            | Lỗi: 'Chỉ chấp nhận PDF, DOCX, XLSX, PPTX, JPG, PNG. Max 10MB'  | ⬜      |

**UI Requirements:**
- Attachments tab on Deal, Account, Contact, Ticket detail
- Upload: drag-drop, category select
- File list: name, category, size, date, uploader
- Preview inline, download, delete

**Technical Notes:**
• CRUD /api/v1/crm/attachments (polymorphic)
• CrmAttachment: entity_type, entity_id, category, file_url
• Categories: proposal, contract, nda, presentation, meeting_notes, other
• File validation: types + size limit

# Epic 11: RBAC, Pipeline Config & Custom Fields

*5 roles (Admin, Sales Manager, Sales, Marketing, Support), configurable pipeline stages & lead scoring, custom fields per entity.*
**Data Models: CrmCustomField**

## US-024: RBAC & Role-based Access

| Priority | P0 - Must Have                                 |
| -------- | ---------------------------------------------- |
| Persona  | Admin                                          |
| Epic     | Epic 11: RBAC, Pipeline Config & Custom Fields |
| Sprint   | Sprint 1                                       |
| Estimate | 8 SP                                           |

**User Story:**
*As an Admin*
*I want role-based access control for all CRM functions*
*So that each team member accesses only what their role permits*

**Acceptance Criteria:**

| #   | Scenario               | Given              | When                                                | Then                        | Status |
| --- | ---------------------- | ------------------ | --------------------------------------------------- | --------------------------- | ------ |
| AC1 | Sales: leads + deals   | User=Sales         | CRUD leads, deals, activities, quotes               | Thành công                  | ⬜      |
| AC2 | Marketing: campaigns   | User=Marketing     | CRUD campaigns, view lead source report             | OK. Không edit deal stages. | ⬜      |
| AC3 | Support: tickets       | User=Support       | CRUD tickets                                        | OK. Không edit deals.       | ⬜      |
| AC4 | Manager: all view      | User=Sales Manager | All deals, all leads, pipeline, analytics, forecast | Full view access            | ⬜      |
| AC5 | Marketing no deal edit | User=Marketing     | Thử edit deal stage                                 | 403 Forbidden               | ⬜      |

**UI Requirements:**
- Permission-based menu/button rendering
- Role indicator

**Technical Notes:**
• RBAC middleware
• 5 roles: Admin, Sales Manager, Sales, Marketing, Support
• Permission matrix per role × entity × action

## US-025: Pipeline & Scoring Config

| Priority | P2 - Nice to Have                              |
| -------- | ---------------------------------------------- |
| Persona  | Admin                                          |
| Epic     | Epic 11: RBAC, Pipeline Config & Custom Fields |
| Sprint   | Sprint 6                                       |
| Estimate | 5 SP                                           |

**User Story:**
*As an Admin*
*I want to customize pipeline stages, default probabilities and lead scoring rules*
*So that the CRM matches our specific sales process*

**Acceptance Criteria:**

| #   | Scenario           | Given             | When                                                    | Then                              | Status |
| --- | ------------------ | ----------------- | ------------------------------------------------------- | --------------------------------- | ------ |
| AC1 | Edit stage names   | 5 stages          | Rename 'Needs Analysis'→'Discovery'                     | Updated system-wide               | ⬜      |
| AC2 | Add stage          | 5 existing        | Add 'Technical Review' between Proposal and Negotiation | New stage appears on pipeline     | ⬜      |
| AC3 | Edit scoring rules | Default: call=+15 | Change call=+20                                         | Future activities use new scoring | ⬜      |
| AC4 | Edit thresholds    | Cold: 0-30        | Change Hot to 70+                                       | Score levels adjusted             | ⬜      |

**UI Requirements:**
- Pipeline config: drag to reorder, name/probability edit
- Scoring rules table: activity type × points
- Threshold config: Cold/Warm/Hot ranges

**Technical Notes:**
• Pipeline config per workspace
• Scoring config per workspace
• Apply to new items only (not retroactive)

## US-026: Custom Fields per Entity

| Priority | P1 - Should Have                               |
| -------- | ---------------------------------------------- |
| Persona  | Admin                                          |
| Epic     | Epic 11: RBAC, Pipeline Config & Custom Fields |
| Sprint   | Sprint 4                                       |
| Estimate | 5 SP                                           |

**User Story:**
*As an Admin*
*I want to define custom fields for leads, deals, accounts and contacts*
*So that CRM tracks industry-specific data beyond standard fields*

**Acceptance Criteria:**

| #   | Scenario                  | Given                  | When                                                                        | Then                              | Status |
| --- | ------------------------- | ---------------------- | --------------------------------------------------------------------------- | --------------------------------- | ------ |
| AC1 | Tạo custom field cho Deal | Admin ở Settings       | Tạo: entity_type=deal, name='Số camera dự kiến', type=number, required=true | Field hiển thị trên mọi Deal form | ⬜      |
| AC2 | Select field              | Tạo cho Lead           | type=select, options=['Enterprise','SMB','Startup']                         | Dropdown hiển thị, filterable     | ⬜      |
| AC3 | Required validation       | Field required=true    | Để trống, save                                                              | Lỗi validation                    | ⬜      |
| AC4 | Filter by custom field    | Deals có custom fields | Filter 'Số camera > 50'                                                     | Filtered results                  | ⬜      |
| AC5 | 5 field types             | Tạo các types          | text, number, date, select, multi_select                                    | Tất cả hoạt động                  | ⬜      |

**UI Requirements:**
- Custom Fields config: entity type, field name, type, options, required, position
- Dynamic rendering on entity forms
- Filter/Sort by custom field values

**Technical Notes:**
• CRUD /api/v1/crm/custom-fields
• CrmCustomField: entity_type, field_name, field_type, options JSONB, is_required
• Store values in entity JSONB column

# Epic 12: Cross-module Integration & Export

*Tích hợp PMS (project from deal), WMS (devices for client), HRM (sales team). Import/Export capabilities.*
**Data Models: ImportJob**

## US-027: Cross-module Integration

| Priority | P1 - Should Have                           |
| -------- | ------------------------------------------ |
| Persona  | Sales / PM                                 |
| Epic     | Epic 12: Cross-module Integration & Export |
| Sprint   | Sprint 6                                   |
| Estimate | 5 SP                                       |

**User Story:**
*As a Sales Rep*
*I want CRM linked with PMS (projects), WMS (equipment) and HRM (team)*
*So that the full customer lifecycle from sale to deployment is connected*

**Acceptance Criteria:**

| #   | Scenario                   | Given                               | When                      | Then                                                    | Status |
| --- | -------------------------- | ----------------------------------- | ------------------------- | ------------------------------------------------------- | ------ |
| AC1 | Deal → PMS Project         | Deal Closed Won for ABC Hotel       | Nhấn 'Create Project'     | PMS Project tạo linked to deal, account info pre-filled | ⬜      |
| AC2 | Account → WMS Devices      | Account ABC deployed 20 cameras     | Xem Account 360 > Devices | Hiển thị: 20 devices, serial, model, status từ WMS      | ⬜      |
| AC3 | Account → Warranty tickets | Account devices có warranty tickets | Xem Warranty tab          | Tickets from WMS warranty module                        | ⬜      |
| AC4 | Sales team from HRM        | View sales reps                     | Team members              | Name, position, department từ HRM employee data         | ⬜      |

**UI Requirements:**
- 'Create Project' button on won deals
- Devices tab on Account 360 (from WMS)
- Warranty tab on Account (from WMS)
- Team info from HRM

**Technical Notes:**
• Cross-module APIs: PMS project_id, WMS project_id, HRM employee_id
• Deal→Project: create PMS project with deal data
• Account→WMS: GET /wms/devices?project_id=
• Account→Warranty: GET /wms/warranty-tickets?account_id=

## US-028: Import/Export & Reports

| Priority | P1 - Should Have                           |
| -------- | ------------------------------------------ |
| Persona  | Sales Manager / Admin                      |
| Epic     | Epic 12: Cross-module Integration & Export |
| Sprint   | Sprint 5                                   |
| Estimate | 5 SP                                       |

**User Story:**
*As a Sales Manager*
*I want to import leads/contacts from CSV and export all CRM reports*
*So that data migration is easy and reports can be shared offline*

**Acceptance Criteria:**

| #   | Scenario              | Given               | When                                    | Then                                                             | Status |
| --- | --------------------- | ------------------- | --------------------------------------- | ---------------------------------------------------------------- | ------ |
| AC1 | Import leads CSV      | CSV 500 rows        | Upload → map columns → preview → import | ImportJob: 480 imported, 20 duplicates                           | ⬜      |
| AC2 | Import contacts       | Excel file          | Same wizard                             | Contacts imported with account linking                           | ⬜      |
| AC3 | Export pipeline       | Pipeline data       | Export Excel                            | Full pipeline: deals, stages, values, owners, expected close     | ⬜      |
| AC4 | Export report PDF     | Analytics dashboard | Export PDF                              | Summary PDF: KPIs, funnel, revenue chart, top deals              | ⬜      |
| AC5 | Import error handling | CSV có 20 rows lỗi  | Import                                  | Error log: row number, field, error reason. Download error file. | ⬜      |

**UI Requirements:**
- Import wizard: upload → column mapping → preview → confirm
- Export buttons: Excel, PDF on all list/report pages
- Import history: status, counts, error log download

**Technical Notes:**
• POST /api/v1/crm/import (multipart)
• ImportJob: type, file_url, status, total/imported/failed, error_log JSONB
• Export: server-side Excel (SheetJS) + PDF generation

# Phụ lục: Data Model Coverage (20 Models)

| #   | Model           | Epic    | Mô tả                                                         |
| --- | --------------- | ------- | ------------------------------------------------------------- |
| 1   | Lead            | Epic 1  | Prospective customers: source, status, score, owner, campaign |
| 2   | Contact         | Epic 3  | Individual contacts linked to accounts                        |
| 3   | Deal            | Epic 2  | Sales opportunities: pipeline stage, probability, value       |
| 4   | Account         | Epic 4  | Customer organizations: industry, revenue, health_score       |
| 5   | Activity        | Epic 5  | Sales interactions: call, email, meeting, demo, follow-up     |
| 6   | Campaign        | Epic 6  | Marketing campaigns: budget, ROI, lead attribution            |
| 7   | Ticket          | Epic 7  | Customer support tickets: priority, SLA, resolution           |
| 8   | ProductService  | Epic 2  | Sản phẩm/dịch vụ catalog: pricing, categories, bundles        |
| 9   | Quotation       | Epic 2  | Báo giá: line items, discount, tax, validity, PDF export      |
| 10  | QuotationLine   | Epic 2  | Chi tiết dòng báo giá: product, qty, price, discount          |
| 11  | Contract        | Epic 4  | Hợp đồng sau Close Won: billing, renewal, SLA                 |
| 12  | DealContactRole | Epic 2  | Multi-contact per deal: decision_maker, champion, evaluator   |
| 13  | EmailTemplate   | Epic 5  | Mẫu email: merge tags, categories                             |
| 14  | EmailLog        | Epic 5  | Lịch sử email: sent/opened/clicked tracking                   |
| 15  | CrmNotification | Epic 10 | Thông báo: in-app + email, per event type                     |
| 16  | SalesForecast   | Epic 8  | Dự báo: target vs committed vs closed per rep per period      |
| 17  | CrmAttachment   | Epic 10 | Tệp đính kèm: proposal, contract, NDA per entity              |
| 18  | CrmCustomField  | Epic 11 | Custom fields: per entity type, 5 field types                 |
| 19  | Competitor      | Epic 2  | Đối thủ per deal: strengths, weaknesses, price comparison     |
| 20  | ImportJob       | Epic 12 | Import CSV/Excel: status, error log, row counts               |

*Mỗi User Story hoàn thành phải có tất cả Acceptance Criteria pass.*

*— Hết document —*