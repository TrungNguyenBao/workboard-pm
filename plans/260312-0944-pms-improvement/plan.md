# PMS Improvement Plan — Implementation

**Created:** 2026-03-12 | **Based on:** [Audit Report](../reports/pms-audit-260312-0925-consolidated.md)
**Scope:** 20 gaps across 38 user stories | **Est:** ~81 SP

---

## Phases

| # | Phase | Stories | SP | Status |
|---|-------|---------|-----|--------|
| 1 | [P0 Critical Gaps](phase-01-p0-critical-gaps.md) | 7 | ~30 | ✅ Complete |
| 2 | [P0 Dashboard APIs](phase-02-p0-dashboard-apis.md) | 3 | ~16 | ✅ Complete |
| 3 | [P1 Feature Gaps](phase-03-p1-feature-gaps.md) | 6 | ~23 | ✅ Complete |
| 4 | [P2 Enhancements](phase-04-p2-enhancements.md) | 4 | ~12 | ✅ Complete |

## Implementation Order

```
Phase 1: Quick wins → RBAC BE fixes → Member mgmt → Project list → FE enhancements
Phase 2: Dashboard API → My Tasks API → Search highlights
Phase 3: Dependencies → Tags CRUD → Tags on cards → Archive/Restore → Stats → DnD upload
Phase 4: WIP limits → Follow task → Calendar → Timeline
```

## Key Dependencies

- RBAC fixes (1.2 BE) → unblocks Member management (1.1)
- Member management (1.1) → unblocks Permission UI (1.2 FE)
- Dashboard API (2.1 BE) → unblocks Dashboard FE (2.1 FE)
- My Tasks API (2.2 BE) → unblocks My Tasks FE (2.2 FE)
- Dependencies BE (3.1 BE) → unblocks Dependencies FE (3.1 FE)
