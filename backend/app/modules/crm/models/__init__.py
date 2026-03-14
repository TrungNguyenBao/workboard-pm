"""CRM module models — imported for Alembic discovery via app.models.__init__."""

from app.modules.crm.models.account import Account  # noqa: F401
from app.modules.crm.models.activity import Activity  # noqa: F401
from app.modules.crm.models.campaign import Campaign  # noqa: F401
from app.modules.crm.models.competitor import Competitor  # noqa: F401
from app.modules.crm.models.contact import Contact  # noqa: F401
from app.modules.crm.models.contract import Contract  # noqa: F401
from app.modules.crm.models.crm_attachment import CrmAttachment  # noqa: F401
from app.modules.crm.models.crm_custom_field import CrmCustomField  # noqa: F401
from app.modules.crm.models.crm_notification import CrmNotification  # noqa: F401
from app.modules.crm.models.deal import Deal  # noqa: F401
from app.modules.crm.models.deal_contact_role import DealContactRole  # noqa: F401
from app.modules.crm.models.email_log import EmailLog  # noqa: F401
from app.modules.crm.models.email_template import EmailTemplate  # noqa: F401
from app.modules.crm.models.import_job import ImportJob  # noqa: F401
from app.modules.crm.models.lead import Lead  # noqa: F401
from app.modules.crm.models.pipeline_stage import PipelineStage  # noqa: F401
from app.modules.crm.models.product_service import ProductService  # noqa: F401
from app.modules.crm.models.quotation import Quotation  # noqa: F401
from app.modules.crm.models.quotation_line import QuotationLine  # noqa: F401
from app.modules.crm.models.sales_forecast import SalesForecast  # noqa: F401
from app.modules.crm.models.scoring_config import ScoringConfig  # noqa: F401
from app.modules.crm.models.ticket import Ticket  # noqa: F401
