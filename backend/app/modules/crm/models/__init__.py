"""CRM module models — imported for Alembic discovery via app.models.__init__."""

from app.modules.crm.models.account import Account  # noqa: F401
from app.modules.crm.models.activity import Activity  # noqa: F401
from app.modules.crm.models.campaign import Campaign  # noqa: F401
from app.modules.crm.models.contact import Contact  # noqa: F401
from app.modules.crm.models.deal import Deal  # noqa: F401
from app.modules.crm.models.lead import Lead  # noqa: F401
from app.modules.crm.models.pipeline_stage import PipelineStage  # noqa: F401
from app.modules.crm.models.scoring_config import ScoringConfig  # noqa: F401
from app.modules.crm.models.ticket import Ticket  # noqa: F401
