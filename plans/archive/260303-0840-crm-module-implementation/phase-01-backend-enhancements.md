# Phase 1: Backend Enhancements

## Context Links

- [WMS pagination schema](../../backend/app/modules/wms/schemas/pagination.py)
- [WMS product service (search/filter/paginate)](../../backend/app/modules/wms/services/product.py)
- [WMS product router (Query params)](../../backend/app/modules/wms/routers/products.py)
- [CRM contact service (current)](../../backend/app/modules/crm/services/contact.py)
- [CRM deal service (current)](../../backend/app/modules/crm/services/deal.py)

## Overview

- **Priority:** P1 (blocks all frontend work)
- **Status:** completed
- **Effort:** 1.5h

Add pagination and search/filtering to contact and deal list endpoints. Follow WMS `PaginatedResponse[T]` pattern exactly.

## Key Insights

- WMS uses a `PaginatedResponse` generic with `items`, `total`, `page`, `page_size`
- WMS service returns `tuple[list[T], int]` (items, total) from list functions
- WMS router constructs `PaginatedResponse(items=items, total=total, page=page, page_size=page_size)`
- WMS uses ILIKE with `%search%` pattern for search
- WMS uses separate `count_q` query with same filters for total count
- CRM already has `contact_id` filter on deals -- keep it, add `stage` filter
- RBAC: guest=read, member=write, admin=delete (match WMS pattern for delete)

## Requirements

### Functional
- Contacts list: paginated, searchable by name/email/company
- Deals list: paginated, filterable by stage and contact_id, searchable by title
- Default page_size=20, max 100
- Timestamps (`created_at`, `updated_at`) included in responses

### Non-functional
- No new migrations needed (tables already exist with all columns)
- No breaking changes to existing create/get/update/delete endpoints

## Related Code Files

### Files to Modify
1. `backend/app/modules/crm/schemas/contact.py` -- add timestamps to response
2. `backend/app/modules/crm/schemas/deal.py` -- add timestamps to response
3. `backend/app/modules/crm/services/contact.py` -- add pagination + search
4. `backend/app/modules/crm/services/deal.py` -- add pagination + search + stage filter
5. `backend/app/modules/crm/routers/contacts.py` -- add Query params, PaginatedResponse
6. `backend/app/modules/crm/routers/deals.py` -- add Query params, PaginatedResponse

### Files to Create
1. `backend/app/modules/crm/schemas/pagination.py` -- CRM PaginatedResponse (copy from WMS)

## Implementation Steps

### Step 1: Create CRM pagination schema

Create `backend/app/modules/crm/schemas/pagination.py` -- identical to WMS:

```python
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
```

### Step 2: Update contact schema

In `backend/app/modules/crm/schemas/contact.py`, add timestamps to `ContactResponse`:

```python
from datetime import datetime
# ... existing imports ...

class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None
    phone: str | None
    company: str | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

### Step 3: Update deal schema

In `backend/app/modules/crm/schemas/deal.py`, add timestamps to `DealResponse`:

```python
from datetime import datetime
# ... existing imports ...

class DealResponse(BaseModel):
    id: uuid.UUID
    title: str
    value: float
    stage: str
    contact_id: uuid.UUID | None
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

### Step 4: Update contact service

Replace `list_contacts` in `backend/app/modules/crm/services/contact.py`:

```python
from sqlalchemy import func, select

async def list_contacts(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Contact], int]:
    q = select(Contact).where(Contact.workspace_id == workspace_id)
    count_q = select(func.count(Contact.id)).where(Contact.workspace_id == workspace_id)

    if search:
        pattern = f"%{search}%"
        search_filter = (
            Contact.name.ilike(pattern)
            | Contact.email.ilike(pattern)
            | Contact.company.ilike(pattern)
        )
        q = q.where(search_filter)
        count_q = count_q.where(search_filter)

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Contact.name).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total
```

### Step 5: Update deal service

Replace `list_deals` in `backend/app/modules/crm/services/deal.py`:

```python
from sqlalchemy import func, select

async def list_deals(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID | None = None,
    stage: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Deal], int]:
    q = select(Deal).where(Deal.workspace_id == workspace_id)
    count_q = select(func.count(Deal.id)).where(Deal.workspace_id == workspace_id)

    if contact_id:
        q = q.where(Deal.contact_id == contact_id)
        count_q = count_q.where(Deal.contact_id == contact_id)
    if stage:
        q = q.where(Deal.stage == stage)
        count_q = count_q.where(Deal.stage == stage)
    if search:
        pattern = f"%{search}%"
        q = q.where(Deal.title.ilike(pattern))
        count_q = count_q.where(Deal.title.ilike(pattern))

    total = await db.scalar(count_q) or 0
    result = await db.scalars(
        q.order_by(Deal.title).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.all()), total
```

### Step 6: Update contacts router

Modify list endpoint in `backend/app/modules/crm/routers/contacts.py`:

```python
from app.modules.crm.schemas.pagination import PaginatedResponse

@router.get(
    "/workspaces/{workspace_id}/contacts",
    response_model=PaginatedResponse[ContactResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_contacts(db, workspace_id, search, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)
```

Also add `Query` to imports and update delete to require `admin` role (match WMS pattern).

### Step 7: Update deals router

Modify list endpoint in `backend/app/modules/crm/routers/deals.py`:

```python
from app.modules.crm.schemas.pagination import PaginatedResponse

@router.get(
    "/workspaces/{workspace_id}/deals",
    response_model=PaginatedResponse[DealResponse],
)
async def list_(
    workspace_id: uuid.UUID,
    contact_id: uuid.UUID | None = Query(default=None),
    stage: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_workspace_role("guest")),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_deals(
        db, workspace_id, contact_id, stage, search, page, page_size
    )
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)
```

Also update delete to require `admin` role.

## Todo List

- [x] Create `schemas/pagination.py`
- [x] Add timestamps to `ContactResponse`
- [x] Add timestamps to `DealResponse`
- [x] Update `list_contacts` service with search + pagination
- [x] Update `list_deals` service with stage filter + search + pagination
- [x] Update contacts router (PaginatedResponse, Query params, admin delete)
- [x] Update deals router (PaginatedResponse, Query params, admin delete)
- [x] Run `make lint` to verify no errors
- [x] Run `make test` to verify no regressions

## Success Criteria

- `GET /api/v1/crm/workspaces/{id}/contacts?search=foo&page=1&page_size=20` returns `PaginatedResponse`
- `GET /api/v1/crm/workspaces/{id}/deals?stage=lead&search=bar&page=1` returns `PaginatedResponse`
- Responses include `created_at` and `updated_at` timestamps
- Delete endpoints require `admin` role
- All existing create/get/update endpoints unchanged

## Risk Assessment

- **Low risk:** No migration changes, only service/schema/router modifications
- Existing endpoint signatures for create/get/update/delete unchanged
- Only list endpoint response shape changes (from `list[T]` to `PaginatedResponse[T]`)
