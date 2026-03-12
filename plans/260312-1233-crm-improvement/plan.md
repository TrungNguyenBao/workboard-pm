# CRM Improvement Plan — Implementation

**Created:** 2026-03-12 | **Based on:** [Audit Report](../reports/crm-audit-260312-1144-consolidated.md)
**Scope:** 17 gaps across 30 user stories | **Est:** ~73 SP

---

## Phases

| # | Phase | Stories | SP | Status |
|---|-------|---------|-----|--------|
| 1 | [P0 Critical Gaps](phase-01-p0-critical-gaps.md) | 5 | ~31 | ✅ Complete |
| 2 | [P0/P1 High](phase-02-p0-p1-high.md) | 5 | ~15 | ✅ Complete |
| 3 | [P1 Features](phase-03-p1-feature-gaps.md) | 4 | ~16 | ✅ Complete |
| 4 | [P2 Enhancements](phase-04-p2-enhancements.md) | 3 | ~11 | ✅ Complete |

## Implementation Order

```
Phase 1: Scoring → Duplicates → Conversion → Pipeline DnD → RBAC
Phase 2: Auto probability → Stale fix → Campaigns FE → Follow-ups → Stale deals
Phase 3: Data quality → Velocity → Ticket KPIs → Governance drill-down
Phase 4: Pipeline config → Scoring config → Code quality
```

## Summary

All 17 gaps resolved across 4 phases. Key changes:
- **Phase 1**: Fixed lead scoring, duplicate detection, conversion flow, pipeline DnD, RBAC audit
- **Phase 2**: Auto probability, stale lead fix, campaign detail page, follow-ups widget
- **Phase 3**: Data quality report, deal velocity analytics, ticket KPIs, governance drill-down
- **Phase 4**: Pipeline stage config, scoring rules config, code quality (datetime, ILIKE, schema validation)
