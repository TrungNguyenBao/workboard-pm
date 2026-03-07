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

---

# 2. Stakeholders

| Role          | Description             |
| ------------- | ----------------------- |
| Sales         | Quản lý và chốt deal    |
| Marketing     | Tạo lead và campaign    |
| Sales Manager | Quản lý pipeline và KPI |
| Support       | Chăm sóc khách hàng     |
| Admin         | Quản trị hệ thống       |

---

# 3. System Scope

## In Scope

* Lead management
* Opportunity management
* Sales pipeline
* Activity tracking
* Customer management
* Campaign management
* Reporting & analytics

## Out of Scope

* Accounting
* Advanced marketing automation
* Full helpdesk system

---

# 4. Core Modules

## 4.1 Lead Management

### Description

Quản lý khách hàng tiềm năng từ nhiều nguồn marketing.

### Lead Data Fields

| Field      | Description     |
| ---------- | --------------- |
| id         | Lead ID         |
| name       | Tên khách       |
| phone      | Số điện thoại   |
| email      | Email           |
| source     | Nguồn lead      |
| campaign   | Chiến dịch      |
| owner      | Sales phụ trách |
| status     | Trạng thái      |
| created_at | Ngày tạo        |

### Lead Status Flow

```
New Lead
Contacted
Qualified
Opportunity
Lost / Disqualified
```

### Lead Process

1. Lead được tạo từ website / ads / form / manual
2. Hệ thống lưu lead vào CRM
3. Lead được phân bổ cho sales
4. Sales liên hệ khách
5. Sales đánh giá và qualify lead

---

# 5. Lead Distribution

### Distribution Strategies

| Strategy      | Description      |
| ------------- | ---------------- |
| Round Robin   | Chia đều lead    |
| Territory     | Theo khu vực     |
| Product-based | Theo sản phẩm    |
| Priority      | Theo level sales |

### Automation

* Auto assign lead
* Notification cho sales

---

# 6. Lead Scoring

### Purpose

Xác định mức độ tiềm năng của lead.

### Example Scoring

| Action       | Score |
| ------------ | ----- |
| Open email   | +5    |
| Click link   | +10   |
| Submit form  | +15   |
| Request demo | +20   |

### Score Levels

| Score | Level |
| ----- | ----- |
| 0-20  | Cold  |
| 20-50 | Warm  |
| 50+   | Hot   |

---

# 7. Opportunity Management

### Description

Opportunity đại diện cho một cơ hội bán hàng.

### Opportunity Fields

| Field               | Description    |
| ------------------- | -------------- |
| id                  | Opportunity ID |
| name                | Tên deal       |
| account             | Khách hàng     |
| value               | Giá trị deal   |
| stage               | Giai đoạn      |
| probability         | Xác suất       |
| owner               | Sales          |
| expected_close_date | Ngày dự kiến   |

### Pipeline Stages

```
Qualified Lead
Needs Analysis
Proposal
Negotiation
Closed Won
Closed Lost
```

---

# 8. Sales Activity Management

### Activity Types

* Call
* Email
* Meeting
* Demo
* Follow-up

### Activity Fields

| Field    | Description    |
| -------- | -------------- |
| id       | Activity ID    |
| type     | Loại hoạt động |
| customer | Khách hàng     |
| owner    | Sales          |
| date     | Thời gian      |
| notes    | Nội dung       |

### Customer Timeline

```
Lead created
Call
Meeting
Demo
Proposal
Deal closed
```

---

# 9. Customer Management

### Description

Sau khi deal thắng, lead chuyển thành customer.

### Customer Fields

| Field         | Description       |
| ------------- | ----------------- |
| id            | Customer ID       |
| name          | Tên khách         |
| industry      | Ngành             |
| contacts      | Danh sách liên hệ |
| total_revenue | Tổng doanh thu    |
| status        | Active / Inactive |

### Customer 360 View

* profile
* purchase history
* contracts
* activities
* support tickets

---

# 10. Campaign Management

### Description

Marketing tạo và quản lý chiến dịch.

### Campaign Fields

| Field      | Description   |
| ---------- | ------------- |
| id         | Campaign ID   |
| name       | Tên campaign  |
| budget     | Ngân sách     |
| start_date | Ngày bắt đầu  |
| end_date   | Ngày kết thúc |

### Campaign Flow

```
Create campaign
Run ads/email
Generate leads
Track conversion
```

---

# 11. Customer Support

### Ticket Flow

```
Customer issue
Ticket created
Assigned support
Resolved
Closed
```

### Ticket Fields

| Field    | Description |
| -------- | ----------- |
| id       | Ticket ID   |
| customer | Khách hàng  |
| issue    | Nội dung    |
| priority | Mức độ      |
| status   | Trạng thái  |

---

# 12. Reporting & Analytics

### Sales Reports

* Revenue by period
* Win rate
* Pipeline value

### Marketing Reports

* Lead source
* Campaign ROI

### Customer Reports

* Retention rate
* Churn rate

---

# 13. CRM End-to-End Workflow

```
Marketing Campaign
↓
Lead Generated
↓
Lead Distribution
↓
Lead Qualification
↓
Opportunity Created
↓
Sales Activities
↓
Deal Won
↓
Customer Created
↓
Customer Support
↓
Upsell / Cross-sell
```

---

# 14. Automation

Supported automations:

* Lead routing
* Follow-up reminder
* Email automation
* Deal stage automation

---

# 15. Key CRM KPIs

| KPI                  | Meaning          |
| -------------------- | ---------------- |
| Lead conversion rate | Tỷ lệ chuyển đổi |
| Sales cycle length   | Thời gian bán    |
| Win rate             | Tỷ lệ chốt       |
| CAC                  | Chi phí khách    |
| LTV                  | Giá trị vòng đời |

---

# 16. Data Model

Main tables:

```
leads
accounts
contacts
opportunities
activities
campaigns
tickets
```

### Relationships

```
Account
 ├ Contacts
 ├ Opportunities
 ├ Activities
 └ Tickets
```

---

# 17. Future Enhancements

* AI Lead scoring
* Sales AI assistant
* Predictive revenue forecasting
* Automated customer insights

---

# 18. Success Metrics

| Metric              | Target |
| ------------------- | ------ |
| Lead conversion     | +20%   |
| Sales productivity  | +30%   |
| Pipeline visibility | 100%   |
| Customer retention  | +15%   |

---


---

# End of Document
