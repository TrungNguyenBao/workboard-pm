"""Import all models so Alembic can detect them via Base.metadata."""

# Shared models
from app.models.team import Team, TeamMembership  # noqa: F401
from app.models.token import RefreshToken  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.workspace import Workspace, WorkspaceMembership  # noqa: F401

# CRM module models
from app.modules.crm.models import Account, Activity, Campaign, Contact, Deal, Lead, Ticket  # noqa: F401

# HRM module models
from app.modules.hrm.models import Department, Employee, LeaveRequest, LeaveType, PayrollRecord  # noqa: F401

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
