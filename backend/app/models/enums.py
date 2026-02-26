import enum


class WorkspaceRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"


class TeamRole(str, enum.Enum):
    OWNER = "owner"
    MEMBER = "member"


class ProjectVisibility(str, enum.Enum):
    PRIVATE = "private"
    TEAM = "team"
    PUBLIC = "public"


class ProjectRole(str, enum.Enum):
    OWNER = "owner"
    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"


class TaskPriority(str, enum.Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, enum.Enum):
    INCOMPLETE = "incomplete"
    COMPLETED = "completed"


class NotificationType(str, enum.Enum):
    TASK_ASSIGNED = "task_assigned"
    TASK_MENTIONED = "task_mentioned"
    TASK_UPDATED = "task_updated"
    COMMENT_ADDED = "comment_added"
    COMMENT_MENTIONED = "comment_mentioned"
    DUE_SOON = "due_soon"
    OVERDUE = "overdue"
