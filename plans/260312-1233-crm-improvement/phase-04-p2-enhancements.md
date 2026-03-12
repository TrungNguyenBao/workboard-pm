# Phase 4: P2 Enhancements

**Priority:** P2 Low | **Est:** ~11 SP | **Status:** ✅ Complete

---

## Context
- [Phase 3](phase-03-p1-feature-gaps.md) should complete first
- [Audit Report](../reports/crm-audit-260312-1144-consolidated.md)

## Tasks

### 4.1 US-029: Pipeline Stage Configuration (~5 SP)

**Backend:**
- [x] Create `PipelineStage` model (name, position, default_probability, workspace_id)
- [x] Create CRUD + reorder + seed-defaults endpoints
- [x] Admin-only role for mutations

**Frontend:**
- [x] Create pipeline settings page with drag-to-reorder (@dnd-kit/sortable)
- [x] Inline name + probability editing, add/delete stages
- [x] Seed defaults button

### 4.2 US-030: Lead Scoring Rules Configuration (~3 SP)

**Backend:**
- [x] Create `ScoringConfig` model (workspace-level JSONB config)
- [x] Create get/update endpoints with defaults fallback
- [x] Activity scores + thresholds config

**Frontend:**
- [x] Create scoring settings page with editable rules table
- [x] Threshold config (Cold max, Warm max)
- [x] Add/remove custom rules, reset to defaults

### 4.3 Backend Code Quality Fixes (~3 SP)

- [x] Replace `datetime.utcnow()` with `datetime.now(timezone.utc)` (6 files)
- [x] Escape ILIKE wildcards via `escape_like()` helper (7 files)
- [x] Fix close deal endpoint to use request body (`DealCloseRequest`)
- [x] Enforce campaign status flow (draft → active → completed/cancelled)
- [x] Add Literal type validation on all schemas (stage, status, priority, source, type)
- [x] Fix governance stale leads call (`hours=48` → `days=30`)

## Success Criteria
- Pipeline stages configurable with drag-to-reorder
- Scoring rules editable per workspace with thresholds
- No more deprecated `datetime.utcnow()` calls
- ILIKE wildcards properly escaped in all search services
- Close deal uses proper request body
- Campaign status transitions enforced
- All schema fields validated against allowed values
