---
phase: 5
title: "P1 Features — SalesForecast, ImportJob, Enhanced Analytics"
sprint: Sprint 5
priority: P1
effort: 8h
status: pending
user_stories: [US-019, US-028, US-018]
gaps_addressed: [M10, M11]
dependencies: [phase-04]
---

# Phase 5: SalesForecast, Import/Export & Enhanced Analytics

## Context
- US-019: Sales Forecast (MISSING 0/6 for forecast ACs)
- US-028: Import/Export (MISSING 0/5)
- US-018: Dashboard KPIs (PARTIAL — missing monthly revenue chart)

---

## Model 1: SalesForecast (US-019)

```python
__tablename__ = "crm_sales_forecasts"
id: UUID PK
owner_id: UUID FK users.id, index
period: str(7)  # YYYY-MM
target_amount: float, default=0
committed_amount: float, default=0  # deals in negotiation+
best_case_amount: float, default=0  # all open deals weighted
closed_amount: float, default=0     # actual closed_won this period
status: str(10), default="open"  # open | closed
workspace_id: UUID FK
created_by: UUID FK users.id, nullable
# Unique: (workspace_id, owner_id, period)
```

**Endpoints:**
| Method | Path | Notes |
|--------|------|-------|
| POST | `/crm/workspaces/{wid}/forecasts` | Create forecast for period |
| GET | `/crm/workspaces/{wid}/forecasts?period=2026-03` | List by period |
| PATCH | `/crm/workspaces/{wid}/forecasts/{fid}` | Update target/amounts |
| POST | `/crm/workspaces/{wid}/forecasts/{fid}/close` | Lock period |
| GET | `/crm/workspaces/{wid}/forecasts/{fid}/vs-actual` | Forecast vs actual comparison |

**Forecast vs Actual Logic:**
```python
actual = SUM(deals.value) WHERE stage='closed_won' AND closed_at IN period AND owner_id=forecast.owner_id
attainment_pct = (actual / target) * 100
gap = target - actual
```

---

## Model 2: ImportJob (US-028)

```python
__tablename__ = "crm_import_jobs"
id: UUID PK
type: str(20)  # lead | contact | account
file_name: str(255)
file_url: str(1000)
status: str(20), default="pending"  # pending | processing | completed | failed
total_rows: int, default=0
imported_rows: int, default=0
failed_rows: int, default=0
error_log: JSONB, nullable  # [{"row": 5, "field": "email", "error": "invalid"}]
column_mapping: JSONB, nullable  # {"csv_col": "model_field"}
created_by: UUID FK users.id, nullable
workspace_id: UUID FK
```

**Endpoints:**
| Method | Path | Notes |
|--------|------|-------|
| POST | `/crm/workspaces/{wid}/import` | Upload CSV, create job |
| GET | `/crm/workspaces/{wid}/import-jobs` | List history |
| GET | `/crm/workspaces/{wid}/import-jobs/{jid}` | Status + errors |

**Processing:** Synchronous for <1000 rows. ARQ background job for larger files.
**Duplicate handling:** Skip rows with matching email. Log as error.

**Export Endpoints:**
| Method | Path |
|--------|------|
| GET | `/crm/workspaces/{wid}/export/leads?format=csv` |
| GET | `/crm/workspaces/{wid}/export/pipeline?format=xlsx` |
| GET | `/crm/workspaces/{wid}/export/contacts?format=csv` |

Use `openpyxl` for Excel, `csv` for CSV. Stream response.

---

## Enhanced Analytics (US-018, US-019)

### New analytics to add to `crm_analytics.py`:
1. **Monthly revenue trend** (6 months): GROUP BY month on closed_won deals
2. **Funnel conversion rates**: leads -> qualified -> opportunity -> won (with percentages)
3. **Top 5 deals** by value (open)
4. **Deal velocity by stage**: already partially exists, enhance with bottleneck highlight (stage with highest avg_days)
5. **Velocity by owner**: group by owner_id

### New endpoint:
`GET /crm/workspaces/{wid}/analytics/velocity-detail` — per-stage avg days + bottleneck flag + by-owner breakdown

---

## Files to Create

### Backend (10 files)
- `models/sales_forecast.py`, `models/import_job.py`
- `schemas/sales_forecast.py`, `schemas/import_job.py`
- `services/sales_forecast.py`, `services/import_service.py`, `services/export_service.py`
- `services/deal_velocity.py`
- `routers/forecasts.py`, `routers/import_export.py`

All under `backend/app/modules/crm/`

### Frontend (9 files)
- `features/forecast/pages/forecast-list.tsx`
- `features/forecast/hooks/use-forecasts.ts`
- `features/forecast/components/forecast-table.tsx`
- `features/import/pages/import-wizard.tsx`
- `features/import/hooks/use-import.ts`
- `features/import/components/column-mapper.tsx`
- `features/dashboard/components/revenue-trend-chart.tsx`
- `features/dashboard/components/deal-velocity-enhanced.tsx`
- `features/dashboard/components/sales-funnel-enhanced.tsx`

All under `frontend/src/modules/crm/`

## Files to Modify
- `backend/app/modules/crm/models/__init__.py` — 2 model imports
- `backend/app/modules/crm/router.py` — 2 router includes
- `backend/app/modules/crm/services/crm_analytics.py` — add monthly revenue, funnel rates, top deals
- `backend/app/modules/crm/routers/analytics.py` — add velocity-detail endpoint
- `frontend/src/modules/crm/features/dashboard/pages/crm-dashboard.tsx` — add widgets
- `frontend/src/app/router.tsx` — add forecast, import routes

## Migration
`alembic revision -m "add_crm_forecasts_import_jobs"`
- Tables: `crm_sales_forecasts`, `crm_import_jobs`
- Unique: (workspace_id, owner_id, period) on forecasts

## Implementation Steps
1. Create SalesForecast model + schema + service (CRUD + close + vs-actual) + router
2. Create ImportJob model + schema + import_service (parse CSV, validate, create entities) + router
3. Create export_service (leads CSV, pipeline Excel, contacts CSV)
4. Create deal_velocity service (per-stage days + bottleneck + by-owner)
5. Enhance crm_analytics: monthly revenue trend, funnel conversion rates, top deals
6. Register all, generate migration
7. Frontend: forecast table (rep rows x target/committed/best_case/closed columns)
8. Frontend: import wizard (upload -> column map -> preview -> confirm -> status)
9. Frontend: enhanced dashboard widgets (revenue chart, funnel, velocity)
10. Add export buttons to leads-list and deals-pipeline pages

## Success Criteria
- [ ] Forecast CRUD with period tracking per sales rep
- [ ] Forecast vs actual shows attainment percentage
- [ ] CSV import with duplicate detection + error log
- [ ] Leads/pipeline/contacts export to CSV/Excel
- [ ] Monthly revenue trend chart (6 months)
- [ ] Deal velocity by stage with bottleneck highlight
- [ ] Sales funnel with conversion percentages
