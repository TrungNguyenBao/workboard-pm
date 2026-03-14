"""Import all models so Alembic can detect them via Base.metadata."""

# Shared models
from app.models.team import Team, TeamMembership  # noqa: F401
from app.models.token import RefreshToken  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.workspace import Workspace, WorkspaceMembership  # noqa: F401

# CRM module models
from app.modules.crm.models import (  # noqa: F401
    Account,
    Activity,
    Campaign,
    Competitor,
    Contact,
    Contract,
    CrmAttachment,
    CrmCustomField,
    CrmNotification,
    Deal,
    DealContactRole,
    EmailLog,
    EmailTemplate,
    ImportJob,
    Lead,
    PipelineStage,
    ProductService,
    Quotation,
    QuotationLine,
    SalesForecast,
    ScoringConfig,
    Ticket,
)

# HRM module models — import all for Alembic discovery
from app.modules.hrm.models import (  # noqa: F401
    Asset,
    AssetAssignment,
    AttendanceCorrection,
    AttendanceRecord,
    Candidate,
    Department,
    Employee,
    EmployeeContract,
    ExitInterview,
    HandoverTask,
    HrmDocument,
    InsuranceRecord,
    Interview,
    KpiAssignment,
    KpiTemplate,
    LeaveRequest,
    LeaveType,
    Offer,
    OnboardingChecklist,
    OvertimeRequest,
    PayrollRecord,
    PerformanceReview,
    Position,
    PurchaseItem,
    PurchaseRequest,
    RecruitmentRequest,
    Resignation,
    ReviewFeedback,
    SalaryHistory,
    TrainingEnrollment,
    TrainingProgram,
)

# PMS module models
from app.modules.pms.models import (  # noqa: F401
    ActivityLog,
    Attachment,
    Comment,
    CustomFieldDefinition,
    Goal,
    GoalProjectLink,
    GoalTaskLink,
    Notification,
    Project,
    ProjectMembership,
    Section,
    Tag,
    Task,
    TaskDependency,
    TaskFollower,
    TaskTag,
)

# WMS module models
from app.modules.wms.models import Device, InventoryItem, Product, Supplier, Warehouse  # noqa: F401
