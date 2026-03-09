# Phase 3: Integration & UX Enhancements

## Context Links
- Phase 2 (prerequisite): `phase-02-business-logic-workflows.md`
- ARQ worker: `backend/app/worker/tasks.py`
- Existing notification service: `backend/app/services/notifications.py`
- PMS board DnD reference: `frontend/src/modules/pms/features/projects/pages/board.tsx`
- Org chart tree (current): `frontend/src/modules/hrm/features/departments/components/org-chart-tree.tsx`
- Candidate status badge: `frontend/src/modules/hrm/features/recruitment/components/candidate-status-badge.tsx`

## Overview
- **Priority:** P2
- **Status:** COMPLETE
- **Effort:** 8h
- **Description:** Email notifications via ARQ on status transitions, document upload endpoints, drag-and-drop candidate pipeline, visual org chart component, minor model field additions.

## Completion Summary (2026-03-09)
All Phase 3 deliverables successfully implemented:
- ARQ worker pool initialized in `main.py` lifespan with Redis connection
- `send_hrm_notification` job added to `worker/tasks.py` with HTML email support
- Email notifications wired into: offer (sent), leave (approved/rejected), payroll (published), resignation (status changes)
- HTML email escaping (html.escape) implemented to prevent injection vulnerabilities
- LeaveType name resolution in email bodies (not UUID references)
- `HrmDocument` model/schema/service created for file uploads (per entity_type/entity_id)
- Document router with upload/list/delete endpoints at `/hrm/workspaces/{id}/documents`
- Interview model enhanced with `room` and `panel_ids` (JSONB) fields
- `CandidatePipelineBoard` DnD component with 7-stage pipeline (applied→hired)
- `VisualOrgChart` box-and-line hierarchical layout with List/Org Chart tabs
- `CandidateDetailPanel` extracted to separate file (200-line compliance)
- Dead code (arq_pool.py) removed from codebase
- Migration 0021 applied successfully
- All frontend components respect 200-line file size limit

## Key Insights
- ARQ worker already set up with Redis connection and cron pattern. Just add new task functions.
- PMS already uses `@dnd-kit` for board view — reuse same pattern for candidate pipeline.
- `@dnd-kit` already in `package.json` — no new dependency needed.
- Notification service (`create_notification()`) exists — email is an extension, not replacement.
- File upload: system architecture doc mentions "local disk dev -> MinIO/S3 prod" but no upload infra exists yet.

## Requirements

### Functional
1. Email notifications on: offer sent, leave approved/rejected, payroll published, resignation status change
2. Document upload for employee records (personal docs, contracts, JD attachments)
3. Drag-and-drop candidate pipeline kanban board
4. Visual org chart (box-and-line hierarchical layout)
5. Minor model additions: interview `room`/`panel`, department `code` (done in Phase 1)

### Non-Functional
- Email sending is async (ARQ background job) — never blocks API response
- File uploads: max 10MB per file, validate mime types
- Frontend components under 200 lines each

## Architecture

### Email Notification Flow
```
Service function (e.g., approve_leave_request)
  -> db.commit()
  -> await arq_pool.enqueue_job("send_hrm_notification", ...)
     -> ARQ worker picks up job
     -> Renders email template (plain text or simple HTML)
     -> Sends via SMTP (configurable in .env)
```

New env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

### Document Upload
Simple approach: store files on local disk under `uploads/hrm/{workspace_id}/{employee_id}/`, serve via static files endpoint. S3 upgrade later.

New model `HrmDocument`:
```python
class HrmDocument(Base, TimestampMixin):
    __tablename__ = "hrm_documents"
    id: Mapped[uuid.UUID] (PK)
    entity_type: Mapped[str] (String(50))  # "employee", "recruitment_request", "contract"
    entity_id: Mapped[uuid.UUID]
    filename: Mapped[str] (String(255))
    file_path: Mapped[str] (String(500))  # relative path on disk
    file_size: Mapped[int]
    mime_type: Mapped[str] (String(100))
    uploaded_by_id: Mapped[uuid.UUID] (FK users)
    workspace_id: Mapped[uuid.UUID] (FK workspaces)
```

