import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, computed_field


class QuotationLineCreate(BaseModel):
    product_service_id: uuid.UUID | None = None
    description: str = Field(min_length=1, max_length=500)
    quantity: float = Field(default=1.0, gt=0)
    unit_price: float = Field(default=0.0, ge=0)
    discount_pct: float = Field(default=0.0, ge=0, le=100)
    position: int = 0


class QuotationLineUpdate(BaseModel):
    product_service_id: uuid.UUID | None = None
    description: str | None = Field(default=None, max_length=500)
    quantity: float | None = Field(default=None, gt=0)
    unit_price: float | None = Field(default=None, ge=0)
    discount_pct: float | None = Field(default=None, ge=0, le=100)
    position: int | None = None


class QuotationLineResponse(BaseModel):
    id: uuid.UUID
    quotation_id: uuid.UUID
    product_service_id: uuid.UUID | None
    description: str
    quantity: float
    unit_price: float
    discount_pct: float
    line_total: float
    position: int
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuotationCreate(BaseModel):
    deal_id: uuid.UUID
    contact_id: uuid.UUID | None = None
    valid_until: date | None = None
    discount_pct: float = Field(default=0.0, ge=0, le=100)
    tax_pct: float = Field(default=0.0, ge=0, le=100)
    notes: str | None = None
    lines: list[QuotationLineCreate] = []


class QuotationUpdate(BaseModel):
    contact_id: uuid.UUID | None = None
    valid_until: date | None = None
    discount_pct: float | None = Field(default=None, ge=0, le=100)
    tax_pct: float | None = Field(default=None, ge=0, le=100)
    notes: str | None = None


class QuotationResponse(BaseModel):
    id: uuid.UUID
    deal_id: uuid.UUID
    quote_number: str
    contact_id: uuid.UUID | None
    valid_until: date | None
    subtotal: float
    discount_pct: float
    discount_amount: float
    tax_pct: float
    tax_amount: float
    total: float
    status: str
    notes: str | None
    version: int
    created_by: uuid.UUID | None
    workspace_id: uuid.UUID
    lines: list[QuotationLineResponse] = []
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def requires_approval(self) -> bool:
        return self.discount_pct > 20

    model_config = {"from_attributes": True}
