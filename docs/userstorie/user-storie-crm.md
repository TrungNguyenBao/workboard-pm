USER STORIES & ACCEPTANCE CRITERIA
CRM System (Customer Relationship Management)
Enterprise Resource Platform — CRM Module

Version: 1.0  |  Ngày tạo: 2026-03-12
Dựa trên PRD & SOP CRM System v1.0
 
Tổng quan User Stories
Tài liệu này chứa 30 user stories được tổ chức thành 10 epics, bao phủ toàn bộ chức năng của hệ thống CRM theo PRD. Mỗi story bao gồm Acceptance Criteria (Given-When-Then), UI Requirements và Technical Notes.

Chú giải Priority
P0 - Must Have (MVP blocker)  |  P1 - Should Have (Important)  |  P2 - Nice to Have (Enhancement)

Personas
•	Sales — Quản lý leads, deals, log activities, chốt deal
•	Marketing — Tạo campaigns, theo dõi lead source, đo ROI
•	Sales Manager — Quản lý pipeline, KPIs, team performance, governance
•	Support — Tạo và xử lý tickets, chăm sóc khách hàng
•	Admin — Cấu hình hệ thống, RBAC, pipeline stages, scoring rules

ID	User Story	Epic	Priority	Status	Sprint
US-001	Tạo Lead mới	Lead Management	P0	✅ Done	Sprint 1
US-002	Phát hiện Lead trùng lặp	Lead Management	P0	✅ Done	Sprint 1
US-003	Auto Scoring Lead	Lead Management	P0	✅ Done	Sprint 2
US-004	Phân bổ Lead (Distribution)	Lead Management	P0	✅ Done	Sprint 2
US-005	Qualify và Chuyển đổi Lead thành Deal	Lead Management	P0	✅ Done	Sprint 2
US-006	Phát hiện Lead stale	Lead Management	P1	✅ Done	Sprint 3
US-007	Xem danh sách và chi tiết Lead	Lead Management	P0	✅ Done	Sprint 1
US-008	Tạo Deal mới	Deal Management	P0	✅ Done	Sprint 2
US-009	Pipeline Kanban View	Deal Management	P0	✅ Done	Sprint 2
US-010	Cập nhật Stage và Probability	Deal Management	P0	✅ Done	Sprint 3
US-011	Close Deal (Won / Lost)	Deal Management	P0	✅ Done	Sprint 3
US-012	Phát hiện Deal stale	Deal Management	P1	✅ Done	Sprint 4
US-013	Tạo và quản lý Contact	Contact Management	P0	✅ Done	Sprint 1
US-014	Tạo và quản lý Account	Account Management	P0	✅ Done	Sprint 3
US-015	Account 360 View	Account Management	P0	✅ Done	Sprint 4
US-016	Follow-up Scheduling và Tracking	Account Management	P1	✅ Done	Sprint 4
US-017	Tạo Activity (Log hoạt động sales)	Activity Tracking	P0	✅ Done	Sprint 2
US-018	Xem Activities List và Timeline	Activity Tracking	P0	✅ Done	Sprint 3
US-019	Tạo và quản lý Campaign	Campaign Management	P1	✅ Done	Sprint 3
US-020	Campaign Performance & Lead Source Attribution	Campaign Management	P1	✅ Done	Sprint 5
US-021	Tạo Support Ticket	Ticket Management (Customer Support)	P0	✅ Done	Sprint 4
US-022	Xử lý và đóng Ticket	Ticket Management (Customer Support)	P0	✅ Done	Sprint 4
US-023	Xem danh sách Tickets và Dashboard	Ticket Management (Customer Support)	P1	✅ Done	Sprint 5
US-024	CRM Dashboard - Sales KPIs	CRM Analytics & Reporting	P0	✅ Done	Sprint 4
US-025	Deal Velocity Analytics	CRM Analytics & Reporting	P1	✅ Done	Sprint 5
US-026	Data Quality Report	Data Quality & Governance	P1	✅ Done	Sprint 5
US-027	Governance Alerts	Data Quality & Governance	P1	✅ Done	Sprint 5
US-028	Phân quyền CRM theo Role	RBAC & System Configuration	P0	✅ Done	Sprint 1
US-029	Cấu hình Pipeline Stages	RBAC & System Configuration	P2	✅ Done	Sprint 6
US-030	Cấu hình Lead Scoring Rules	RBAC & System Configuration	P2	✅ Done	Sprint 6
 
Epic 1: Lead Management
Quản lý toàn bộ vòng đời lead: tạo, phát hiện trùng lặp, tự động chấm điểm, phân bổ cho sales, theo dõi và chuyển đổi thành deal.

US-001: Tạo Lead mới
Priority	P0 - Must Have
Persona	Sales / Marketing
Epic	Epic 1: Lead Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Sales Rep
I want to create a new lead with name, email, phone, source and campaign
So that every prospective customer is captured in the CRM for follow-up

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo lead đầy đủ	Sales đang ở Leads List	Nhập name, email, phone, source = 'Website', campaign, nhấn Create	Lead tạo với status = New, score = 0, assigned_at = null, hiển thị trong danh sách	✅
AC2	Thiếu trường bắt buộc	Đang tạo lead	Để trống Name và Email	Lỗi validation: 'Name và Email là bắt buộc'	✅
AC3	Auto-detect duplicate	Lead email 'abc@company.com' đã tồn tại	Tạo lead mới với cùng email	Cảnh báo: 'Lead trùng lặp phát hiện (email). Bạn muốn tiếp tục hay merge?'	✅
AC4	Lead từ nhiều nguồn	Lead đến từ Facebook Ads	Tạo lead với source = 'ads', campaign = 'FB Q1 2026'	Lead tạo thành công với source và campaign liên kết	✅
AC5	Lead không tạo deal	Lead mới tạo	Kiểm tra deals	Không có deal nào được tạo tự động - lead phải qua qualify trước	✅