Upload endpoint: `POST /hrm/workspaces/{workspace_id}/documents?entity_type=employee&entity_id={id}`
List endpoint: `GET /hrm/workspaces/{workspace_id}/documents?entity_type=employee&entity_id={id}`

### Candidate Pipeline DnD
Reuse PMS board pattern:
- `candidate-pipeline-board.tsx` — orchestrates DnD context, maps stages to columns
- `candidate-pipeline-column.tsx` — droppable column per stage
- `candidate-pipeline-card.tsx` — draggable candidate card
- On drop: call `PATCH /candidates/{id}` with new `status` field
- Stages: `["applied", "screening", "assessment", "interviewing", "offered", "hired", "rejected"]`

### Visual Org Chart
Use CSS-based tree layout (no extra library). Render departments as boxes with lines:
- `visual-org-chart.tsx` — recursive component rendering dept tree
- Uses CSS `display: flex` + `::before`/`::after` pseudo-elements for connector lines
- Each box shows: dept name, code, head count, manager name
- Clickable to expand/navigate

## Related Code Files

### Files to Modify
| File | Change |
|------|--------|
| `backend/app/worker/tasks.py` | Add `send_hrm_notification` job function |
| `backend/app/core/config.py` | Add SMTP settings |
| `backend/app/modules/hrm/models/__init__.py` | Import HrmDocument, add Interview fields |
| `backend/app/modules/hrm/models/interview.py` | Add `room`, `panel_ids` (JSONB) columns |
| `backend/app/modules/hrm/schemas/interview.py` | Add `room`, `panel_ids` to schemas |
| `backend/app/modules/hrm/router.py` | Register document + pipeline routers |
| `frontend/src/modules/hrm/features/recruitment/pages/recruitment-detail.tsx` | Replace button-based status with pipeline board |

### Files to Create

**Backend:**
| File | Purpose |
|------|---------|
| `backend/app/modules/hrm/models/hrm_document.py` | HrmDocument model |
| `backend/app/modules/hrm/schemas/hrm_document.py` | Document schemas |
| `backend/app/modules/hrm/services/hrm_document.py` | Upload, list, delete document service |
| `backend/app/modules/hrm/routers/documents.py` | Upload/list/delete endpoints |
| `backend/app/modules/hrm/services/email_notifications.py` | Email template rendering + SMTP send |
| `backend/alembic/versions/0021_hrm_phase3_documents_interview_fields.py` | Migration |

**Frontend:**
| File | Purpose |
|------|---------|
| `frontend/src/modules/hrm/features/recruitment/components/candidate-pipeline-board.tsx` | DnD board orchestrator |
| `frontend/src/modules/hrm/features/recruitment/components/candidate-pipeline-column.tsx` | Droppable stage column |
| `frontend/src/modules/hrm/features/recruitment/components/candidate-pipeline-card.tsx` | Draggable candidate card |
| `frontend/src/modules/hrm/features/recruitment/hooks/use-move-candidate.ts` | Mutation hook for status update with optimistic update |
| `frontend/src/modules/hrm/features/departments/components/visual-org-chart.tsx` | Box-and-line org chart |
| `frontend/src/modules/hrm/features/departments/components/org-chart-node.tsx` | Single department box |

## Implementation Steps

### Step 1: Email notification service
Create `backend/app/modules/hrm/services/email_notifications.py`:
```python
import smtplib
from email.mime.text import MIMEText
from app.core.config import settings

async def send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        return  # Skip in dev if no SMTP configured
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        if settings.SMTP_USER:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
```

### Step 2: ARQ job for HRM notifications
Add to `backend/app/worker/tasks.py`:
```python
async def send_hrm_notification(ctx: dict, to_email: str, subject: str, body: str) -> None:
    from app.modules.hrm.services.email_notifications import send_email
    await send_email(to_email, subject, body)
```
Register in `WorkerSettings.functions`.

### Step 3: Wire email triggers in services
In each service's status transition function, after commit:
```python
# Example in offer.py send_offer()
if employee_email:
    await arq_pool.enqueue_job(
        "send_hrm_notification",
        to_email=candidate_email,
        subject=f"Job Offer: {offer.position_title}",
        body=render_offer_email(offer),
    )
```

