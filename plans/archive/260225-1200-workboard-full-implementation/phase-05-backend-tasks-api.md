# Phase 05 — Backend Tasks API

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Full task CRUD, subtasks, dependencies, tags, followers, comments, attachments, search

## Context Links
- [Features](../reports/researcher-features-asana-analysis.md) §1 §2 §8

## Related Code Files

### Create
```
backend/app/
  schemas/task.py
  schemas/comment.py
  schemas/attachment.py
  schemas/tag.py
  services/task_service.py
  services/comment_service.py
  services/attachment_service.py
  services/search_service.py
  api/v1/routers/tasks.py
  api/v1/routers/comments.py
  api/v1/routers/attachments.py
  api/v1/routers/tags.py
  api/v1/routers/search.py
```

## Endpoints

### Tasks
```
GET    /projects/{pid}/tasks         → list tasks in project (with filters + FTS query)
POST   /projects/{pid}/tasks         → create task
GET    /tasks/{id}                   → task detail (full)
PUT    /tasks/{id}                   → update task fields
DELETE /tasks/{id}                   → soft delete
POST   /tasks/{id}/restore           → restore soft-deleted
POST   /tasks/{id}/complete          → mark complete (sets completed_at)
POST   /tasks/{id}/incomplete        → mark incomplete
POST   /projects/{pid}/tasks/reorder → bulk position update [{id, section_id, position}]
POST   /tasks/bulk                   → bulk complete/assign/move-section
GET    /tasks/my-tasks               → current user assigned tasks (all projects), grouped by due bucket
```

### Subtasks
```
GET    /tasks/{id}/subtasks   → list direct children
POST   /tasks/{id}/subtasks   → create subtask (validate depth ≤ 3)
```

### Dependencies
```
GET    /tasks/{id}/dependencies     → blocked_by + blocking lists
POST   /tasks/{id}/blocked-by/{dep} → add dependency
DELETE /tasks/{id}/blocked-by/{dep} → remove dependency
```

### Tags
```
GET    /tags              → workspace tags list
POST   /tags              → create tag
PUT    /tags/{id}         → update tag name/color
DELETE /tags/{id}         → delete tag (detach from all tasks first)
POST   /tasks/{id}/tags/{tag_id}    → attach tag
DELETE /tasks/{id}/tags/{tag_id}    → detach tag
```

### Task Followers
```
POST   /tasks/{id}/follow   → add current user as follower
DELETE /tasks/{id}/follow   → remove current user as follower
```

### Comments
```
GET    /tasks/{id}/comments   → list (chronological, includes system events)
POST   /tasks/{id}/comments   → create comment (parse @mentions → create notifications)
PUT    /comments/{id}         → edit (author only)
DELETE /comments/{id}         → soft delete (author or project owner)
```

### Attachments
```
POST   /tasks/{id}/attachments       → upload file (multipart/form-data)
GET    /tasks/{id}/attachments       → list attachments
DELETE /attachments/{id}             → delete file + remove from disk
```

### Search
```
GET    /search?q=<query>&project_id=&assignee=&priority=&status=&due_before=&due_after=&tag=
```

## Implementation Details

### Task Service — key methods
```python
async def create_task(db, project_id, section_id, creator_id, data: TaskCreate) -> Task:
    # Assign position = max_position_in_section + 1000
    # Create activity event: "created task"
    # Notify assignee if set

async def update_task(db, task_id, user_id, data: TaskUpdate) -> Task:
    # Build activity events for changed fields (assignee, due_date, status, priority)
    # Update search_vector tsvector
    # NOTIFY pg channel 'workspace_{wid}' with JSON payload
    # Notify followers of significant changes

async def list_tasks(db, project_id, filters: TaskFilters) -> list[Task]:
    # Build SQLAlchemy select with dynamic WHERE clauses
    # Support: section_id, assignee_id, priority, status, due_before, due_after, tag_ids, q (FTS)
    # Order by section position then task position

async def reorder_tasks(db, updates: list[TaskPositionUpdate]) -> None:
    # Bulk update position + section_id for drag-drop
    # Use fractional indexing; normalize if gap < 0.01
```

### FTS (search_vector update)
Option A — DB trigger (preferred):
```sql
CREATE OR REPLACE FUNCTION update_task_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', COALESCE(NEW.title,'') || ' ' || COALESCE(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_task_search_vector();
```
Add trigger in Alembic migration.

Option B — app-level: call `func.to_tsvector('english', task.title + ' ' + description)` on save.

### Comment @mention parsing
```python
import re

MENTION_PATTERN = re.compile(r'@\[([^\]]+)\]\(([a-f0-9-]+)\)')

async def create_comment(db, task_id, author_id, content: str) -> Comment:
    comment = Comment(task_id=task_id, author_id=author_id, content=content)
    db.add(comment)
    # Parse mentions
    for match in MENTION_PATTERN.finditer(content):
        user_id = match.group(2)
        db.add(CommentMention(comment_id=comment.id, user_id=user_id))
        await notification_service.create(db, user_id, NotificationType.COMMENT_MENTIONED, ...)
    await db.commit()
    # NOTIFY pg channel
```

### File upload
```python
@router.post("/tasks/{task_id}/attachments")
async def upload_attachment(
    task_id: UUID,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if file.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, "File too large")
    # Save to UPLOAD_DIR/{task_id}/{uuid}_{filename}
    # Create Attachment record
```

## Todo
- [ ] Implement task CRUD + filters + FTS
- [ ] Implement position management (create + reorder + normalize)
- [ ] Add DB trigger for search_vector updates (in migration)
- [ ] Implement subtask creation with depth check
- [ ] Implement task dependencies (no circular dependency check)
- [ ] Implement tags CRUD + attach/detach
- [ ] Implement followers add/remove
- [ ] Implement comments with @mention parsing + notification creation
- [ ] Implement file upload (multipart) + attachment CRUD
- [ ] Implement search endpoint (FTS + filters)
- [ ] Implement my-tasks endpoint (grouped by due bucket)
- [ ] Implement bulk operations endpoint

## Success Criteria
- Create task → appears in section at correct position
- Drag task to new section → position updates, section_id updates
- FTS search returns relevant tasks
- @mention in comment → notification created for mentioned user
- File upload saves to disk, attachment record created
- Subtask depth > 3 returns 400

## Security Considerations
- Validate file mime type (allowlist: image/*, application/pdf, text/*, etc.)
- Sanitize filename (no path traversal: `os.path.basename`)
- Circular dependency check: A blocked-by B, B blocked-by A → 400

## Next Steps
→ Phase 06: real-time SSE + notifications
