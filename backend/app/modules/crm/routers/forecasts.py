import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.rbac import require_workspace_role
from app.models.user import User
from app.modules.crm.schemas.sales_forecast import (
    ForecastVsActualResponse,
    SalesForecastCreate,
    SalesForecastResponse,
    SalesForecastUpdate,
)
from app.modules.crm.services.sales_forecast import (
    close_forecast,
    create_forecast,
    get_forecast_vs_actual,
    list_forecasts,
    update_forecast,
)

router = APIRouter(tags=["crm"])


@router.post(
    "/workspaces/{workspace_id}/forecasts",
    response_model=SalesForecastResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    workspace_id: uuid.UUID,
    data: SalesForecastCreate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await create_forecast(db, workspace_id, data, user_id=current_user.id)


@router.get(
    "/workspaces/{workspace_id}/forecasts",
    response_model=list[SalesForecastResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    period: str | None = Query(default=None),
    owner_id: uuid.UUID | None = Query(default=None),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await list_forecasts(db, workspace_id, period=period, owner_id=owner_id)


@router.patch(
    "/workspaces/{workspace_id}/forecasts/{forecast_id}",
    response_model=SalesForecastResponse,
)
async def update(
    workspace_id: uuid.UUID,
    forecast_id: uuid.UUID,
    data: SalesForecastUpdate,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await update_forecast(db, forecast_id, workspace_id, data)


@router.post(
    "/workspaces/{workspace_id}/forecasts/{forecast_id}/close",
    response_model=SalesForecastResponse,
)
async def close(
    workspace_id: uuid.UUID,
    forecast_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    return await close_forecast(db, forecast_id, workspace_id)


@router.get(
    "/workspaces/{workspace_id}/forecasts/{forecast_id}/vs-actual",
    response_model=ForecastVsActualResponse,
)
async def vs_actual(
    workspace_id: uuid.UUID,
    forecast_id: uuid.UUID,
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    return await get_forecast_vs_actual(db, workspace_id, forecast_id)