UI Requirements:
•	Form: Name (required), Email (required), Phone, Company, Source (select: website/ads/referral/event), Campaign (select)
•	Button: Create Lead, Cancel
•	Duplicate warning modal

Technical Notes:
• POST /api/v1/crm/leads
• Duplicate detection: check email + phone trước khi insert
• Status default: New, score default: 0
• Link: campaign_id (optional)


US-002: Phát hiện Lead trùng lặp
Priority	P0 - Must Have
Persona	System
Epic	Epic 1: Lead Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As the System
I want to automatically detect duplicate leads by email and phone
So that the CRM database stays clean and sales reps don't waste time on duplicates

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Trùng email	Lead 'abc@corp.com' đã tồn tại	Tạo lead mới với email 'abc@corp.com'	Hiển thị cảnh báo trùng với link đến lead hiện có	⬜
AC2	Trùng phone	Lead phone '0901234567' đã tồn tại	Tạo lead với cùng phone	Cảnh báo trùng lặp hiển thị	⬜
AC3	Merge duplicates	2 leads trùng email phát hiện	Nhấn Merge	Hệ thống merge: giữ lead cũ, gộp data mới, lead trùng đánh dấu merged	⬜
AC4	Cho phép tạo nếu confirm	Duplicate cảnh báo hiển thị	Nhấn 'Tạo mới' (không merge)	Lead mới tạo thành công dù trùng (user quyết định)	⬜

UI Requirements:
•	Duplicate warning modal: hiển thị lead hiện có so sánh
•	Actions: Merge, Create Anyway, Cancel
•	Data Quality Report: duplicate count

Technical Notes:
• Duplicate check: LOWER(email) OR phone exact match
• Merge logic: preserve older lead, merge fields from newer
• Data quality scoring: deduct points for duplicates


US-003: Auto Scoring Lead
Priority	P0 - Must Have
Persona	System
Epic	Epic 1: Lead Management
Sprint	Sprint 2
Estimate	8 SP

User Story:
As the System
I want to automatically calculate lead scores based on interactions
So that sales reps can prioritize hot leads and focus on high-potential prospects

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Score từ activity	Lead mới, score = 0	Log activity: call (engaged) → +15 points	Lead score = 15, level = Cold	⬜
AC2	Score tích lũy	Lead score = 45	Lead request demo → +20 points	Score = 65, level tự động chuyển Cold → Hot	⬜
AC3	Score levels	Nhiều leads với scores khác nhau	Xem Lead List	Hiển thị badge: Cold (0-30), Warm (30-60), Hot (60+)	⬜
AC4	Score hiển thị trên detail	Lead với score = 72	Mở Lead Detail	Score bar hiển thị 72/100 với badge 'Hot'	⬜

UI Requirements:
•	Score bar trên Lead Detail (0-100)
•	Score level badges: Cold (blue), Warm (orange), Hot (red)
•	Score breakdown: hiển thị từng interaction đóng góp bao nhiêu points

Technical Notes:
• Auto-calculate: trigger khi activity tạo cho lead
• Scoring rules: email_open +5, click +10, form +15, call +15, demo +20
• Level thresholds: Cold 0-30, Warm 30-60, Hot 60+


US-004: Phân bổ Lead (Distribution)
Priority	P0 - Must Have
Persona	Sales Manager
Epic	Epic 1: Lead Management
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Sales Manager
I want leads to be automatically distributed to sales reps via round-robin
So that workload is balanced and every lead gets timely attention

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Round-robin tự động	3 sales reps: A, B, C. Lead mới đến	Hệ thống auto-distribute	Lead 1 → A, Lead 2 → B, Lead 3 → C, Lead 4 → A (round-robin)	⬜
AC2	Notification khi nhận lead	Lead được assign cho Sales A	Auto-distribute hoàn tất	Sales A nhận notification: 'Bạn có lead mới: [name]'	⬜
AC3	Manual distribute	Manager muốn gán lead cụ thể	Chọn lead → Assign to Sales B	Lead.owner_id = Sales B, assigned_at = now()	⬜
AC4	Response time tracking	Lead assigned 25 giờ trước, chưa contacted	Hệ thống check	Cảnh báo: 'Lead [name] chưa được liên hệ sau 24h'	⬜

UI Requirements:
•	Auto-distribute toggle trong Settings
•	Manual assign: user picker trên Lead Detail
•	Unassigned leads badge trên Dashboard

Technical Notes:
• POST /api/v1/crm/leads/distribute
• Round-robin: track last_assigned_index per workspace
• assigned_at timestamp, contacted_at tracking
• Alert: assigned_at > 24h AND contacted_at IS NULL


US-005: Qualify và Chuyển đổi Lead thành Deal
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 1: Lead Management
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Sales Rep
I want to qualify a lead and convert it into a deal
So that promising prospects enter the sales pipeline for active pursuit

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Qualify lead	Lead status = Contacted, đã đánh giá BANT	Nhấn Qualify	Lead status → Qualified	⬜
AC2	Convert to Deal	Lead status = Qualified	Nhấn Convert to Deal, nhập deal value = 500M VND, stage = Qualified Lead	Deal mới tạo với lead_id link, contact auto-created nếu chưa có, Lead status → Opportunity	⬜
AC3	Auto-create contact	Lead chưa có contact tương ứng	Convert to Deal	Contact tự động tạo từ lead info (name, email, phone, company)	⬜
AC4	Không convert lead chưa qualify	Lead status = New	Thử Convert to Deal	Lỗi: 'Chỉ lead Qualified mới có thể convert thành Deal'	⬜

UI Requirements:
•	Qualify button (status = Contacted)
•	Convert to Deal button (status = Qualified)
•	Convert dialog: Deal title, Value, Expected close date
•	Auto-create contact checkbox

Technical Notes:
• POST /api/v1/crm/leads/{id}/convert
• Create Deal + Contact (if not exists)
• Link: deal.lead_id = lead.id, deal.contact_id
• Status flow: Qualified → Opportunity (after convert)


