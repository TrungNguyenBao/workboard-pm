# Phase 7: CRM Module Guide

## Priority: Medium | Status: Pending

## Overview
Guide for Customer Relationship Management — contacts, deals, pipeline.

## Content Outline

### 7.1 CRM Dashboard (`/crm/dashboard`)
- KPI cards: Contacts, Deals, Pipeline Value (formatted $M/$K), Deals Won
- Bar chart: Deals by Stage (color-coded per stage)

### 7.2 Contacts (`/crm/contacts`)
- Searchable, paginated table: Name, Email, Phone, Company
- Create/edit via form dialog

### 7.3 Deals (`/crm/deals`)
- Searchable, filter by stage, paginated
- Columns: Title, Value (USD), Stage badge, Contact name
- Stages: Lead → Qualified → Proposal → Negotiation → Closed Won / Closed Lost
- Create/edit via form dialog

## Implementation Steps
1. Write HTML for 7.1–7.3
2. Include deal stage progression diagram (CSS-styled pipeline)
3. Explain stage color coding

## Success Criteria
- Deal pipeline stages clearly documented
- Contact-deal relationship explained