### Step 4: Document upload infrastructure
Create model, schema, service. Upload endpoint uses `UploadFile`:
```python
@router.post("/workspaces/{workspace_id}/documents")
async def upload_document(
    workspace_id: uuid.UUID,
    entity_type: str = Query(...),
    entity_id: uuid.UUID = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_workspace_role("member")),
    db: AsyncSession = Depends(get_db),
):
    # Validate size (10MB max)
    # Save to uploads/hrm/{workspace_id}/{entity_id}/{filename}
    # Create HrmDocument record
```

### Step 5: Candidate pipeline board (frontend)
Create `candidate-pipeline-board.tsx` following PMS board pattern:
```tsx
// Uses DndContext from @dnd-kit/core
// Maps CANDIDATE_STAGES to columns
// onDragEnd -> useMoveCandidate mutation
const CANDIDATE_STAGES = [
  "applied", "screening", "assessment",
  "interviewing", "offered", "hired", "rejected"
];
```

### Step 6: Visual org chart (frontend)
Create `visual-org-chart.tsx`:
```tsx
// Fetch org tree from GET /hrm/workspaces/{id}/org-tree
// Recursive render: OrgChartNode for each department
// CSS flexbox layout with connector lines
// Each node shows: name, code, headcount, manager
```

### Step 7: Interview model field additions
Add to `backend/app/modules/hrm/models/interview.py`:
```python
room: Mapped[str | None] = mapped_column(String(100), nullable=True)
panel_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
# panel_ids stores list of user UUIDs for interview panel
```

### Step 8: Write migration
`0021_hrm_phase3_documents_interview_fields.py`:
- Create `hrm_documents` table with indexes on `(entity_type, entity_id)` and `workspace_id`
- Add `room` (VARCHAR(100)) and `panel_ids` (JSONB) to `interviews` table

### Step 9: Add SMTP config
In `backend/app/core/config.py`:
```python
SMTP_HOST: str = ""
SMTP_PORT: int = 587
SMTP_USER: str = ""
SMTP_PASSWORD: str = ""
SMTP_FROM: str = "noreply@a-erp.local"
```

## TODO Checklist

- [x] Add SMTP settings to `config.py` and `.env.example`
- [x] Create `email_notifications.py` service with `send_email()`
- [x] Add `send_hrm_notification` ARQ job to `worker/tasks.py`
- [x] Wire email triggers in offer, leave, payroll, resignation services
- [x] Create `HrmDocument` model, schema, service
- [x] Create document upload/list/delete router
- [x] Create `candidate-pipeline-board.tsx` with DnD context
- [x] Create `candidate-pipeline-column.tsx` droppable column
- [x] Create `candidate-pipeline-card.tsx` draggable card
- [x] Create `use-move-candidate.ts` mutation hook
- [x] Create `visual-org-chart.tsx` with recursive dept rendering
- [x] Create `org-chart-node.tsx` individual dept box
- [x] Add `room`, `panel_ids` to Interview model + schemas
- [x] Write migration `0021`
- [x] Add `assessment` to candidate stage list in backend
- [x] Run `make test` and `make lint`

## Success Criteria
1. Email sent (via ARQ) on offer sent, leave approval, payroll publication
2. SMTP failures logged but don't crash API (graceful degradation)
3. Documents uploadable and retrievable per entity
4. Candidate pipeline renders as DnD kanban; drag updates status
5. Org chart displays hierarchical box-and-line layout
6. Interview records support room and panel fields
7. All new frontend components under 200 lines

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| SMTP not configured in dev/CI | `send_email()` returns early if no SMTP_HOST; no crash |
| File uploads fill disk | 10MB limit per file; add workspace-level quota later if needed |
| DnD pipeline complex to test | Reuse PMS board test patterns; visual QA via manual testing |
| Org chart performance for deep hierarchies | Org tree API already returns flat list; frontend limits render depth to 5 levels |

## Security Considerations
- Document uploads: validate mime types (pdf, png, jpg, doc, docx only), sanitize filenames
- Uploaded files served via authenticated endpoint, not public static
- Email templates: escape all user-provided content to prevent injection
- Panel IDs (JSONB): validate as list of valid user UUIDs before save