US-006: Phát hiện Lead stale
Priority	P1 - Should Have
Persona	Sales Manager
Epic	Epic 1: Lead Management
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Sales Manager
I want to be alerted when leads have no activity for more than 30 days
So that stale leads are re-engaged or disqualified to keep the pipeline clean

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Stale detection	Lead last activity > 30 ngày trước	Hệ thống chạy daily check	Lead xuất hiện trong Stale Leads list, notification gửi đến owner	⬜
AC2	Stale leads API	Có 15 stale leads	GET /leads/stale	Trả về danh sách 15 leads với last_activity_date > 30 days	⬜
AC3	Disqualify stale lead	Lead stale > 60 ngày	Manager nhấn Disqualify	Lead status → Lost/Disqualified với lý do 'No response'	⬜

UI Requirements:
•	Stale Leads widget trên Dashboard
•	Visual indicator (amber badge) trên stale leads
•	Bulk disqualify action

Technical Notes:
• GET /api/v1/crm/leads/stale
• Check: last_activity_date IS NULL OR last_activity_date < NOW() - 30 days
• Background job: daily stale check + notification


US-007: Xem danh sách và chi tiết Lead
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 1: Lead Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Sales Rep
I want to view, search and filter my leads with full detail view
So that I can manage my lead pipeline efficiently and prioritize follow-ups

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Lead list	Sales có 30 leads assigned	Mở Leads List	Hiển thị: name, email, source, status, score, owner, campaign, created date	⬜
AC2	Filter & search	Lead list hiển thị	Filter status = Qualified, search 'Hotel'	Hiển thị chỉ leads Qualified có keyword 'Hotel'	⬜
AC3	Lead detail	Click vào lead 'ABC Corp'	Mở Lead Detail	Hiển thị tất cả thông tin + activity history + score breakdown	⬜
AC4	My Leads filter	Sales đang xem all leads	Toggle 'My Leads'	Chỉ hiển thị leads có owner_id = current user	⬜

UI Requirements:
•	Lead table: sortable columns, filters (status, source, owner, score level, campaign)
•	Lead Detail: info panel + activity timeline + score bar
•	Search bar, My Leads toggle

Technical Notes:
• GET /api/v1/crm/leads?status=&source=&owner_id=&score_min=&score_max=
• GET /api/v1/crm/leads/{id}
• Pagination, sorting


 
Epic 2: Deal Management
Quản lý pipeline bán hàng: tạo deal, theo dõi stages, xác suất chốt, closing workflow, phát hiện deal stale.

US-008: Tạo Deal mới
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 2: Deal Management
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Sales Rep
I want to create a new deal with title, value, stage, probability and expected close date
So that the opportunity is tracked in the pipeline for management and forecasting

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo deal đầy đủ	Sales ở Deals page	Nhập title, value = 300M VND, stage = Needs Analysis, probability = 0.3, expected_close_date, contact	Deal tạo thành công, hiển thị trên pipeline Kanban	⬜
AC2	Deal từ lead convert	Lead vừa convert	Deal auto-created	Deal có lead_id link, contact_id auto-filled, source lead hiển thị	⬜
AC3	Thiếu value	Đang tạo deal	Không nhập value	Cảnh báo governance: 'Deal nên có giá trị để dự báo doanh thu'	⬜
AC4	Thiếu expected close date	Đang tạo deal	Không nhập expected_close_date	Cảnh báo: 'Mọi deal phải có ngày dự kiến chốt'	⬜

UI Requirements:
•	Form: Title (required), Value (VND), Stage (select pipeline stages), Probability, Expected Close Date, Contact, Account
•	Pipeline stage selector
•	Value format: VND currency

Technical Notes:
• POST /api/v1/crm/deals
• Validation: title required
• Governance: warn if value = null or expected_close_date = null
• Link: contact_id, lead_id, account_id


US-009: Pipeline Kanban View
Priority	P0 - Must Have
Persona	Sales / Sales Manager
Epic	Epic 2: Deal Management
Sprint	Sprint 2
Estimate	8 SP

User Story:
As a Sales Manager
I want to view all deals on a Kanban board organized by pipeline stages
So that I can visualize the sales pipeline and identify bottlenecks at each stage

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Kanban hiển thị	Có 20 deals ở các stages khác nhau	Mở Deals Pipeline	Kanban board: 5 columns (Qualified Lead → Needs Analysis → Proposal → Negotiation → Closed Won), mỗi column hiển thị deals + tổng value	⬜
AC2	Drag-drop stages	Deal ở 'Needs Analysis'	Kéo sang 'Proposal'	Deal stage cập nhật, probability auto-adjust, last_activity_date = now	⬜
AC3	Stage value summary	Column Proposal có 5 deals	Xem column header	Hiển thị: 5 deals | Total: 2.5B VND | Weighted: 750M VND (probability * value)	⬜
AC4	Filter by owner	Manager xem pipeline	Filter owner = Sales A	Chỉ hiển thị deals của Sales A	⬜

UI Requirements:
•	Kanban board: 5+ columns theo pipeline stages
•	Deal cards: title, value, probability, contact, days in stage
•	Column headers: deal count + total value + weighted value
•	Filters: owner, value range, close date range

Technical Notes:
• GET /api/v1/crm/deals/pipeline
• Drag-drop: PUT /api/v1/crm/deals/{id} with stage update
• Weighted value = SUM(value * probability) per stage
• Auto-update probability khi stage thay đổi


US-010: Cập nhật Stage và Probability
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 2: Deal Management
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Sales Rep
I want to update deal stage and win probability as negotiations progress
So that the pipeline accurately reflects the current state of each opportunity

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Update stage	Deal ở Needs Analysis	Chuyển sang Proposal	Stage cập nhật, last_activity_date = now, activity log ghi nhận	⬜
AC2	Auto probability	Deal chuyển sang Negotiation	Stage update hoàn tất	Probability tự động gợi ý: Qualified=0.1, Needs Analysis=0.25, Proposal=0.5, Negotiation=0.75	⬜
AC3	Manual probability override	Probability tự động = 0.5	Sales override thành 0.7	Probability = 0.7, ghi nhận 'manual override'	⬜
AC4	Stage phải đi kèm activity	Deal chuyển stage	Không có activity trong 1 tuần	Governance alert: 'Deal [title] đã chuyển stage nhưng chưa có activity đi kèm'	⬜

