"""PMS module models — imported for Alembic discovery via app.models.__init__."""

from app.modules.pms.models.activity_log import ActivityLog  # noqa: F401
from app.modules.pms.models.attachment import Attachment  # noqa: F401
from app.modules.pms.models.comment import Comment  # noqa: F401
from app.modules.pms.models.custom_field import CustomFieldDefinition  # noqa: F401
from app.modules.pms.models.goal import Goal, GoalProjectLink, GoalTaskLink  # noqa: F401
from app.modules.pms.models.notification import Notification  # noqa: F401
from app.modules.pms.models.project import Project, ProjectMembership, Section  # noqa: F401
from app.modules.pms.models.sprint import Sprint  # noqa: F401
from app.modules.pms.models.tag import Tag  # noqa: F401
from app.modules.pms.models.task import Task, TaskDependency, TaskFollower, TaskTag  # noqa: F401
