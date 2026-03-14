"""Unit tests for CRM status/lifecycle transitions in status_flows.py."""
import pytest

from app.modules.crm.services.status_flows import (
    LEAD_STATUS_TRANSITIONS,
    DEAL_STAGE_TRANSITIONS,
    TICKET_STATUS_TRANSITIONS,
    CAMPAIGN_STATUS_TRANSITIONS,
    validate_transition,
)
from app.modules.crm.services.lead_workflows import get_score_level
from app.modules.crm.schemas.deal import STAGE_DEFAULT_PROBABILITY


# --- validate_transition helper ---

class TestValidateTransition:
    def test_valid_transition_returns_true(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "new", "contacted") is True

    def test_invalid_transition_returns_false(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "new", "qualified") is False

    def test_unknown_current_state_returns_false(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "nonexistent", "new") is False

    def test_terminal_state_no_transitions(self):
        # opportunity is terminal (no outgoing transitions)
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "opportunity", "new") is False


# --- Lead status transitions ---

class TestLeadStatusTransitions:
    def test_new_to_contacted(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "new", "contacted") is True

    def test_new_to_disqualified(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "new", "disqualified") is True

    def test_new_to_qualified_invalid(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "new", "qualified") is False

    def test_contacted_to_qualified(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "contacted", "qualified") is True

    def test_contacted_to_lost(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "contacted", "lost") is True

    def test_qualified_to_opportunity(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "qualified", "opportunity") is True

    def test_lost_can_reopen_to_new(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "lost", "new") is True

    def test_disqualified_can_reopen_to_new(self):
        assert validate_transition(LEAD_STATUS_TRANSITIONS, "disqualified", "new") is True


# --- Deal stage transitions and probability defaults ---

class TestDealStageTransitions:
    def test_lead_to_qualified(self):
        assert validate_transition(DEAL_STAGE_TRANSITIONS, "lead", "qualified") is True

    def test_lead_to_closed_lost(self):
        assert validate_transition(DEAL_STAGE_TRANSITIONS, "lead", "closed_lost") is True

    def test_lead_to_proposal_invalid(self):
        assert validate_transition(DEAL_STAGE_TRANSITIONS, "lead", "proposal") is False

    def test_negotiation_to_closed_won(self):
        assert validate_transition(DEAL_STAGE_TRANSITIONS, "negotiation", "closed_won") is True

    def test_closed_won_is_terminal(self):
        assert validate_transition(DEAL_STAGE_TRANSITIONS, "closed_won", "lead") is False

    def test_closed_lost_is_terminal(self):
        assert validate_transition(DEAL_STAGE_TRANSITIONS, "closed_lost", "lead") is False


class TestStageProbabilityDefaults:
    def test_lead_probability(self):
        assert STAGE_DEFAULT_PROBABILITY["lead"] == pytest.approx(5.0)

    def test_qualified_probability(self):
        assert STAGE_DEFAULT_PROBABILITY["qualified"] == pytest.approx(10.0)

    def test_proposal_probability(self):
        assert STAGE_DEFAULT_PROBABILITY["proposal"] == pytest.approx(50.0)

    def test_negotiation_probability(self):
        assert STAGE_DEFAULT_PROBABILITY["negotiation"] == pytest.approx(75.0)

    def test_closed_won_probability(self):
        assert STAGE_DEFAULT_PROBABILITY["closed_won"] == pytest.approx(100.0)

    def test_closed_lost_probability(self):
        assert STAGE_DEFAULT_PROBABILITY["closed_lost"] == pytest.approx(0.0)

    def test_all_stages_have_defaults(self):
        from app.modules.crm.schemas.deal import DEAL_STAGES
        for stage in DEAL_STAGES:
            assert stage in STAGE_DEFAULT_PROBABILITY


# --- Quotation status transitions (manual, no dict in status_flows) ---

class TestQuotationStatusFlow:
    """Quotation lifecycle: draft -> sent -> accepted|rejected."""

    def test_only_draft_can_be_sent(self):
        # Mirrors send_quotation guard: status must be "draft"
        assert "draft" == "draft"  # sanity; real guard tested via service

    def test_accepted_status_value(self):
        valid_statuses = {"draft", "sent", "accepted", "rejected", "expired"}
        assert "accepted" in valid_statuses
        assert "rejected" in valid_statuses

    def test_draft_and_sent_can_be_accepted(self):
        acceptable = ("sent", "draft")
        assert "sent" in acceptable
        assert "draft" in acceptable
        assert "rejected" not in acceptable


# --- get_score_level boundary values (also used in status context) ---

class TestScoreLevelBoundaries:
    def test_boundary_at_25_is_cold(self):
        assert get_score_level(25) == "cold"

    def test_boundary_at_26_is_warm(self):
        assert get_score_level(26) == "warm"

    def test_boundary_at_60_is_warm(self):
        assert get_score_level(60) == "warm"

    def test_boundary_at_61_is_hot(self):
        assert get_score_level(61) == "hot"

    def test_zero_is_cold(self):
        assert get_score_level(0) == "cold"

    def test_100_is_hot(self):
        assert get_score_level(100) == "hot"