UI Requirements:
•	Stage selector / Kanban drag-drop
•	Probability slider (0-100%)
•	Activity prompt khi chuyển stage

Technical Notes:
• PUT /api/v1/crm/deals/{id}
• Default probability per stage (configurable)
• Governance: check activity after stage change


US-011: Close Deal (Won / Lost)
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 2: Deal Management
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Sales Rep
I want to close a deal as Won or Lost with appropriate details
So that pipeline is accurate and lost deals provide learning data for improvement

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Close Won	Deal ở Negotiation, khách đồng ý	Nhấn Close Won, confirm value = 500M VND	Stage → Closed Won, probability = 1.0, closed_at = now, Account auto-created nếu chưa có	⬜
AC2	Auto-create Account	Close Won, chưa có Account cho contact	Deal closed won	Account tự động tạo từ contact company info, deal linked, total_revenue updated	⬜
AC3	Close Lost - bắt buộc lý do	Deal cần đóng lost	Nhấn Close Lost, không nhập lý do	Lỗi: 'Vui lòng chọn lý do mất deal'	⬜
AC4	Close Lost với lý do	Deal cần đóng lost	Chọn loss_reason = 'Giá cao', nhập notes	Stage → Closed Lost, probability = 0, loss_reason lưu, closed_at = now	⬜
AC5	Reopen deal	Deal đã Closed Lost	Manager nhấn Reopen	Deal status quay lại stage trước đó, closed_at = null	⬜

UI Requirements:
•	Close Won button: confirm final value
•	Close Lost dialog: loss_reason (required select: Giá/Đối thủ/Không phù hợp/Hoãn mua), notes
•	Reopen option cho Manager

Technical Notes:
• POST /api/v1/crm/deals/{id}/close
• Body: { result: 'won'|'lost', loss_reason, final_value }
• Auto-create Account on Won
• Update account.total_revenue += deal.value


US-012: Phát hiện Deal stale
Priority	P1 - Should Have
Persona	Sales Manager
Epic	Epic 2: Deal Management
Sprint	Sprint 4
Estimate	3 SP

User Story:
As a Sales Manager
I want to be alerted when deals have no activity for more than 60 days
So that stuck deals are either re-engaged or closed to maintain pipeline accuracy

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Stale deal detection	Deal last_activity_date > 60 ngày	Daily check	Deal xuất hiện trong Stale Deals list, notification gửi owner + manager	⬜
AC2	High-value stale alert	Deal value = 1B VND, stale > 30 ngày	Governance check	Priority alert: 'High-value deal [title] (1B VND) không có activity 30+ ngày'	⬜

UI Requirements:
•	Stale Deals widget trên Dashboard
•	Stale badge trên deal cards
•	Governance alerts panel

Technical Notes:
• GET /api/v1/crm/deals/stale
• Threshold: 60 days general, 30 days for high-value (> 500M)
• Background job: daily check


 
Epic 3: Contact Management
Quản lý danh bạ khách hàng, liên kết với Accounts, Deals và Activities. Cơ sở dữ liệu khách hàng duy nhất.

US-013: Tạo và quản lý Contact
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 3: Contact Management
Sprint	Sprint 1
Estimate	5 SP

User Story:
As a Sales Rep
I want to create and manage contacts with their organization and communication details
So that I have a reliable customer database for all sales and support interactions

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo contact	Sales ở Contacts List	Nhập name, email, phone, company, account (optional)	Contact tạo thành công, liên kết account nếu chọn	⬜
AC2	Edit contact	Contact tồn tại	Sửa phone number	Cập nhật thành công, updated_at = now	⬜
AC3	Link to account	Contact chưa gắn account	Chọn account 'ABC Corp'	Contact.account_id = ABC Corp ID, hiển thị trong Account 360	⬜
AC4	Search contacts	Database có 500 contacts	Search 'Nguyen'	Hiển thị tất cả contacts có tên chứa 'Nguyen'	⬜
AC5	Delete contact	Contact không có deal active	Nhấn Delete, confirm	Contact bị xóa (soft delete nếu có lịch sử)	⬜

UI Requirements:
•	Contact form: Name (required), Email, Phone, Company, Account (select)
•	Contacts List: searchable, filterable by account
•	Contact Detail: info + linked deals + activities

Technical Notes:
• CRUD: /api/v1/crm/contacts
• Link: account_id (optional)
• Search: name, email, phone, company


 
Epic 4: Account Management
Quản lý khách hàng tổ chức, Account 360 view, health score, follow-up tracking và doanh thu tổng hợp.

US-014: Tạo và quản lý Account
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 4: Account Management
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Sales Rep
I want to create and manage customer accounts with industry, revenue and status
So that organizational relationships are tracked and customer health is monitored

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo account	Sales ở Accounts page	Nhập name = 'ABC Corp', industry = 'Hospitality', website, address	Account tạo, status = Active, health_score = 50 (default)	⬜
AC2	Auto-create khi Close Won	Deal Closed Won, chưa có account	Deal closed	Account auto-created từ contact company info, source_deal_id = deal.id	⬜
AC3	Total revenue tự động	Account có 3 deals Won: 300M + 200M + 500M	Xem Account Detail	total_revenue = 1B VND (auto-aggregated)	⬜
AC4	Account list	Có 50 accounts	Mở Accounts List, filter status = Active	Hiển thị active accounts với name, industry, total_revenue, health_score	⬜

UI Requirements:
•	Account form: Name (required), Industry, Website, Address, Status
•	Accounts List: filterable by status, industry, revenue range
•	Total revenue auto-calculated

