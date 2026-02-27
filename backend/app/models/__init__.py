"""Import all models so Alembic can detect them via Base.metadata."""

from app.models.activity_log import ActivityLog  # noqa: F401
from app.models.goal import Goal, GoalProjectLink, GoalTaskLink  # noqa: F401
from app.models.custom_field import CustomFieldDefinition  # noqa: F401
from app.models.attachment import Attachment  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.project import Project, ProjectMembership, Section  # noqa: F401
from app.models.tag import Tag  # noqa: F401
from app.models.task import Task, TaskDependency, TaskFollower, TaskTag  # noqa: F401
from app.models.team import Team, TeamMembership  # noqa: F401
from app.models.token import RefreshToken  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.workspace import Workspace, WorkspaceMembership  # noqa: F401
