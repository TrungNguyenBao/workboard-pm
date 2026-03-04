"""Seed WMS: warehouses, products, suppliers, devices, inventory items."""
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_wms(session: AsyncSession, ws_id: uuid.UUID) -> None:
    print("Creating WMS data...")

    # Warehouses (2)
    wh_ids: list[uuid.UUID] = []
    warehouses = [
        ("Kho Trung Tam TPHCM", "TP. Ho Chi Minh", "123 Nguyen Hue, Quan 1, TPHCM", "Nguyen Van An"),
        ("Kho Ha Noi", "Ha Noi", "456 Le Duan, Quan Hoan Kiem, Ha Noi", "Tran Minh Duc"),
    ]
    for name, location, address, manager in warehouses:
        wid = uuid.uuid4()
        wh_ids.append(wid)
        await session.execute(text("""
            INSERT INTO warehouses (id, workspace_id, name, location, address, manager_name, is_active, created_at, updated_at)
            VALUES (:id, :ws, :name, :loc, :addr, :mgr, true, now(), now())
        """), {"id": wid, "ws": ws_id, "name": name, "loc": location, "addr": address, "mgr": manager})

    # Products (6)
    prod_ids: list[uuid.UUID] = []
    products = [
        ("Laptop Dell Latitude 5540", "DELL-LAT-5540", "equipment", "Business laptop 15.6 inch, i7, 16GB RAM", "pcs", True),
        ("Man hinh Dell U2723QE", "DELL-MON-U2723", "equipment", "27 inch 4K USB-C monitor", "pcs", True),
        ("Ban phim Logitech MX Keys", "LOGI-MXK-001", "accessory", "Wireless mechanical keyboard", "pcs", False),
        ("Chuot Logitech MX Master 3S", "LOGI-MXM-3S", "accessory", "Wireless ergonomic mouse", "pcs", False),
        ("Cap USB-C to USB-C 2m", "CBL-USBC-2M", "consumable", "Braided USB-C cable, 100W PD", "pcs", False),
        ("Giay in A4 Double A 80gsm", "PAP-A4-80G", "consumable", "Ream 500 sheets, 80gsm", "ream", False),
    ]
    for name, sku, cat, desc, unit, serial in products:
        pid = uuid.uuid4()
        prod_ids.append(pid)
        await session.execute(text("""
            INSERT INTO wms_products (id, workspace_id, name, sku, category, description, unit, is_serial_tracked, is_active, created_at, updated_at)
            VALUES (:id, :ws, :name, :sku, :cat, :desc, :unit, :serial, true, now(), now())
        """), {"id": pid, "ws": ws_id, "name": name, "sku": sku, "cat": cat, "desc": desc, "unit": unit, "serial": serial})

    # Suppliers (3)
    suppliers = [
        ("Phu Kien So Viet", "lienhe@phukiensoviet.vn", "+84-28-3823-4567", "789 Hai Ba Trung, Q3, TPHCM"),
        ("Dell Technologies VN", "sales@dell.com.vn", "+84-28-3520-7890", "Bitexco Tower, TPHCM"),
        ("Van Phong Pham Hoa Phat", "sales@hoaphat-vpp.vn", "+84-24-3974-1234", "15 Tran Hung Dao, Ha Noi"),
    ]
    for name, email, phone, address in suppliers:
        await session.execute(text("""
            INSERT INTO wms_suppliers (id, workspace_id, name, contact_email, phone, address, is_active, created_at, updated_at)
            VALUES (:id, :ws, :name, :email, :phone, :addr, true, now(), now())
        """), {"id": uuid.uuid4(), "ws": ws_id, "name": name, "email": email, "phone": phone, "addr": address})

    # Devices (8) — serial-tracked against prod_ids[0] (Laptop) and prod_ids[1] (Monitor)
    devices = [
        ("DELL-SN-2024-001", 0, 0, "in_stock",    None),
        ("DELL-SN-2024-002", 0, 0, "deployed",    "Assigned to Nguyen Thi Mai - Marketing"),
        ("DELL-SN-2024-003", 0, 1, "in_stock",    None),
        ("DELL-SN-2024-004", 0, 1, "maintenance", "Screen replacement pending"),
        ("DELL-MON-SN-001",  1, 0, "in_stock",    None),
        ("DELL-MON-SN-002",  1, 0, "deployed",    "Conference room A"),
        ("DELL-MON-SN-003",  1, 1, "in_stock",    None),
        ("DELL-MON-SN-004",  1, 0, "deployed",    "Reception area"),
    ]
    for serial, prod_idx, wh_idx, status, notes in devices:
        await session.execute(text("""
            INSERT INTO wms_devices (id, workspace_id, serial_number, product_id, warehouse_id, status, notes, created_at, updated_at)
            VALUES (:id, :ws, :serial, :prod, :wh, :status, :notes, now(), now())
        """), {
            "id": uuid.uuid4(), "ws": ws_id, "serial": serial,
            "prod": prod_ids[prod_idx], "wh": wh_ids[wh_idx],
            "status": status, "notes": notes,
        })

    # Inventory Items (6) — non-serial-tracked products
    inv_items = [
        ("LOGI-MXK-001", "Ban phim Logitech MX Keys",    25,  "pcs",  0, 2, 10),
        ("LOGI-MXM-3S",  "Chuot Logitech MX Master 3S",  30,  "pcs",  0, 3, 10),
        ("CBL-USBC-2M",  "Cap USB-C to USB-C 2m",         50,  "pcs",  0, 4, 20),
        ("PAP-A4-80G",   "Giay in A4 Double A 80gsm",    120, "ream",  0, 5, 30),
        ("LOGI-MXK-001", "Ban phim Logitech MX Keys",     15,  "pcs",  1, 2,  5),
        ("PAP-A4-80G",   "Giay in A4 Double A 80gsm",     80, "ream",  1, 5, 20),
    ]
    for sku, name, qty, unit, wh_idx, prod_idx, threshold in inv_items:
        await session.execute(text("""
            INSERT INTO inventory_items (id, workspace_id, sku, name, quantity, unit, warehouse_id, product_id, min_threshold, created_at, updated_at)
            VALUES (:id, :ws, :sku, :name, :qty, :unit, :wh, :prod, :thr, now(), now())
        """), {
            "id": uuid.uuid4(), "ws": ws_id, "sku": sku, "name": name,
            "qty": qty, "unit": unit, "wh": wh_ids[wh_idx],
            "prod": prod_ids[prod_idx], "thr": threshold,
        })

    print("  WMS: 2 warehouses, 6 products, 3 suppliers, 8 devices, 6 inventory items")