Technical Notes:
• CRUD: /api/v1/crm/accounts
• Auto-create on deal close won
• total_revenue = SUM(deals.value WHERE stage = 'Closed Won' AND account_id = id)


US-015: Account 360 View
Priority	P0 - Must Have
Persona	Sales / Sales Manager
Epic	Epic 4: Account Management
Sprint	Sprint 4
Estimate	8 SP

User Story:
As a Sales Rep
I want to see a comprehensive 360-degree view of each account
So that I understand the full customer relationship including contacts, deals, activities and support history

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	360 view hiển thị	Account 'ABC Corp' có 3 contacts, 5 deals, 20 activities, 2 tickets	Mở Account Detail → 360 View	Hiển thị tất cả: Contacts tab, Deals tab (won/lost/open), Activity timeline, Tickets tab, Revenue history	⬜
AC2	Health score	Account có 3 deals won, 1 open ticket, activity trong 7 ngày	Xem health score	Health score = 80 (High), dựa trên: revenue, activity frequency, open tickets	⬜
AC3	Activity timeline	Account có 20 activities	Mở Activities tab	Timeline chronological: calls, emails, meetings, demos với date, owner, notes	⬜
AC4	Revenue breakdown	Account có deals ở nhiều stages	Xem Revenue section	Hiển thị: Won Revenue, Pipeline Value, Weighted Pipeline	⬜

UI Requirements:
•	Account Detail page: Tabs (Overview, Contacts, Deals, Activities, Tickets)
•	Health score gauge (0-100) với color indicator
•	Revenue KPI cards
•	Activity timeline

Technical Notes:
• GET /api/v1/crm/accounts/{id}/360
• Aggregate: contacts, deals, activities, tickets
• Health score calculation: weighted formula (revenue 30%, activity recency 30%, ticket resolution 20%, deal pipeline 20%)


US-016: Follow-up Scheduling và Tracking
Priority	P1 - Should Have
Persona	Sales
Epic	Epic 4: Account Management
Sprint	Sprint 4
Estimate	3 SP

User Story:
As a Sales Rep
I want to schedule and track follow-ups for my accounts
So that no customer is neglected and retention activities happen on time

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Set follow-up date	Account 'ABC Corp' detail	Set next_follow_up_date = next week	Date saved, account hiển thị trong upcoming follow-ups	⬜
AC2	Overdue follow-ups	Follow-up date đã qua 3 ngày	Mở Dashboard / Follow-ups Due	Account hiển thị trong overdue list với red indicator	⬜
AC3	Follow-ups due API	Có 10 accounts cần follow-up hôm nay	GET /accounts/follow-ups	Trả về 10 accounts sorted by overdue first	⬜

UI Requirements:
•	Follow-up date picker trên Account Detail
•	Follow-ups Due widget trên Dashboard
•	Overdue indicator (red badge)

Technical Notes:
• GET /api/v1/crm/accounts/follow-ups?due_before=
• next_follow_up_date field on Account
• Governance alert: overdue follow-ups


 
Epic 5: Activity Tracking
Ghi nhận toàn bộ hoạt động sales: calls, emails, meetings, demos, follow-ups. Liên kết với leads, deals, contacts.

US-017: Tạo Activity (Log hoạt động sales)
Priority	P0 - Must Have
Persona	Sales
Epic	Epic 5: Activity Tracking
Sprint	Sprint 2
Estimate	5 SP

User Story:
As a Sales Rep
I want to log every sales activity (call, email, meeting, demo, follow-up) linked to a lead/deal/contact
So that all interactions are recorded and the team has full visibility into customer engagement

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Log call activity	Sales vừa gọi cho lead 'ABC'	Tạo activity: type = call, subject, notes, outcome = 'interested', next_action_date	Activity tạo, hiển thị trên lead timeline, lead score tự động cập nhật (+15)	⬜
AC2	Log meeting	Sales họp với deal contact	Tạo activity: type = meeting, link to deal + contact	Activity ghi nhận, deal.last_activity_date = now	⬜
AC3	Next action reminder	Activity có next_action_date = ngày mai	Ngày mai đến	Sales nhận reminder: 'Follow-up action cho [subject]'	⬜
AC4	Activity linked to multiple entities	Call liên quan deal + contact + lead	Tạo activity với deal_id + contact_id + lead_id	Activity hiển thị trên timeline của cả 3 entities	⬜
AC5	SOP: phải log activity	Sales chuyển deal stage	Không log activity trong 7 ngày	Governance alert: 'Deal [title] stage thay đổi nhưng không có activity log'	⬜

UI Requirements:
•	Activity form: Type (select: call/email/meeting/demo/follow_up), Subject, Notes, Outcome, Next Action Date
•	Link: Lead / Deal / Contact (multi-select)
•	Activity timeline trên entity detail pages

Technical Notes:
• POST /api/v1/crm/activities
• Links: lead_id, deal_id, contact_id (all optional, at least 1)
• Update: lead.score (if lead_id), deal.last_activity_date (if deal_id)
• Reminder: background job check next_action_date


US-018: Xem Activities List và Timeline
Priority	P0 - Must Have
Persona	Sales / Sales Manager
Epic	Epic 5: Activity Tracking
Sprint	Sprint 3
Estimate	3 SP

User Story:
As a Sales Manager
I want to view all sales activities in a timeline or list with filters
So that I can monitor team engagement levels and coaching opportunities

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Activities list	Có 100 activities	Mở Activities List, filter type = meeting, owner = Sales A	Hiển thị meetings của Sales A, sorted by date desc	⬜
AC2	Entity timeline	Deal 'ABC Hotel' có 15 activities	Mở Deal Detail → Activity tab	Timeline: 15 activities chronological với type icons, subject, outcome	⬜
AC3	Activity stats	Sales A có 30 activities tháng này	Xem sales activity report	Breakdown: 15 calls, 8 emails, 5 meetings, 2 demos	⬜

