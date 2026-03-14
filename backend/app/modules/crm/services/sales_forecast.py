import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models.deal import Deal
from app.modules.crm.models.sales_forecast import SalesForecast
from app.modules.crm.schemas.sales_forecast import (
    ForecastVsActualResponse,
    SalesForecastCreate,
    SalesForecastUpdate,
)


async def create_forecast(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    data: SalesForecastCreate,
    user_id: uuid.UUID | None = None,
) -> SalesForecast:
    forecast = SalesForecast(
        workspace_id=workspace_id,
        created_by=user_id,
        **data.model_dump(),
    )
    db.add(forecast)
    try:
        await db.commit()
        await db.refresh(forecast)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Forecast already exists for this owner and period",
        )
    return forecast


async def list_forecasts(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    period: str | None = None,
    owner_id: uuid.UUID | None = None,
) -> list[SalesForecast]:
    q = select(SalesForecast).where(SalesForecast.workspace_id == workspace_id)
    if period:
        q = q.where(SalesForecast.period == period)
    if owner_id:
        q = q.where(SalesForecast.owner_id == owner_id)
    result = await db.scalars(q.order_by(SalesForecast.period.desc()))
    return list(result.all())


async def get_forecast(
    db: AsyncSession,
    forecast_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> SalesForecast:
    forecast = await db.scalar(
        select(SalesForecast).where(
            SalesForecast.id == forecast_id,
            SalesForecast.workspace_id == workspace_id,
        )
    )
    if not forecast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forecast not found")
    return forecast


async def update_forecast(
    db: AsyncSession,
    forecast_id: uuid.UUID,
    workspace_id: uuid.UUID,
    data: SalesForecastUpdate,
) -> SalesForecast:
    forecast = await get_forecast(db, forecast_id, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(forecast, field, value)
    await db.commit()
    await db.refresh(forecast)
    return forecast


async def close_forecast(
    db: AsyncSession,
    forecast_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> SalesForecast:
    forecast = await get_forecast(db, forecast_id, workspace_id)
    forecast.status = "closed"
    await db.commit()
    await db.refresh(forecast)
    return forecast


async def get_forecast_vs_actual(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    forecast_id: uuid.UUID,
) -> ForecastVsActualResponse:
    forecast = await get_forecast(db, forecast_id, workspace_id)

    # Parse period YYYY-MM to date range
    year, month = int(forecast.period[:4]), int(forecast.period[5:7])
    if month == 12:
        next_year, next_month = year + 1, 1
    else:
        next_year, next_month = year, month + 1

    start = datetime(year, month, 1, tzinfo=timezone.utc)
    end = datetime(next_year, next_month, 1, tzinfo=timezone.utc)

    actual = await db.scalar(
        select(func.coalesce(func.sum(Deal.value), 0.0)).where(
            Deal.workspace_id == workspace_id,
            Deal.stage == "closed_won",
            Deal.closed_at >= start,
            Deal.closed_at < end,
        )
    ) or 0.0

    target = forecast.target_amount
    attainment_pct = round((actual / target * 100) if target > 0 else 0.0, 1)
    gap = round(target - actual, 2)

    return ForecastVsActualResponse(
        period=forecast.period,
        target=target,
        actual=actual,
        attainment_pct=attainment_pct,
        gap=gap,
    )
