# Phase 04 — Backend: Workspace, Teams, Projects & RBAC

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Workspace management, teams, project CRUD, sections, RBAC middleware

## Context Links
- [Features](../reports/researcher-features-asana-analysis.md) §5 §6

## Related Code Files

### Create
```
backend/app/
  schemas/workspace.py
  schemas/team.py
  schemas/project.py
  schemas/section.py
  services/workspace_service.py
  services/team_service.py
  services/project_service.py
  api/v1/routers/workspaces.py
  api/v1/routers/teams.py
  api/v1/routers/projects.py
  api/v1/routers/sections.py
  api/v1/dependencies/rbac.py
```

## RBAC Design

```
WorkspaceRole: admin > member > guest
ProjectRole: owner > editor > commenter > viewer

Permission checks:
  - View project: workspace member with project access
  - Edit tasks: project role >= editor
  - Manage sections: project role >= editor
  - Project settings: project role = owner
  - Workspace admin only: manage workspace members, delete workspace
```

## Implementation Steps

### 1. dependencies/rbac.py
```python
async def get_workspace_membership(current_user, db) -> WorkspaceMembership:
    # Query WorkspaceMembership for current_user
    # Raise 403 if not member

async def require_workspace_role(min_role: WorkspaceRole):
    def dep(membership=Depends(get_workspace_membership)):
        if role_level(membership.role) < role_level(min_role):
            raise HTTPException(403, "Insufficient workspace role")
    return dep

async def get_project_membership(project_id: UUID, current_user, db) -> ProjectRole:
    # Check ProjectMembership, or fall back to team membership if project is "team" visibility
    # Return effective role

async def require_project_role(min_role: ProjectRole):
    def dep(role=Depends(get_project_membership)):
        if role_level(role) < role_level(min_role): raise 403
    return dep
```

### 2. Workspace router (GET/PUT workspace, members CRUD)
```
GET    /workspace                → workspace details
PUT    /workspace                → update name (admin only)
GET    /workspace/members        → list all members
POST   /workspace/members/invite → invite by email (admin)
DELETE /workspace/members/{id}   → remove member (admin)
PUT    /workspace/members/{id}   → change role (admin)
POST   /workspace/join/{token}   → accept invite
```

### 3. Teams router
```
GET    /teams              → list workspace teams (member of, or admin sees all)
POST   /teams              → create team
GET    /teams/{id}         → team details + members
PUT    /teams/{id}         → update name/description (team owner or ws admin)
DELETE /teams/{id}         → delete team
GET    /teams/{id}/members → list members
POST   /teams/{id}/members → add member
PUT    /teams/{id}/members/{uid} → change role
DELETE /teams/{id}/members/{uid} → remove member
```

### 4. Projects router
```
GET    /projects              → list accessible projects (filtered by workspace membership + project visibility)
POST   /projects              → create project (workspace member, auto-assign as owner)
GET    /projects/{id}         → project detail (must have access)
PUT    /projects/{id}         → update (project owner or ws admin)
DELETE /projects/{id}         → soft delete (project owner or ws admin)
POST   /projects/{id}/archive → archive project
GET    /projects/{id}/members → list members
POST   /projects/{id}/members → add member (owner only)
PUT    /projects/{id}/members/{uid} → change role (owner only)
DELETE /projects/{id}/members/{uid} → remove (owner only)
```

Project visibility logic:
- `private` → only explicit ProjectMembership members
- `team` → all TeamMembership members for project.team_id
- `public` → all WorkspaceMembership members

### 5. Sections router
```
GET    /projects/{id}/sections      → list ordered sections
POST   /projects/{id}/sections      → create section (editor+)
PUT    /projects/{id}/sections/{sid} → update name/color (editor+)
DELETE /projects/{id}/sections/{sid} → soft delete (editor+)
POST   /projects/{id}/sections/reorder → bulk position update [{id, position}]
```

Position management (float trick):
- New section at end: position = max_position + 1000
- Reorder: position = (prev_position + next_position) / 2
- Normalize when gap < 0.01

## Todo
- [ ] Implement rbac.py dependencies
- [ ] Implement workspace service + router
- [ ] Implement team service + router
- [ ] Implement project service + router (with visibility logic)
- [ ] Implement section service + router
- [ ] Test: create project → add member → verify 403 for viewer on edit → verify 200 for editor
- [ ] Test: project visibility (private/team/public)

## Success Criteria
- Workspace member can list projects respecting visibility
- Non-member gets 404 (not 403 — don't leak existence) on private project
- Section reorder updates positions correctly
- Invite token creates workspace membership on accept

## Security Considerations
- Return 404 (not 403) for inaccessible private projects — don't leak existence
- Validate invite token expiry (24h)
- Workspace admin cannot be demoted by non-admin

## Next Steps
→ Phase 05: tasks API