UI Requirements:
•	Activities List: table view with filters (type, owner, date range, entity)
•	Entity Activity Tab: timeline view
•	Activity type icons: phone, email, calendar, screen, follow-up

Technical Notes:
• GET /api/v1/crm/activities?type=&owner_id=&deal_id=&lead_id=&date_from=&date_to=
• Pagination, sorting by date


 
Epic 6: Campaign Management
Quản lý chiến dịch marketing: tạo, theo dõi ngân sách, đo lường hiệu quả lead generation và ROI.

US-019: Tạo và quản lý Campaign
Priority	P1 - Should Have
Persona	Marketing
Epic	Epic 6: Campaign Management
Sprint	Sprint 3
Estimate	5 SP

User Story:
As a Marketing Manager
I want to create and manage campaigns with budget, type and date range
So that marketing efforts are tracked and their effectiveness can be measured

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo campaign	Marketing ở Campaigns page	Nhập name = 'FB Q1 2026', type = ads, budget = 50M VND, start/end date	Campaign tạo, status = draft	⬜
AC2	Start campaign	Campaign status = draft	Nhấn Start	Status → running, leads bắt đầu được gắn campaign_id	⬜
AC3	Close campaign	Campaign đã chạy xong	Nhấn Close, nhập actual_cost = 45M VND	Status → closed, actual_cost ghi nhận	⬜
AC4	Campaign ROI	Campaign: budget 50M, actual 45M, 20 leads generated, 5 deals won = 500M	Xem Campaign Detail	ROI = (Revenue - Cost) / Cost = (500M - 45M) / 45M = 1011%	⬜

UI Requirements:
•	Campaign form: Name, Type (email/ads/event), Budget, Start/End Date
•	Campaign list: status, budget, leads count, deals won
•	ROI dashboard per campaign

Technical Notes:
• CRUD: /api/v1/crm/campaigns
• Status: draft → running → closed
• Aggregate: leads WHERE campaign_id, deals WHERE lead.campaign_id
• ROI calculation: revenue from won deals vs actual_cost


US-020: Campaign Performance & Lead Source Attribution
Priority	P1 - Should Have
Persona	Marketing / Sales Manager
Epic	Epic 6: Campaign Management
Sprint	Sprint 5
Estimate	5 SP

User Story:
As a Marketing Manager
I want to see campaign performance metrics including cost per lead, conversion rate and lead source attribution
So that I can optimize marketing spend and focus on high-performing channels

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Cost per Lead	Campaign generated 20 leads, actual_cost = 40M	Xem campaign metrics	Cost per Lead = 40M / 20 = 2M VND	⬜
AC2	Conversion rate	Campaign: 20 leads, 5 qualified, 3 deals won	Xem funnel	Lead → Qualified: 25%, Qualified → Won: 60%	⬜
AC3	Lead source report	Leads từ nhiều sources: website 40%, ads 35%, referral 25%	Mở Lead Source Report	Pie chart: lead count và conversion rate by source	⬜

UI Requirements:
•	Campaign detail: KPI cards (leads, cost per lead, conversion, ROI)
•	Lead source pie chart
•	Campaign comparison table

Technical Notes:
• Aggregate: leads.count, deals.count WHERE campaign_id
• Group by lead.source for attribution
• Cost per Lead = campaign.actual_cost / leads.count


 
Epic 7: Ticket Management (Customer Support)
Quản lý ticket hỗ trợ khách hàng: tạo, phân công, theo dõi trạng thái, giải quyết và đóng ticket.

US-021: Tạo Support Ticket
Priority	P0 - Must Have
Persona	Support / Sales
Epic	Epic 7: Ticket Management (Customer Support)
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Support Staff
I want to create a ticket linked to a contact and account when a customer reports an issue
So that every support request is formally tracked through resolution

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tạo ticket	Customer gọi báo lỗi	Tạo ticket: subject, description, priority = high, contact, account	Ticket tạo, status = open, gán assigned_to	⬜
AC2	Link contact + account	Ticket cho contact 'Mr. A' tại 'ABC Corp'	Chọn contact và account	Ticket liên kết cả contact_id và account_id, hiển thị trên Account 360	⬜
AC3	Auto-assign	Ticket tạo, support team có 3 staff	Auto-assign enabled	Ticket gán round-robin cho available support staff	⬜

UI Requirements:
•	Ticket form: Subject (required), Description, Priority (low/medium/high), Contact (search), Account (auto from contact)
•	Ticket list: filterable by status, priority, assigned_to

Technical Notes:
• POST /api/v1/crm/tickets
• Status: open → in_progress → resolved → closed
• Link: contact_id, account_id
• Round-robin assignment for support


US-022: Xử lý và đóng Ticket
Priority	P0 - Must Have
Persona	Support
Epic	Epic 7: Ticket Management (Customer Support)
Sprint	Sprint 4
Estimate	5 SP

User Story:
As a Support Staff
I want to update ticket status, record resolution notes and close the ticket
So that customers receive timely support and resolution history is documented

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Update in_progress	Ticket status = open	Bắt đầu xử lý, nhấn Start	Status → in_progress	⬜
AC2	Resolve ticket	Ticket đang xử lý	Nhập resolution_notes, nhấn Resolve	Status → resolved, resolved_at = now, ghi chú lưu	⬜
AC3	Close ticket	Ticket resolved, customer confirm	Nhấn Close	Status → closed, closed_at = now, account health score recalculated	⬜
AC4	Reopen ticket	Ticket closed nhưng vấn đề tái phát	Nhấn Reopen	Status → open, ghi nhận lần reopen	⬜
AC5	Impact account health	Account có 3 open tickets	Health score calculation	Health score giảm (open tickets = negative factor)	⬜

UI Requirements:
•	Status workflow buttons: Start → Resolve → Close
•	Resolution notes (textarea, required khi Resolve)
•	Ticket timeline: status changes + notes
•	Reopen button cho closed tickets

Technical Notes:
• PUT /api/v1/crm/tickets/{id}
• Status flow: open → in_progress → resolved → closed
• resolved_at, closed_at timestamps
• Recalculate account.health_score on ticket status change


