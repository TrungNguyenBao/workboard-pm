import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMembership
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


async def get_workspace_members(db: AsyncSession, workspace_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(WorkspaceMembership, User)
        .join(User, User.id == WorkspaceMembership.user_id)
        .where(WorkspaceMembership.workspace_id == workspace_id)
    )
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "role": m.role,
            "workspace_id": m.workspace_id,
            "user_email": u.email,
            "user_name": u.name,
            "user_avatar_url": u.avatar_url,
        }
        for m, u in result.all()
    ]


async def invite_member(
    db: AsyncSession, workspace_id: uuid.UUID, email: str, role: str
) -> dict:
    user = await db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user with that email")

    existing = await db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user.id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")

    membership = WorkspaceMembership(workspace_id=workspace_id, user_id=user.id, role=role)
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return {
        "id": membership.id,
        "user_id": membership.user_id,
        "role": membership.role,
        "workspace_id": membership.workspace_id,
        "user_email": user.email,
        "user_name": user.name,
        "user_avatar_url": user.avatar_url,
    }


async def update_member_role(
    db: AsyncSession, workspace_id: uuid.UUID, membership_id: uuid.UUID, role: str
) -> dict:
    m = await db.get(WorkspaceMembership, membership_id)
    if not m or m.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
    m.role = role
    await db.commit()
    await db.refresh(m)
    user = await db.get(User, m.user_id)
    return {
        "id": m.id,
        "user_id": m.user_id,
        "role": m.role,
        "workspace_id": m.workspace_id,
        "user_email": user.email,
        "user_name": user.name,
        "user_avatar_url": user.avatar_url,
    }


async def remove_member(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    membership_id: uuid.UUID,
    requesting_user_id: uuid.UUID,
) -> None:
    m = await db.get(WorkspaceMembership, membership_id)
    if not m or m.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
    ws = await get_workspace(db, workspace_id)
    if m.user_id == ws.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot remove the workspace owner")
    if m.role == "admin":
        admin_count = await db.scalar(
            select(func.count(WorkspaceMembership.id)).where(
                WorkspaceMembership.workspace_id == workspace_id,
                WorkspaceMembership.role == "admin",
            )
        )
        if admin_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the last admin")
    await db.delete(m)
    await db.commit()


async def create_workspace(db: AsyncSession, data: WorkspaceCreate, owner: User) -> Workspace:
    existing = await db.scalar(select(Workspace).where(Workspace.slug == data.slug))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already taken")

    workspace = Workspace(name=data.name, slug=data.slug, owner_id=owner.id)
    db.add(workspace)
    await db.flush()

    membership = WorkspaceMembership(
        workspace_id=workspace.id, user_id=owner.id, role="admin"
    )
    db.add(membership)
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def get_user_workspaces(db: AsyncSession, user: User) -> list[Workspace]:
    result = await db.scalars(
        select(Workspace)
        .join(WorkspaceMembership, WorkspaceMembership.workspace_id == Workspace.id)
        .where(WorkspaceMembership.user_id == user.id)
    )
    return list(result.all())


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID) -> Workspace:
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return ws


async def update_workspace(
    db: AsyncSession, workspace_id: uuid.UUID, data: WorkspaceUpdate
) -> Workspace:
    ws = await get_workspace(db, workspace_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ws, field, value)
    await db.commit()
    await db.refresh(ws)
    return ws


async def get_my_tasks(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID
) -> list:
    from app.models.project import Project
    from app.models.task import Task as TaskModel

    result = await db.scalars(
        select(TaskModel)
        .join(Project, Project.id == TaskModel.project_id)
        .where(
            Project.workspace_id == workspace_id,
            TaskModel.assignee_id == user_id,
            TaskModel.status == "incomplete",
            TaskModel.deleted_at.is_(None),
            TaskModel.parent_id.is_(None),
        )
        .order_by(TaskModel.due_date.asc().nulls_last(), TaskModel.created_at)
    )
    return list(result.all())


async def setup_demo_workspace(db: AsyncSession, owner: User) -> Workspace:
    import uuid
    from datetime import datetime, timedelta, timezone

    from app.models.project import Project, ProjectMembership, Section
    from app.models.tag import Tag
    from app.models.task import Task, TaskTag
    from app.models.team import Team, TeamMembership
    from app.models.workspace import Workspace, WorkspaceMembership

    # 1. Workspace
    slug = f"demo-{uuid.uuid4().hex[:8]}"
    workspace = Workspace(name="Demo Workspace", slug=slug, owner_id=owner.id)
    db.add(workspace)
    await db.flush()

    db.add(WorkspaceMembership(workspace_id=workspace.id, user_id=owner.id, role="admin"))

    # 2. Team
    team = Team(workspace_id=workspace.id, name="General", description="Default team")
    db.add(team)
    await db.flush()
    db.add(TeamMembership(team_id=team.id, user_id=owner.id, role="admin"))

    # 3. Project
    project = Project(
        workspace_id=workspace.id,
        team_id=team.id,
        owner_id=owner.id,
        name="Welcome Project",
        description="A sample project to get you started.",
        color="#F28C38",
    )
    db.add(project)
    await db.flush()
    db.add(ProjectMembership(project_id=project.id, user_id=owner.id, role="admin"))

    # 4. Sections
    sec_todo = Section(project_id=project.id, name="To Do", position=1000)
    sec_prog = Section(project_id=project.id, name="In Progress", position=2000)
    sec_done = Section(project_id=project.id, name="Done", position=3000)
    db.add_all([sec_todo, sec_prog, sec_done])
    await db.flush()

    # 5. Tags
    tag_bug = Tag(workspace_id=workspace.id, name="Bug", color="#EF4444")
    tag_feat = Tag(workspace_id=workspace.id, name="Feature", color="#38BDF8")
    db.add_all([tag_bug, tag_feat])
    await db.flush()

    # 6. Tasks
    now = datetime.now(timezone.utc)
    t1 = Task(
        project_id=project.id,
        section_id=sec_todo.id,
        created_by_id=owner.id,
        assignee_id=owner.id,
        title="Welcome to WorkBoard! 🎉",
        description="<p>This is a rich-text description. You can <strong>bold</strong> things, add lists, and mentions.</p>",
        status="incomplete",
        priority="high",
        position=1000,
        due_date=now + timedelta(days=1),
    )
    t2 = Task(
        project_id=project.id,
        section_id=sec_todo.id,
        created_by_id=owner.id,
        assignee_id=None,
        title="Check out the calendar view",
        status="incomplete",
        priority="medium",
        position=2000,
    )
    t3 = Task(
        project_id=project.id,
        section_id=sec_prog.id,
        created_by_id=owner.id,
        assignee_id=owner.id,
        title="Drag and drop tasks",
        status="incomplete",
        priority="low",
        position=1000,
        due_date=now,
    )
    t4 = Task(
        project_id=project.id,
        section_id=sec_done.id,
        created_by_id=owner.id,
        assignee_id=owner.id,
        title="Register an account",
        status="completed",
        priority="none",
        position=1000,
        completed_at=now,
    )
    db.add_all([t1, t2, t3, t4])
    await db.flush()

    # Bind tags
    db.add(TaskTag(task_id=t1.id, tag_id=tag_feat.id))
    db.add(TaskTag(task_id=t2.id, tag_id=tag_bug.id))

    await db.commit()
    await db.refresh(workspace)
    return workspace
