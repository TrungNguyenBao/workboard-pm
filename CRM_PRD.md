# PRD – CRM System (Customer Relationship Management)

## 1. Product Overview

### 1.1 Product Name

CRM Module – Enterprise Resource Platform

### 1.2 Purpose

Xây dựng hệ thống CRM nhằm quản lý toàn bộ vòng đời khách hàng từ giai đoạn marketing, lead, cơ hội bán hàng đến chăm sóc sau bán hàng.

### 1.3 Objectives

* Chuẩn hóa quy trình bán hàng
* Tăng tỷ lệ chuyển đổi Lead → Customer
* Quản lý pipeline doanh thu
* Theo dõi hoạt động sales
* Tăng giá trị vòng đời khách hàng (LTV)

### 1.4 Implementation Status

**FULLY IMPLEMENTED** - All core features and data models are production-ready.

---

# 2. Stakeholders

| Role           | Description               |
| -------------- | ------------------------- |
| Sales          | Quản lý và chốt deal      |
| Marketing      | Tạo lead và campaign      |
| Sales Manager  | Quản lý pipeline và KPI   |
| Support        | Chăm sóc khách hàng       |
| Admin          | Quản trị hệ thống         |

---

# 3. System Scope

## In Scope

* Lead management (CRUD, duplicate detection, auto-scoring, distribution)
* Deal management (pipeline, stage tracking, closing workflows)
* Contact management (customer database, 360 view)
* Account management (customer organization, health scores)
* Activity tracking (calls, emails, meetings, demos, follow-ups)
* Campaign management (creation, budget tracking, lead source)
* Ticket management (customer support, issue tracking)
* CRM analytics & reporting
* Data quality monitoring
* Governance alerts

## Out of Scope

* Accounting integration
* Advanced marketing automation
* Email deliverability system
* Phone integration with PBX

---

# 4. Core Data Models

## 4.1 Contact

**Description**: Individual contacts associated with accounts.

| Field        | Type      | Description           |
| ------------ | --------- | --------------------- |
| id           | UUID      | Contact ID            |
| name         | String    | Tên liên hệ           |
| email        | String    | Email                 |
| phone        | String    | Số điện thoại         |
| company      | String    | Công ty               |
| account_id   | UUID      | Account association   |
| workspace_id | UUID      | Workspace ID          |
| created_at   | DateTime  | Ngày tạo              |
| updated_at   | DateTime  | Ngày cập nhật         |

---

## 4.2 Lead

**Description**: Prospective customers from marketing sources.

| Field       | Type      | Description                           |
| ----------- | --------- | ------------------------------------- |
| id          | UUID      | Lead ID                               |
| name        | String    | Tên khách hàng                        |
| email       | String    | Email                                 |
| phone       | String    | Số điện thoại                         |
| source      | Enum      | Nguồn lead (website, ads, referral)   |
| status      | Enum      | New, Contacted, Qualified, Lost       |
| score       | Integer   | Lead score (auto-calculated, 0-100)   |
| contacted_at | DateTime | Thời gian liên hệ đầu tiên            |
| assigned_at | DateTime | Thời gian gán cho sales               |
| owner_id    | UUID      | Sales phụ trách                       |
| campaign_id | UUID      | Chiến dịch liên quan                  |
| workspace_id| UUID      | Workspace ID                          |
| created_at  | DateTime  | Ngày tạo                              |
| updated_at  | DateTime  | Ngày cập nhật                         |

### Lead Status Flow

```
New → Contacted → Qualified → Opportunity → Lost/Disqualified
```

### Lead Features

* **Duplicate Detection**: Automatic duplicate lead detection
* **Auto Scoring**: Lead score calculated based on interactions
* **Lead Distribution**: Round-robin assignment to sales team
* **Conversion**: Convert to deal when qualified
* **Stale Detection**: Alert on no activity > 30 days

---

## 4.3 Deal

**Description**: Sales opportunities in pipeline.

| Field              | Type      | Description                        |
| ------------------ | --------- | ---------------------------------- |
| id                 | UUID      | Deal ID                            |
| title              | String    | Tên deal                           |
| value              | Float     | Giá trị deal (VND)                 |
| stage              | Enum      | Pipeline stage (see below)         |
| probability        | Float     | Xác suất chốt (0.0 - 1.0)          |
| expected_close_date| DateTime  | Ngày dự kiến chốt                  |
| loss_reason        | String    | Lý do mất deal (if closed lost)    |
| closed_at          | DateTime  | Ngày chốt deal                     |
| last_activity_date | DateTime  | Thời gian hoạt động gần nhất       |
| owner_id           | UUID      | Sales owner                        |
| last_updated_by    | UUID      | Người cập nhật cuối                |
| contact_id         | UUID      | Contact association               |
| lead_id            | UUID      | Source lead (if converted)        |
| account_id         | UUID      | Account association               |
| workspace_id       | UUID      | Workspace ID                       |
| created_at         | DateTime  | Ngày tạo                           |
| updated_at         | DateTime  | Ngày cập nhật                      |

### Pipeline Stages

```
Qualified Lead → Needs Analysis → Proposal → Negotiation → Closed Won / Closed Lost
```

