"""Service-layer tests for contract.py — lifecycle, renewal, termination."""
import uuid
from datetime import date, timedelta

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.schemas.contract import ContractCreate
from app.modules.crm.services.contract import (
    activate_contract,
    create_contract,
    get_contract,
    list_contracts,
    renew_contract,
    terminate_contract,
)

from tests.crm.conftest import make_account, make_contract, make_workspace


@pytest_asyncio.fixture
async def ws(db: AsyncSession):
    return await make_workspace(db)


@pytest_asyncio.fixture
async def account(db: AsyncSession, ws):
    return await make_account(db, ws.id)


# --- create_contract ---


@pytest.mark.asyncio
async def test_create_contract(db: AsyncSession, ws, account):
    data = ContractCreate(
        account_id=account.id,
        contract_number="CT-TEST-001",
        title="Service Agreement",
        start_date=date.today(),
        value=5000.0,
    )
    contract = await create_contract(db, ws.id, data)
    assert contract.id is not None
    assert contract.status == "draft"
    assert contract.title == "Service Agreement"


# --- activate_contract ---


@pytest.mark.asyncio
async def test_activate_draft_contract(db: AsyncSession, ws, account):
    contract = await make_contract(db, account.id, ws.id)
    activated = await activate_contract(db, contract.id, ws.id, signed_date=date.today())
    assert activated.status == "active"
    assert activated.signed_date == date.today()


@pytest.mark.asyncio
async def test_activate_non_draft_raises(db: AsyncSession, ws, account):
    contract = await make_contract(db, account.id, ws.id)
    await activate_contract(db, contract.id, ws.id, signed_date=date.today())
    with pytest.raises(HTTPException) as exc:
        await activate_contract(db, contract.id, ws.id, signed_date=date.today())
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_activate_without_signed_date_raises(db: AsyncSession, ws, account):
    contract = await make_contract(db, account.id, ws.id)
    # No signed_date on model, none provided
    with pytest.raises(HTTPException) as exc:
        await activate_contract(db, contract.id, ws.id, signed_date=None)
    assert exc.value.status_code == 400


# --- renew_contract ---


@pytest.mark.asyncio
async def test_renew_contract(db: AsyncSession, ws, account):
    start = date.today()
    end = start + timedelta(days=365)
    contract = await make_contract(
        db, account.id, ws.id, start_date=start, end_date=end
    )
    renewal = await renew_contract(db, contract.id, ws.id)
    assert renewal.status == "draft"
    assert renewal.start_date == end
    assert renewal.end_date == end + timedelta(days=365)
    assert "(Renewal)" in renewal.title


@pytest.mark.asyncio
async def test_renew_contract_default_duration(db: AsyncSession, ws, account):
    # No end_date → 365 days default
    contract = await make_contract(db, account.id, ws.id, end_date=None)
    renewal = await renew_contract(db, contract.id, ws.id)
    assert renewal.status == "draft"
    # new_start = today (since end_date is None), new_end = today + 365
    expected_end = date.today() + timedelta(days=365)
    assert renewal.end_date == expected_end


# --- terminate_contract ---


@pytest.mark.asyncio
async def test_terminate_draft(db: AsyncSession, ws, account):
    contract = await make_contract(db, account.id, ws.id, status="draft")
    terminated = await terminate_contract(db, contract.id, ws.id)
    assert terminated.status == "terminated"


@pytest.mark.asyncio
async def test_terminate_active(db: AsyncSession, ws, account):
    contract = await make_contract(db, account.id, ws.id, status="draft")
    await activate_contract(db, contract.id, ws.id, signed_date=date.today())
    terminated = await terminate_contract(db, contract.id, ws.id)
    assert terminated.status == "terminated"


@pytest.mark.asyncio
async def test_terminate_already_terminated_raises(db: AsyncSession, ws, account):
    contract = await make_contract(db, account.id, ws.id, status="draft")
    await terminate_contract(db, contract.id, ws.id)
    with pytest.raises(HTTPException) as exc:
        await terminate_contract(db, contract.id, ws.id)
    assert exc.value.status_code == 400


# --- list_contracts ---


@pytest.mark.asyncio
async def test_list_contracts_filter_by_account(db: AsyncSession, ws, account):
    other_account = await make_account(db, ws.id)
    await make_contract(db, account.id, ws.id)
    await make_contract(db, other_account.id, ws.id)
    contracts, total = await list_contracts(db, ws.id, account_id=account.id)
    assert all(c.account_id == account.id for c in contracts)
    assert total >= 1


@pytest.mark.asyncio
async def test_list_contracts_filter_by_status(db: AsyncSession, ws, account):
    c1 = await make_contract(db, account.id, ws.id, status="draft")
    await activate_contract(db, c1.id, ws.id, signed_date=date.today())
    await make_contract(db, account.id, ws.id, status="draft")
    active_contracts, _ = await list_contracts(db, ws.id, status="active")
    assert all(c.status == "active" for c in active_contracts)
