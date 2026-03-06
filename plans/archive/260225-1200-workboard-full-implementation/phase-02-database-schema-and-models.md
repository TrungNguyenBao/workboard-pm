# Phase 02 — Database Schema & Models

## Overview
- **Priority:** Critical
- **Status:** Pending
- **Description:** All SQLAlchemy 2.0 async models, enums, relationships, indexes. Alembic initial migration.

## Context Links
- [Tech Stack](../../docs/tech-stack.md)
- [Feature Analysis](../reports/researcher-features-asana-analysis.md)

## Related Code Files

### Create
```
backend/app/models/
  __init__.py
  base.py          # TimestampMixin, UUIDMixin
  user.py
  workspace.py
  team.py
  project.py
  section.py
  task.py          # Task, Subtask (self-ref), Tag, TaskTag, TaskFollower, TaskDependency
  comment.py       # Comment, CommentMention
  attachment.py
  notification.py
  refresh_token.py
alembic/versions/001_initial_schema.py
```

## Implementation Steps

### 1. Base mixins (app/models/base.py)
```python
import uuid
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import mapped_column, Mapped
from app.core.database import Base

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
```

### 2. Enums (app/models/enums.py)
```python
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
    TASK_UPDATED = "task_updated"   # for followers
    COMMENT_ADDED = "comment_added"
    COMMENT_MENTIONED = "comment_mentioned"
    DUE_SOON = "due_soon"
    OVERDUE = "overdue"
```

### 3. User model (app/models/user.py)
```python
import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    workspace_memberships: Mapped[list["WorkspaceMembership"]] = relationship(back_populates="user")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
```

### 4. Workspace model (app/models/workspace.py)
```python
import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.core.database import Base
from app.models.base import TimestampMixin

class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])
    memberships: Mapped[list["WorkspaceMembership"]] = relationship(back_populates="workspace")
    teams: Mapped[list["Team"]] = relationship(back_populates="workspace")
    projects: Mapped[list["Project"]] = relationship(back_populates="workspace")
    tags: Mapped[list["Tag"]] = relationship(back_populates="workspace")

class WorkspaceMembership(Base, TimestampMixin):
    __tablename__ = "workspace_memberships"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="member")  # WorkspaceRole enum
    invite_token: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)

    workspace: Mapped["Workspace"] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship(back_populates="workspace_memberships")
```

### 5. Team models (app/models/team.py)
```python
class Team(Base, TimestampMixin):
    __tablename__ = "teams"
    id, workspace_id, name, description, color
    memberships: list["TeamMembership"]

class TeamMembership(Base, TimestampMixin):
    __tablename__ = "team_memberships"
    id, team_id, user_id, role (owner/member)
```

### 6. Project models (app/models/project.py)
```python
class Project(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"
    id, workspace_id, team_id (nullable), name, description, color, icon
    visibility: ProjectVisibility
    is_archived: bool
    owner_id: FK(users.id)
    sections, memberships, tasks (via sections)

class ProjectMembership(Base, TimestampMixin):
    __tablename__ = "project_memberships"
    id, project_id, user_id, role: ProjectRole

class Section(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "sections"
    id, project_id, name, position (float), color
    tasks: list["Task"]
```

### 7. Task models (app/models/task.py)
```python
class Task(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tasks"

    id: UUID PK
    project_id: FK(projects.id), index
    section_id: FK(sections.id), nullable, index
    parent_id: FK(tasks.id), nullable, index   # subtask
    creator_id: FK(users.id)
    assignee_id: FK(users.id), nullable, index
    title: str(500)
    description: str (text, nullable)           # Tiptap HTML/JSON
    status: TaskStatus = INCOMPLETE
    priority: TaskPriority = NONE
    position: float                             # for drag-drop ordering
    due_date: Date, nullable
    start_date: Date, nullable
    completed_at: DateTime, nullable
    # search
    search_vector: Mapped[str | None]          # tsvector column for FTS

    subtasks: list["Task"] back_populates parent
    tags: list["Tag"] via TaskTag M:M
    followers: list["TaskFollower"]
    blocked_by: list["TaskDependency"] (as dependent)
    blocking: list["TaskDependency"] (as dependency)
    comments: list["Comment"]
    attachments: list["Attachment"]

class Tag(Base, TimestampMixin):
    __tablename__ = "tags"
    id, workspace_id, name, color

class TaskTag(Base):
    __tablename__ = "task_tags"
    task_id, tag_id  # composite PK

class TaskFollower(Base, TimestampMixin):
    __tablename__ = "task_followers"
    task_id, user_id  # composite PK

class TaskDependency(Base, TimestampMixin):
    __tablename__ = "task_dependencies"
    # task(dependent_id) is blocked by task(dependency_id)
    dependent_id: FK(tasks.id)
    dependency_id: FK(tasks.id)
    composite PK(dependent_id, dependency_id)
```

### 8. Comment model (app/models/comment.py)
```python
class Comment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "comments"
    id, task_id, author_id, content (text), is_system (bool, default False)
    mentions: list["CommentMention"]

class CommentMention(Base):
    __tablename__ = "comment_mentions"
    id, comment_id, user_id  # who was mentioned
```

### 9. Attachment model (app/models/attachment.py)
```python
class Attachment(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "attachments"
    id, task_id, uploader_id
    filename: str(255)
    file_path: str(500)   # relative to UPLOAD_DIR
    file_size: int         # bytes
    mime_type: str(100)
    url: str(500)         # nullable, for URL attachments
```

### 10. Notification model (app/models/notification.py)
```python
class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"
    id, user_id (recipient), actor_id (who caused it, nullable)
    type: NotificationType
    entity_type: str(50)   # "task", "comment", "project"
    entity_id: UUID
    message: str(500)
    is_read: bool = False
    read_at: DateTime nullable
```

### 11. RefreshToken model (app/models/refresh_token.py)
```python
class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"
    id, user_id, token_hash (str, unique, index)
    expires_at: DateTime
    is_revoked: bool = False
    family: str(36)   # UUID string, for token rotation invalidation
```

### 12. Indexes to create
```sql
-- FTS search vector
CREATE INDEX tasks_search_idx ON tasks USING gin(search_vector);
-- Ordering queries
CREATE INDEX tasks_project_section_position ON tasks(project_id, section_id, position);
CREATE INDEX tasks_assignee_due_date ON tasks(assignee_id, due_date) WHERE deleted_at IS NULL;
-- Notifications
CREATE INDEX notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

### 13. Alembic migration
```bash
cd backend
uv run alembic revision --autogenerate -m "initial_schema"
# Review generated file — add GIN index, tsvector column manually
uv run alembic upgrade head
```

## Todo
- [ ] Create all model files
- [ ] Create enums.py
- [ ] Import all models in `__init__.py`
- [ ] Run `alembic revision --autogenerate`
- [ ] Review migration, add missing indexes + tsvector
- [ ] Run `alembic upgrade head`
- [ ] Verify all tables created: `psql workboard -c "\dt"`

## Success Criteria
- All tables created without errors
- FTS index (GIN) created on search_vector
- Foreign key constraints all valid
- `alembic current` shows head

## Risk Assessment
- Self-referential Task (parent_id) may need explicit `remote_side` in relationship — check SQLAlchemy docs
- tsvector column needs PostgreSQL trigger or app-level update on title/description change

## Security Considerations
- `hashed_password` never returned in API schemas — use separate response schema without it
- `refresh_token` stored as hash (SHA-256) not raw value

## Next Steps
→ Phase 03: backend auth
