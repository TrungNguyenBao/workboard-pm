# Phase 4: CRM Module Responsive

## Context
- [CRM pages](../../frontend/src/modules/crm/features/)
- Depends on Phase 1 (shell) and Phase 2 (shared UI)
- 18 features — largest module

## Overview
- **Priority**: High
- **Status**: Completed
- **Description**: Make CRM module pages responsive. Most list pages use PageHeader + DataTable (covered by Phase 2). Focus on detail pages, dashboard widgets, pipeline view, and custom layouts.

## Pages to Update

| Page | File | Changes Needed |
|------|------|----------------|
| CRM Dashboard | `crm/features/dashboard/pages/crm-dashboard.tsx` | Padding responsive, campaign summary grid `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` |
| Contacts List | `crm/features/contacts/pages/contacts-list.tsx` | Handled by Phase 2 |
| Contact Detail | `crm/features/contacts/pages/contact-detail.tsx` | Grid stacking, info cards responsive |
| Accounts List | `crm/features/accounts/pages/accounts-list.tsx` | Phase 2 |
| Account Detail | `crm/features/accounts/pages/account-detail.tsx` | Grid stacking |
| Deals List | `crm/features/deals/pages/deals-list.tsx` | Phase 2 |
| Deal Detail | `crm/features/deals/pages/deal-detail.tsx` | Grid stacking |
| Deals Pipeline | `crm/features/deals/pages/deals-pipeline.tsx` | Horizontal scroll like kanban |
| Leads List | `crm/features/leads/pages/leads-list.tsx` | Phase 2 |
| Lead Detail | `crm/features/leads/pages/lead-detail.tsx` | Grid stacking |
| Activities | `crm/features/activities/pages/activities-list.tsx` | Phase 2 |
| Campaigns List | `crm/features/campaigns/pages/campaigns-list.tsx` | Phase 2 |
| Campaign Detail | `crm/features/campaigns/pages/campaign-detail.tsx` | Grid stacking |
| Contracts | `crm/features/contracts/pages/contracts-list.tsx` | Phase 2 |
| Products | `crm/features/products/pages/products-list.tsx` | Phase 2 |
| Tickets | `crm/features/tickets/pages/tickets-list.tsx` | Phase 2 |
| Email Templates | `crm/features/email/pages/email-templates-list.tsx` | Phase 2 |
| Forecast | `crm/features/forecast/pages/forecast-list.tsx` | Phase 2 |
| Import Wizard | `crm/features/import/pages/import-wizard.tsx` | Step layout responsive |
| Data Quality | `crm/features/data-quality/pages/data-quality-report.tsx` | Grid responsive |
| Settings pages | `crm/features/settings/pages/*.tsx` | Form layout responsive |
| Dashboard widgets | `crm/features/dashboard/components/*.tsx` | Chart containers responsive |

## Implementation Steps

1. **Dashboard**: `p-6` → `p-4 sm:p-6`, campaign summary `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
2. **Detail pages** (contact, account, deal, lead, campaign): sidebar+main grid → stack on mobile `grid-cols-1 lg:grid-cols-[1fr_300px]`
3. **Deals Pipeline**: horizontal scroll wrapper like kanban board
4. **Import Wizard**: step indicators responsive, form fields full-width on mobile
5. **Settings pages**: form layouts full-width on mobile
6. **Dashboard widgets**: ensure chart containers don't overflow

## Todo List
- [x] Dashboard padding + campaign grid
- [x] Contact detail responsive
- [x] Account detail responsive
- [x] Deal detail responsive
- [x] Lead detail responsive
- [x] Campaign detail responsive
- [x] Deals pipeline horizontal scroll
- [x] Import wizard responsive
- [x] Settings pages responsive
- [x] Data quality report responsive
- [x] Dashboard widget components check

## Success Criteria
- All CRM pages usable on 375px mobile viewport
- Detail pages stack info sidebar below main content on mobile
- Pipeline view horizontally scrollable
- No content overflow
