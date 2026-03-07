"""Request/response schemas for CRM workflow endpoints."""
import uuid

from pydantic import BaseModel


class DealCloseRequest(BaseModel):
    action: str  # "won" | "lost"
    loss_reason: str | None = None


class DistributeResponse(BaseModel):
    distributed_count: int
    lead_ids: list[uuid.UUID]


class StaleItemsResponse(BaseModel):
    count: int
    items: list[dict]


class DataQualityReport(BaseModel):
    duplicate_email_count: int
    duplicate_phone_count: int
    incomplete_leads: int
    stale_contacts_90d: int
    ownerless_deals: int


class GovernanceAlerts(BaseModel):
    stale_deals_count: int
    stale_deals: list[dict]
    stale_leads_count: int
    unassigned_leads: int
    overdue_tickets: int
