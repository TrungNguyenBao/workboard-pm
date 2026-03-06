# Phase 5: WMS Module Guide

## Priority: Medium | Status: Pending

## Overview
Guide for Warehouse Management module — products, warehouses, inventory, devices, suppliers.

## Content Outline

### 5.1 WMS Dashboard (`/wms/dashboard`)
- KPI cards: Products, Warehouses, Inventory Items, Suppliers
- Bar chart: Top Inventory Items by Quantity

### 5.2 Products (`/wms/products`)
- Searchable, paginated table
- Create/edit via form dialog (name, SKU, description, category, etc.)

### 5.3 Warehouses (`/wms/warehouses`)
- Table with search + pagination
- Create/edit: name, location, capacity, description

### 5.4 Inventory (`/wms/inventory`)
- Filter by warehouse, search, paginated
- Columns: SKU (monospace), Name, Product, Quantity, Min threshold
- Low stock indicator (red quantity + "Low" badge when at/below threshold)
- Create/edit: link product + warehouse, set quantity + min threshold

### 5.5 Devices (`/wms/devices`)
- Paginated device list
- Create/edit device records

### 5.6 Suppliers (`/wms/suppliers`)
- Searchable, paginated
- Create/edit: company name, contact info, address

## Implementation Steps
1. Write HTML for 5.1–5.6
2. Highlight low-stock warning feature with info callout
3. Explain warehouse-inventory relationship

## Success Criteria
- All CRUD operations documented
- Inventory threshold/low-stock feature explained
