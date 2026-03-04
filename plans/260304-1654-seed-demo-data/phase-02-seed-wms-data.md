# Phase 2: Add WMS Seed Data

## Context
- WMS models exist: Product, Warehouse, Device, Supplier, InventoryItem
- All have `workspace_id` FK
- No WMS data in current seed script

## Overview
- **Priority**: P1
- **Status**: completed
- **Effort**: 30min

## Key Insights from Model Analysis

| Model | Table | Key Columns | Notes |
|-------|-------|-------------|-------|
| Product | `wms_products` | name, sku, category, description, unit, is_serial_tracked, workspace_id | category default "equipment", unit default "pcs" |
| Warehouse | `warehouses` | name, location, address, manager_name, description, workspace_id, is_active | |
| Device | `wms_devices` | serial_number, product_id (FK), warehouse_id (FK nullable), status, notes, workspace_id | status default "in_stock" |
| Supplier | `wms_suppliers` | name, contact_email, phone, address, is_active, workspace_id | |
| InventoryItem | `inventory_items` | sku, name, quantity, unit, warehouse_id (FK), product_id (FK nullable), min_threshold, workspace_id | |

FK chain: Device -> Product, Device -> Warehouse, InventoryItem -> Warehouse, InventoryItem -> Product

## Related Code Files

### Files to Create
- `backend/app/scripts/seed_wms.py`

## Seed Data Specification

### Warehouses (2)
```python
warehouses = [
    ("Kho Trung Tam TPHCM",  "TP. Ho Chi Minh",  "123 Nguyen Hue, Quan 1, TPHCM",         "Nguyen Van An"),
    ("Kho Ha Noi",            "Ha Noi",            "456 Le Duan, Quan Hoan Kiem, Ha Noi",    "Tran Minh Duc"),
]
```

### Products (6)
```python
products = [
    # (name, sku, category, description, unit, is_serial_tracked)
    ("Laptop Dell Latitude 5540",      "DELL-LAT-5540",    "equipment",    "Business laptop 15.6 inch, i7, 16GB RAM",  "pcs", True),
    ("Man hinh Dell U2723QE",          "DELL-MON-U2723",   "equipment",    "27 inch 4K USB-C monitor",                  "pcs", True),
    ("Ban phim Logitech MX Keys",      "LOGI-MXK-001",     "accessory",    "Wireless mechanical keyboard",              "pcs", False),
    ("Chuot Logitech MX Master 3S",    "LOGI-MXM-3S",      "accessory",    "Wireless ergonomic mouse",                  "pcs", False),
    ("Cap USB-C to USB-C 2m",          "CBL-USBC-2M",      "consumable",   "Braided USB-C cable, 100W PD",              "pcs", False),
    ("Giay in A4 Double A 80gsm",      "PAP-A4-80G",       "consumable",   "Ream 500 sheets, 80gsm",                    "ream", False),
]
```

### Suppliers (3)
```python
suppliers = [
    ("Phu Kien So Viet",     "lienhe@phukiensoviet.vn",    "+84-28-3823-4567",  "789 Hai Ba Trung, Q3, TPHCM"),
    ("Dell Technologies VN", "sales@dell.com.vn",           "+84-28-3520-7890",  "Bitexco Tower, TPHCM"),
    ("Van Phong Pham Hoa Phat", "sales@hoaphat-vpp.vn",    "+84-24-3974-1234",  "15 Tran Hung Dao, Ha Noi"),
]
```

### Devices (8) -- serial-tracked items
```python
# Linked to serial-tracked products (Laptop, Monitor)
devices = [
    # (serial, product_index, warehouse_index, status, notes)
    ("DELL-SN-2024-001",  0, 0, "in_stock",    None),
    ("DELL-SN-2024-002",  0, 0, "deployed",    "Assigned to Nguyen Thi Mai - Marketing"),
    ("DELL-SN-2024-003",  0, 1, "in_stock",    None),
    ("DELL-SN-2024-004",  0, 1, "maintenance", "Screen replacement pending"),
    ("DELL-MON-SN-001",   1, 0, "in_stock",    None),
    ("DELL-MON-SN-002",   1, 0, "deployed",    "Conference room A"),
    ("DELL-MON-SN-003",   1, 1, "in_stock",    None),
    ("DELL-MON-SN-004",   1, 0, "deployed",    "Reception area"),
]
```

### Inventory Items (6)
```python
# Non-serial items tracked by quantity
inventory_items = [
    # (sku, name, qty, unit, warehouse_idx, product_idx, min_threshold)
    ("LOGI-MXK-001",  "Ban phim Logitech MX Keys",     25, "pcs",  0, 2, 10),
    ("LOGI-MXM-3S",   "Chuot Logitech MX Master 3S",   30, "pcs",  0, 3, 10),
    ("CBL-USBC-2M",   "Cap USB-C to USB-C 2m",          50, "pcs",  0, 4, 20),
    ("PAP-A4-80G",    "Giay in A4 Double A 80gsm",      120,"ream", 0, 5, 30),
    ("LOGI-MXK-001",  "Ban phim Logitech MX Keys",     15, "pcs",  1, 2, 5),
    ("PAP-A4-80G",    "Giay in A4 Double A 80gsm",      80, "ream", 1, 5, 20),
]
```

## Implementation Steps

### Step 1: Create `backend/app/scripts/seed_wms.py`

Function signature:
```python
async def seed_wms(session: AsyncSession, ws_id: uuid.UUID) -> dict:
    """Seed WMS: warehouses, products, suppliers, devices, inventory items."""
```

Insert order (respects FK):
1. Warehouses
2. Products
3. Suppliers
4. Devices (FK -> product, warehouse)
5. Inventory Items (FK -> warehouse, product)

Return `{"warehouse_ids": [...], "product_ids": [...]}` for potential cross-module use.

### Step 2: Wire into `__main__.py`
Already planned in phase-01: `await seed_wms(session, ws_id)`

## Todo List
- [x] Create `backend/app/scripts/seed_wms.py` with all data above
- [x] Ensure file stays under 200 lines
- [x] Test by running `make seed`
- [x] Verified: 2 warehouses, 6 products, 3 suppliers, 8 devices, 6 inventory items created

## Success Criteria
- 2 warehouses, 6 products, 3 suppliers, 8 devices, 6 inventory items created
- All FK relationships valid
- Vietnamese product names and supplier names
- File under 200 lines

## Risk Assessment
- **SKU uniqueness**: InventoryItem.sku is indexed but not unique-constrained globally, only per warehouse implicitly. Same SKU in different warehouses is fine.
- **Device status values**: model uses String(20) default "in_stock". Values used: in_stock, deployed, maintenance -- all valid short strings.
