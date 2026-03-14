---
phase: 4
title: "P1 New Models — CrmCustomField, EmailTemplate, EmailLog, Competitor"
sprint: Sprint 4
priority: P1
effort: 8h
status: pending
user_stories: [US-026, US-015, US-006]
gaps_addressed: [M5, M6, M9]
dependencies: [phase-01]
---

# Phase 4: P1 New Models

## Context
- US-026: Custom Fields per Entity (MISSING 0/5)
- US-015: Email Templates & Tracking (MISSING 0/6)
- US-006 AC5: Competitor tracking per deal (MISSING)

---

## Model 1: CrmCustomField (US-026)

```python
__tablename__ = "crm_custom_fields"
id: UUID PK
entity_type: str(30)  # lead | deal | account | contact
field_name: str(100)
field_label: str(255)
field_type: str(20)  # text | number | date | select | multi_select
options: JSONB, nullable  # for select types: ["Enterprise","SMB"]
is_required: bool, default=False
position: int, default=0
workspace_id: UUID FK
# Unique: (workspace_id, entity_type, field_name)
```

**Value storage:** Add `custom_field_values: JSONB` column to Lead, Deal, Account, Contact models.
Structure: `{"field_id_as_str": value}`. No separate values table — keeps schema simple.

**Endpoints:**
| Method | Path | RBAC |
|--------|------|------|
| POST | `/crm/workspaces/{wid}/custom-fields` | admin |
| GET | `/crm/workspaces/{wid}/custom-fields?entity_type=lead` | guest+ |
| PATCH | `/crm/workspaces/{wid}/custom-fields/{cfid}` | admin |
| DELETE | `/crm/workspaces/{wid}/custom-fields/{cfid}` | admin |

---

## Model 2: EmailTemplate (US-015)

```python
__tablename__ = "crm_email_templates"
id: UUID PK
name: str(255)
subject: str(500)
body_html: text
category: str(30)  # welcome | follow_up | proposal | meeting | general
merge_tags: JSONB, nullable  # ["contact_name","company","deal_value"]
is_active: bool, default=True
created_by: UUID FK users.id, nullable
workspace_id: UUID FK
```

**Endpoints:** POST/GET(list)/GET(id)/PATCH/DELETE
**Path:** `/crm/workspaces/{wid}/email-templates`

---

## Model 3: EmailLog (US-015)

```python
__tablename__ = "crm_email_logs"
id: UUID PK
contact_id: UUID FK contacts.id, nullable, index
deal_id: UUID FK deals.id, nullable
lead_id: UUID FK leads.id, nullable
template_id: UUID FK crm_email_templates.id, nullable
subject: str(500)
body: text
direction: str(10)  # sent | received
status: str(20), default="sent"  # sent | opened | clicked | bounced
sent_at: datetime(tz)
opened_at: datetime(tz), nullable
clicked_at: datetime(tz), nullable
workspace_id: UUID FK
```

**Send endpoint:** `POST /crm/workspaces/{wid}/emails/send` — render template with merge tags, create EmailLog, create Activity (type=email_sent).
**List:** `GET /crm/workspaces/{wid}/emails?contact_id=X`
**Tracking:** `GET /crm/workspaces/{wid}/emails/{eid}/track?event=open` — pixel endpoint, updates `opened_at` + creates Activity (email_open) which triggers lead score +5.

---

## Model 4: Competitor (US-006 AC5)

```python
__tablename__ = "crm_competitors"
id: UUID PK
deal_id: UUID FK deals.id, index
name: str(255)
strengths: text, nullable
weaknesses: text, nullable
price_comparison: str(20), nullable  # higher | similar | lower
status: str(20), default="active"  # active | won | lost
workspace_id: UUID FK
```

**Endpoints:** POST/GET/PATCH/DELETE nested under deals
**Path:** `/crm/workspaces/{wid}/deals/{did}/competitors`

---

## Files to Create

### Backend (16 files)
- `models/crm_custom_field.py`, `models/email_template.py`, `models/email_log.py`, `models/competitor.py`
- `schemas/crm_custom_field.py`, `schemas/email_template.py`, `schemas/email_log.py`, `schemas/competitor.py`
- `services/crm_custom_field.py`, `services/email_template.py`, `services/email_log.py`, `services/competitor.py`
- `routers/custom_fields.py`, `routers/email_templates.py`, `routers/emails.py`, `routers/deal_competitors.py`

All under `backend/app/modules/crm/`

### Frontend (10 files)
- `features/settings/pages/custom-fields-settings.tsx`
- `features/settings/hooks/use-custom-fields.ts`
- `features/settings/components/custom-field-form.tsx`
- `shared/components/crm/dynamic-custom-fields.tsx` (under `frontend/src/`)
- `features/email/pages/email-templates-list.tsx`
- `features/email/hooks/use-email-templates.ts`
- `features/email/components/email-template-editor.tsx`
- `features/email/components/send-email-dialog.tsx`
- `features/deals/components/deal-competitors-tab.tsx`
- `features/deals/hooks/use-deal-competitors.ts`

All under `frontend/src/modules/crm/` unless noted.

## Files to Modify
- `backend/app/modules/crm/models/__init__.py` — 4 model imports
- `backend/app/modules/crm/models/lead.py` — add `custom_field_values: JSONB`
- `backend/app/modules/crm/models/deal.py` — add `custom_field_values: JSONB`
- `backend/app/modules/crm/models/account.py` — add `custom_field_values: JSONB`
- `backend/app/modules/crm/models/contact.py` — add `custom_field_values: JSONB`
- `backend/app/modules/crm/router.py` — 4 router includes
- `frontend/src/modules/crm/features/leads/components/lead-form-dialog.tsx` — render custom fields
- `frontend/src/modules/crm/features/deals/components/deal-form-dialog.tsx` — render custom fields

## Migration
`alembic revision -m "add_crm_custom_fields_email_competitor"`
- Tables: `crm_custom_fields`, `crm_email_templates`, `crm_email_logs`, `crm_competitors`
- ALTER leads/deals/accounts/contacts ADD custom_field_values JSONB

## Implementation Steps
1. Create CrmCustomField model + schema + service + router
2. Add `custom_field_values` JSONB to Lead, Deal, Account, Contact models
3. Create EmailTemplate model + schema + service + router
4. Create EmailLog model + schema + service (send with merge tag rendering) + router
5. Create tracking pixel endpoint (GET, updates opened_at, fires activity for score trigger)
6. Create Competitor model + schema + service + router
7. Register all, generate migration
8. Frontend: custom fields settings page (CRUD per entity type)
9. Frontend: dynamic-custom-fields renderer (reusable in entity forms)
10. Frontend: email template editor + send dialog
11. Frontend: deal competitors tab

## Success Criteria
- [ ] Custom fields CRUD per entity type with JSONB storage
- [ ] Dynamic field rendering on lead/deal/contact/account forms
- [ ] Email templates with merge tag rendering
- [ ] Email send creates EmailLog + Activity
- [ ] Tracking pixel updates EmailLog status + fires lead score via activity
- [ ] Competitors tracked per deal with strengths/weaknesses
