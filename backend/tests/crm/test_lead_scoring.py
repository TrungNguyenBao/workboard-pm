"""Unit tests for lead scoring pure functions in lead_workflows.py."""
import pytest
from unittest.mock import MagicMock

from app.modules.crm.services.lead_workflows import calculate_initial_lead_score, get_score_level
from app.modules.crm.models.lead import Lead


def make_lead_mock(**kwargs) -> Lead:
    """Create a Lead-like mock with given attributes."""
    lead = MagicMock(spec=Lead)
    lead.source = kwargs.get("source", "manual")
    lead.email = kwargs.get("email", None)
    lead.phone = kwargs.get("phone", None)
    lead.campaign_id = kwargs.get("campaign_id", None)
    lead.name = kwargs.get("name", "X")
    return lead


# --- calculate_initial_lead_score: source score component ---

class TestLeadScoreBySource:
    def test_website_source(self):
        lead = make_lead_mock(source="website")
        assert calculate_initial_lead_score(lead) == 15

    def test_form_source(self):
        lead = make_lead_mock(source="form")
        assert calculate_initial_lead_score(lead) == 20

    def test_referral_source(self):
        lead = make_lead_mock(source="referral")
        assert calculate_initial_lead_score(lead) == 25

    def test_ads_source(self):
        lead = make_lead_mock(source="ads")
        assert calculate_initial_lead_score(lead) == 10

    def test_manual_source(self):
        lead = make_lead_mock(source="manual")
        assert calculate_initial_lead_score(lead) == 5

    def test_unknown_source_defaults_to_5(self):
        lead = make_lead_mock(source="cold_call")
        assert calculate_initial_lead_score(lead) == 5

    def test_other_unknown_source(self):
        lead = make_lead_mock(source="trade_show")
        assert calculate_initial_lead_score(lead) == 5


# --- calculate_initial_lead_score: data completeness bonuses ---

class TestLeadScoreDataCompleteness:
    def test_email_adds_20_points(self):
        lead_no_email = make_lead_mock(source="manual", email=None)
        lead_with_email = make_lead_mock(source="manual", email="a@b.com")
        diff = calculate_initial_lead_score(lead_with_email) - calculate_initial_lead_score(lead_no_email)
        assert diff == 20

    def test_phone_adds_15_points(self):
        lead_no_phone = make_lead_mock(source="manual", phone=None)
        lead_with_phone = make_lead_mock(source="manual", phone="0123456789")
        diff = calculate_initial_lead_score(lead_with_phone) - calculate_initial_lead_score(lead_no_phone)
        assert diff == 15

    def test_campaign_id_adds_10_points(self):
        import uuid
        lead_no_campaign = make_lead_mock(source="manual", campaign_id=None)
        lead_with_campaign = make_lead_mock(source="manual", campaign_id=uuid.uuid4())
        diff = (
            calculate_initial_lead_score(lead_with_campaign)
            - calculate_initial_lead_score(lead_no_campaign)
        )
        assert diff == 10

    def test_long_name_adds_10_points(self):
        lead_short = make_lead_mock(source="manual", name="Jo")
        lead_long = make_lead_mock(source="manual", name="John Doe")
        diff = calculate_initial_lead_score(lead_long) - calculate_initial_lead_score(lead_short)
        assert diff == 10

    def test_name_exactly_3_chars_no_bonus(self):
        lead = make_lead_mock(source="manual", name="Joe")
        # name is NOT > 3, so no bonus; only source score
        assert calculate_initial_lead_score(lead) == 5

    def test_full_data_referral_capped_at_100(self):
        import uuid
        lead = make_lead_mock(
            source="referral",
            email="a@b.com",
            phone="0123456789",
            campaign_id=uuid.uuid4(),
            name="Jane Doe",
        )
        # 25 + 20 + 15 + 10 + 10 = 80, under cap
        assert calculate_initial_lead_score(lead) == 80

    def test_score_never_exceeds_100(self):
        import uuid
        # Craft a scenario that would exceed 100 without cap
        lead = make_lead_mock(
            source="referral",  # 25
            email="a@b.com",    # +20
            phone="0123",       # +15
            campaign_id=uuid.uuid4(),  # +10
            name="Long Name Here",     # +10
        )
        result = calculate_initial_lead_score(lead)
        assert result <= 100


# --- get_score_level: threshold boundaries ---

class TestGetScoreLevel:
    def test_score_0_is_cold(self):
        assert get_score_level(0) == "cold"

    def test_score_25_is_cold(self):
        assert get_score_level(25) == "cold"

    def test_score_26_is_warm(self):
        assert get_score_level(26) == "warm"

    def test_score_60_is_warm(self):
        assert get_score_level(60) == "warm"

    def test_score_61_is_hot(self):
        assert get_score_level(61) == "hot"

    def test_score_100_is_hot(self):
        assert get_score_level(100) == "hot"

    def test_midrange_warm(self):
        assert get_score_level(45) == "warm"
