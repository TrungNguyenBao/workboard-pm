from fastapi import APIRouter

from app.modules.wms.routers import devices, inventory_items, products, suppliers, warehouses

wms_router = APIRouter(prefix="/wms", tags=["wms"])

wms_router.include_router(warehouses.router)
wms_router.include_router(inventory_items.router)
wms_router.include_router(products.router)
wms_router.include_router(devices.router)
wms_router.include_router(suppliers.router)