### Deal Features

* **Stage Tracking**: Move through pipeline stages
* **Probability Management**: Update win probability
* **Closing Workflow**: Record loss reason and close deal
* **Stale Detection**: Alert on no activity > 60 days
* **Activity History**: All activities on deal tracked

---

## 4.4 Account

**Description**: Customer organizations.

| Field               | Type      | Description                  |
| ------------------- | --------- | ---------------------------- |
| id                  | UUID      | Account ID                   |
| name                | String    | Tên khách hàng               |
| industry            | String    | Ngành kinh doanh             |
| total_revenue       | Float     | Tổng doanh thu (VND)         |
| status              | Enum      | Active, Inactive             |
| website             | String    | Website                      |
| address             | String    | Địa chỉ                      |
| source_deal_id      | UUID      | Original deal that created   |
| next_follow_up_date | DateTime  | Ngày follow-up tiếp theo     |
| health_score        | Integer   | Account health (0-100)       |
| workspace_id        | UUID      | Workspace ID                 |
| created_at          | DateTime  | Ngày tạo                     |
| updated_at          | DateTime  | Ngày cập nhật                |

### Account 360 View

Account detail page includes:
* Contacts associated with account
* All deals (won, lost, open)
* Activity timeline (calls, emails, meetings)
* Support tickets
* Contracts and revenue history

---

## 4.5 Activity

**Description**: Sales interactions tracked across leads, deals, contacts, accounts.

| Field            | Type      | Description                           |
| ---------------- | --------- | ------------------------------------- |
| id               | UUID      | Activity ID                           |
| type             | Enum      | call, email, meeting, demo, follow_up |
| subject          | String    | Tiêu đề hoạt động                     |
| notes            | Text      | Nội dung chi tiết                     |
| date             | DateTime  | Thời gian hoạt động                   |
| outcome          | String    | Kết quả (e.g., interested, not ready) |
| next_action_date | DateTime  | Thời gian hành động tiếp theo         |
| owner_id         | UUID      | Sales owner                           |
| contact_id       | UUID      | Contact (optional)                    |
| deal_id          | UUID      | Deal (optional)                       |
| lead_id          | UUID      | Lead (optional)                       |
| workspace_id     | UUID      | Workspace ID                          |
| created_at       | DateTime  | Ngày tạo                              |
| updated_at       | DateTime  | Ngày cập nhật                         |

---

## 4.6 Campaign

**Description**: Marketing campaigns that generate leads.

| Field        | Type      | Description            |
| ------------ | --------- | ---------------------- |
| id           | UUID      | Campaign ID            |
| name         | String    | Tên campaign           |
| type         | Enum      | email, ads, event      |
| budget       | Float     | Ngân sách (VND)        |
| actual_cost  | Float     | Chi phí thực tế (VND)  |
| start_date   | DateTime  | Ngày bắt đầu           |
| end_date     | DateTime  | Ngày kết thúc          |
| status       | Enum      | draft, running, closed |
| workspace_id | UUID      | Workspace ID           |
| created_at   | DateTime  | Ngày tạo               |
| updated_at   | DateTime  | Ngày cập nhật          |

---

## 4.7 Ticket

**Description**: Customer support tickets.

| Field        | Type      | Description           |
| ------------ | --------- | --------------------- |
| id           | UUID      | Ticket ID             |
| subject      | String    | Tiêu đề vấn đề        |
| description  | Text      | Mô tả chi tiết        |
| priority     | Enum      | low, medium, high     |
| status       | Enum      | open, in progress     |
| resolved_at  | DateTime  | Ngày giải quyết       |
| closed_at    | DateTime  | Ngày đóng ticket      |
| resolution_notes | Text  | Ghi chú giải pháp     |
| contact_id   | UUID      | Contact association   |
| account_id   | UUID      | Account association   |
| assigned_to  | UUID      | Support staff         |
| workspace_id | UUID      | Workspace ID          |
| created_at   | DateTime  | Ngày tạo              |
| updated_at   | DateTime  | Ngày cập nhật         |

---

# 5. API Endpoints

## Lead Management

```
GET    /api/v1/crm/leads                    # List leads
POST   /api/v1/crm/leads                    # Create lead
GET    /api/v1/crm/leads/{id}               # Get lead detail
PUT    /api/v1/crm/leads/{id}               # Update lead
DELETE /api/v1/crm/leads/{id}               # Delete lead
POST   /api/v1/crm/leads/{id}/convert       # Convert to deal
POST   /api/v1/crm/leads/distribute         # Auto-assign leads
GET    /api/v1/crm/leads/stale              # Get stale leads
```

## Deal Management

```
GET    /api/v1/crm/deals                    # List deals
POST   /api/v1/crm/deals                    # Create deal
GET    /api/v1/crm/deals/{id}               # Get deal detail
PUT    /api/v1/crm/deals/{id}               # Update deal
DELETE /api/v1/crm/deals/{id}               # Delete deal
POST   /api/v1/crm/deals/{id}/close         # Close deal (won/lost)
GET    /api/v1/crm/deals/stale              # Get stale deals
GET    /api/v1/crm/deals/pipeline           # Pipeline summary
```