US-023: Xem danh sách Tickets và Dashboard
Priority	P1 - Should Have
Persona	Support Manager
Epic	Epic 7: Ticket Management (Customer Support)
Sprint	Sprint 5
Estimate	3 SP

User Story:
As a Support Manager
I want to view all tickets with filters and support KPIs
So that I can monitor support workload, response times and customer satisfaction

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Tickets list	50 tickets trong hệ thống	Mở Tickets List	Hiển thị: ID, subject, priority, status, contact, account, assigned_to, created_at	⬜
AC2	Filter	Tickets list	Filter priority = high, status = open	Chỉ hiển thị urgent open tickets	⬜
AC3	Support KPIs	Tickets data tháng này	Xem Dashboard	KPI: Open tickets, Avg resolution time, Tickets by priority, Resolution rate	⬜

UI Requirements:
•	Tickets table: sortable, filterable (status, priority, assigned_to, account)
•	KPI cards: open count, avg resolution time, resolution rate
•	Priority distribution chart

Technical Notes:
• GET /api/v1/crm/tickets?status=&priority=&assigned_to=
• Avg resolution time: AVG(resolved_at - created_at)
• Resolution rate: resolved / total * 100


 
Epic 8: CRM Analytics & Reporting
Dashboard phân tích: doanh thu, win rate, pipeline value, sales funnel, lead source attribution, data quality.

US-024: CRM Dashboard - Sales KPIs
Priority	P0 - Must Have
Persona	Sales Manager
Epic	Epic 8: CRM Analytics & Reporting
Sprint	Sprint 4
Estimate	8 SP

User Story:
As a Sales Manager
I want a CRM dashboard showing key sales KPIs, pipeline summary and sales funnel
So that I can monitor team performance and make data-driven decisions

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	KPI cards	CRM có dữ liệu	Mở CRM Dashboard	KPI cards: Total Pipeline Value, Weighted Pipeline, Revenue This Month, Win Rate, Avg Deal Cycle, Active Deals	⬜
AC2	Sales funnel	Deals ở nhiều stages	Xem funnel chart	Funnel: Qualified(50) → Needs Analysis(30) → Proposal(15) → Negotiation(8) → Won(5), với conversion rates	⬜
AC3	Stage breakdown	Pipeline có deals	Xem stage chart	Bar chart: deal count và value by stage	⬜
AC4	Revenue by period	Deals won trong 6 tháng	Xem Revenue chart	Line/bar chart: monthly won revenue trend	⬜

UI Requirements:
•	KPI cards row
•	Sales funnel visualization
•	Pipeline stage bar chart (count + value)
•	Revenue trend chart (monthly)
•	Top deals table

Technical Notes:
• GET /api/v1/crm/analytics
• Aggregations: pipeline value, weighted value, win rate, avg cycle time
• Win rate = won / (won + lost) * 100
• Avg cycle = AVG(closed_at - created_at) for won deals


US-025: Deal Velocity Analytics
Priority	P1 - Should Have
Persona	Sales Manager
Epic	Epic 8: CRM Analytics & Reporting
Sprint	Sprint 5
Estimate	5 SP

User Story:
As a Sales Manager
I want to analyze deal velocity (time spent in each stage)
So that I can identify pipeline bottlenecks and optimize the sales process

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Time in stage	Deals có stage history	Xem velocity report	Hiển thị avg days per stage: Qualified(5d) → Needs Analysis(12d) → Proposal(8d) → Negotiation(15d)	⬜
AC2	Bottleneck detection	Proposal stage avg 20 days (highest)	Xem report	Proposal highlighted as bottleneck	⬜
AC3	Velocity by owner	Nhiều sales reps	Filter by owner	So sánh velocity giữa các sales reps	⬜

UI Requirements:
•	Stage velocity bar chart
•	Bottleneck highlight
•	Owner comparison table

Technical Notes:
• Calculate: AVG time per stage from deal history
• Stage change timestamps tracking
• Group by owner for comparison


 
Epic 9: Data Quality & Governance
Đảm bảo chất lượng dữ liệu CRM: phát hiện trùng lặp, thiếu thông tin, stale records, governance alerts.

US-026: Data Quality Report
Priority	P1 - Should Have
Persona	Admin / Sales Manager
Epic	Epic 9: Data Quality & Governance
Sprint	Sprint 5
Estimate	5 SP

User Story:
As an Admin
I want a data quality report showing duplicates, missing fields and stale records
So that I can maintain high data integrity and CRM effectiveness

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Quality score	CRM workspace có 500 leads, 200 deals	Mở Data Quality Report	Overall quality score: 85/100, breakdown per entity type	⬜
AC2	Duplicate report	15 duplicate leads (same email)	Xem duplicates section	Hiển thị 15 pairs trùng lặp với merge action	⬜
AC3	Missing fields	30 leads thiếu phone, 10 deals thiếu value	Xem missing data section	List leads/deals thiếu data quan trọng	⬜
AC4	Stale records	20 leads không activity > 90 ngày	Xem stale section	List 20 stale records với last activity date	⬜

UI Requirements:
•	Quality score gauge (0-100)
•	Sections: Duplicates, Missing Fields, Stale Records
•	Action buttons: Merge, Bulk Update, Disqualify

Technical Notes:
• GET /api/v1/crm/data-quality/report
• Score: 100 - (duplicate_penalty + missing_penalty + stale_penalty)
• Duplicate: match on LOWER(email) or phone
• Stale: no update > 90 days


US-027: Governance Alerts
Priority	P1 - Should Have
Persona	Sales Manager
Epic	Epic 9: Data Quality & Governance
Sprint	Sprint 5
Estimate	5 SP

