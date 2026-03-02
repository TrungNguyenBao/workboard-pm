from fastapi import APIRouter

from app.modules.wms.routers import inventory_items, warehouses

wms_router = APIRouter(prefix="/wms", tags=["wms"])

wms_router.include_router(warehouses.router)
wms_router.include_router(inventory_items.router)