## Contact Management

```
GET    /api/v1/crm/contacts                 # List contacts
POST   /api/v1/crm/contacts                 # Create contact
GET    /api/v1/crm/contacts/{id}            # Get contact detail
PUT    /api/v1/crm/contacts/{id}            # Update contact
DELETE /api/v1/crm/contacts/{id}            # Delete contact
```

## Account Management

```
GET    /api/v1/crm/accounts                 # List accounts
POST   /api/v1/crm/accounts                 # Create account
GET    /api/v1/crm/accounts/{id}            # Get account detail
PUT    /api/v1/crm/accounts/{id}            # Update account
DELETE /api/v1/crm/accounts/{id}            # Delete account
GET    /api/v1/crm/accounts/{id}/360        # Account 360 view
GET    /api/v1/crm/accounts/follow-ups      # Get follow-ups due
```

## Activity Management

```
GET    /api/v1/crm/activities               # List activities
POST   /api/v1/crm/activities               # Create activity
GET    /api/v1/crm/activities/{id}          # Get activity detail
PUT    /api/v1/crm/activities/{id}          # Update activity
DELETE /api/v1/crm/activities/{id}          # Delete activity
```

## Campaign Management

```
GET    /api/v1/crm/campaigns                # List campaigns
POST   /api/v1/crm/campaigns                # Create campaign
GET    /api/v1/crm/campaigns/{id}           # Get campaign detail
PUT    /api/v1/crm/campaigns/{id}           # Update campaign
DELETE /api/v1/crm/campaigns/{id}           # Delete campaign
```

## Ticket Management

```
GET    /api/v1/crm/tickets                  # List tickets
POST   /api/v1/crm/tickets                  # Create ticket
GET    /api/v1/crm/tickets/{id}             # Get ticket detail
PUT    /api/v1/crm/tickets/{id}             # Update ticket
DELETE /api/v1/crm/tickets/{id}             # Delete ticket
```

## Analytics & Reporting

```
GET    /api/v1/crm/analytics                # Dashboard metrics
GET    /api/v1/crm/data-quality/report      # Data quality report
GET    /api/v1/crm/governance/alerts        # Governance alerts
```

---

# 6. Frontend Pages

| Page                | Purpose                                    |
| ------------------- | ------------------------------------------ |
| CRM Dashboard       | KPI cards, stage breakdown, sales funnel   |
| Contacts List       | Search, create, edit, delete contacts      |
| Deals Pipeline      | Kanban view of deals by stage              |
| Deals List          | Tabular view with filters                  |
| Leads List          | Lead status, source, owner filters         |
| Accounts List       | Account status filtering                   |
| Account Detail      | 360 view with contacts, deals, activities  |
| Activities List     | Timeline of all activities                 |
| Campaigns List      | Campaign status and ROI tracking           |
| Tickets List        | Priority and status filtering              |

---

# 7. Lead Scoring & Distribution

## Lead Scoring

Automatic scoring based on:
* Email opens: +5 points
* Link clicks: +10 points
* Form submissions: +15 points
* Demo requests: +20 points
* Call engagement: +15 points

Score levels:
* 0-30: Cold
* 30-60: Warm
* 60+: Hot

## Lead Distribution

**Strategy**: Round-robin to available sales team members

Prevents:
* Overloading single sales rep
* Lead queue buildup
* Unfair workload distribution

---

# 8. Key Features

## Lead Management

* Automatic duplicate detection (email + phone)
* Lead scoring system (auto-calculated)
* Lead distribution (round-robin)
* Conversion to deal workflow
* Stale lead alerts (30+ days no activity)

## Deal Management

* Pipeline visualization (Kanban by stage)
* Probability tracking
* Deal closing with loss reason capture
* Stale deal detection (60+ days)
* Deal velocity analytics

## Customer 360

* All contacts at account
* All deals (won, lost, open)
* Full activity timeline
* Support tickets
* Health score indicator

## Analytics & Reporting

* Revenue by period
* Deal win rate
* Pipeline value by stage
* Lead source attribution
* Sales funnel metrics
* Data quality scoring
* Governance alerts (missing fields, overdue activities)

---

# 9. Data Quality & Governance

## Data Quality Report

Tracks:
* Duplicate leads/contacts
* Missing email/phone
* Incomplete deal information
* Stale records (no update > 90 days)
* Quality score by workspace

## Governance Alerts

* Overdue follow-ups
* Stale leads/deals
* Missing deal values
* Unassigned leads
* High-value deals with no activity

---

# 10. Future Enhancements

* AI Lead scoring (ML-based)
* Sales AI assistant (recommendations, forecasting)
* Predictive revenue forecasting (deal probability)
* Automated customer insights (churn prediction)
* Email integration (calendar sync, email logging)
* Phone system integration
* Advanced workflow automation

---

# 11. Success Metrics

| Metric              | Target |
| ------------------- | ------ |
| Lead conversion     | +20%   |
| Sales productivity  | +30%   |
| Pipeline visibility | 100%   |
| Customer retention  | +15%   |
| Data quality score  | >90%   |

---

# End of Document