User Story:
As a Sales Manager
I want governance alerts for overdue follow-ups, unassigned leads, stale deals and missing deal values
So that CRM discipline is enforced and no opportunities fall through the cracks

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Overdue follow-ups	5 accounts quá hạn follow-up	Mở Governance Alerts	Alert: '5 accounts quá hạn follow-up' với list	⬜
AC2	Unassigned leads	10 leads chưa có owner	Check governance	Alert: '10 leads chưa được phân bổ'	⬜
AC3	Stale deals	8 deals > 60 ngày không activity	Check governance	Alert: '8 deals stale, tổng value 2B VND'	⬜
AC4	Missing deal values	15 deals chưa có value	Check governance	Alert: '15 deals chưa nhập giá trị'	⬜
AC5	High-value no activity	Deal 1B VND, 15 ngày không activity	Check governance	Priority alert: 'High-value deal cần attention'	⬜

UI Requirements:
•	Governance Alerts panel trên Dashboard
•	Alert categories với counts
•	Drill-down: click alert → view affected records

Technical Notes:
• GET /api/v1/crm/governance/alerts
• Rules engine: configurable thresholds
• Categories: overdue_followups, unassigned_leads, stale_deals, missing_values, high_value_inactive


 
Epic 10: RBAC & System Configuration
Phân quyền theo role, cấu hình pipeline stages, lead scoring rules, và system settings.

US-028: Phân quyền CRM theo Role
Priority	P0 - Must Have
Persona	Admin
Epic	Epic 10: RBAC & System Configuration
Sprint	Sprint 1
Estimate	8 SP

User Story:
As an Admin
I want role-based access control for all CRM functions
So that each team member can only access and perform actions appropriate to their role

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Sales CRUD leads + deals	User role = Sales	Tạo lead, tạo deal, log activity	Tất cả thành công	⬜
AC2	Marketing quản lý campaigns	User role = Marketing	Tạo campaign, xem lead source report	Thành công	⬜
AC3	Support quản lý tickets	User role = Support	Tạo ticket, resolve ticket	Thành công	⬜
AC4	Sales Manager xem tất cả	User role = Sales Manager	Xem all deals, all leads, pipeline, analytics	Full view access cho toàn workspace	⬜
AC5	Marketing không chỉnh deal	User role = Marketing	Thử edit deal stage	403 Forbidden	⬜

UI Requirements:
•	Permission-based UI: ẩn menu/buttons không có quyền
•	Role indicator trên profile

Technical Notes:
• RBAC middleware mọi endpoint
• Roles: Admin, Sales Manager, Sales, Marketing, Support
• Permission matrix per role per entity per action


US-029: Cấu hình Pipeline Stages
Priority	P2 - Nice to Have
Persona	Admin
Epic	Epic 10: RBAC & System Configuration
Sprint	Sprint 6
Estimate	3 SP

User Story:
As an Admin
I want to customize pipeline stages and default probabilities
So that the CRM pipeline matches our specific sales process

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Edit stage names	Default 5 stages	Đổi tên 'Needs Analysis' → 'Discovery'	Stage name cập nhật trên toàn hệ thống	⬜
AC2	Add stage	5 stages hiện có	Thêm stage 'Technical Review' giữa Proposal và Negotiation	Stage mới xuất hiện trên pipeline Kanban	⬜
AC3	Default probability	Stage 'Proposal' probability = 0.5	Đổi default = 0.6	Deals mới vào Proposal có probability = 0.6 (existing không thay đổi)	⬜

UI Requirements:
•	Pipeline settings: drag to reorder stages
•	Stage name edit, probability edit
•	Add/Remove stage

Technical Notes:
• Pipeline config stored per workspace
• Stage: name, position, default_probability
• Apply to new deals only (not retroactive)


US-030: Cấu hình Lead Scoring Rules
Priority	P2 - Nice to Have
Persona	Admin / Marketing
Epic	Epic 10: RBAC & System Configuration
Sprint	Sprint 6
Estimate	3 SP

User Story:
As an Admin
I want to configure lead scoring rules and thresholds
So that lead scores reflect our specific qualification criteria

Acceptance Criteria:
#	Scenario	Given	When	Then	Status
AC1	Edit scoring rules	Default: call = +15	Đổi call = +20	Từ giờ trở đi, mỗi call activity cho lead sẽ cộng 20 points	⬜
AC2	Edit thresholds	Cold: 0-30, Warm: 30-60, Hot: 60+	Đổi Hot threshold = 70+	Leads score 60-69 giờ là Warm thay vì Hot	⬜
AC3	Add custom rule	Không có rule cho 'site visit'	Thêm rule: site_visit = +25	Activity type site_visit cộng 25 points khi log	⬜

UI Requirements:
•	Scoring rules table: activity type, points
•	Threshold config: Cold/Warm/Hot ranges
•	Add custom rule form

Technical Notes:
• Scoring config stored per workspace
• Rules: { activity_type: points }
• Thresholds: { cold_max, warm_max }
• Re-scoring: apply to future activities only


 
Tài liệu liên quan
•	PRD – CRM System (Customer Relationship Management)
•	SOP – CRM Standard Operating Procedures (14 SOPs)
•	Data Model – 7 Core Entities: Contact, Lead, Deal, Account, Activity, Campaign, Ticket
•	API Specs – RESTful endpoints per entity + analytics
•	PMS PRD – Hệ thống Quản lý Dự án (tích hợp)

Lead Scoring Reference
Activity Type	Points	Level Thresholds
Email Open	+5	Cold: 0–30
Link Click	+10	Warm: 30–60
Form Submission	+15	Hot: 60+
Call Engagement	+15	
Demo Request	+20	

Pipeline Stages Reference
Stage	Default Probability	Description
Qualified Lead	10%	Lead đã qualify, bắt đầu tìm hiểu
Needs Analysis	25%	Phân tích nhu cầu khách hàng
Proposal	50%	Gửi đề xuất / báo giá
Negotiation	75%	Đàm phán điều khoản
Closed Won	100%	Chốt deal thành công
Closed Lost	0%	Mất deal (ghi lý do)

Mỗi User Story được hoàn thành phải có tất cả Acceptance Criteria pass.
