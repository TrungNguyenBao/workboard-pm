import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custom_field import CustomFieldDefinition
from app.models.user import User
from app.schemas.custom_field import CustomFieldCreate, CustomFieldUpdate


async def _get_or_404(
    db: AsyncSession, field_id: uuid.UUID, project_id: uuid.UUID | None = None
) -> CustomFieldDefinition:
    field = await db.get(CustomFieldDefinition, field_id)
    if not field or field.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom field not found")
    if project_id is not None and field.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom field not found")
    return field


async def create_field(
    db: AsyncSession, project_id: uuid.UUID, data: CustomFieldCreate, creator: User
) -> CustomFieldDefinition:
    position = data.position
    if position is None:
        result = await db.scalar(
            select(CustomFieldDefinition.position)
            .where(
                CustomFieldDefinition.project_id == project_id,
                CustomFieldDefinition.deleted_at.is_(None),
            )
            .order_by(CustomFieldDefinition.position.desc())
            .limit(1)
        )
        position = (result or 0.0) + 65536.0

    options_data = [o.model_dump() for o in data.options] if data.options else None
    field = CustomFieldDefinition(
        project_id=project_id,
        created_by_id=creator.id,
        name=data.name,
        field_type=data.field_type,
        required=data.required,
        description=data.description,
        options=options_data,
        position=position,
    )
    db.add(field)
    await db.commit()
    await db.refresh(field)
    return field


async def list_fields(db: AsyncSession, project_id: uuid.UUID) -> list[CustomFieldDefinition]:
    result = await db.scalars(
        select(CustomFieldDefinition)
        .where(
            CustomFieldDefinition.project_id == project_id,
            CustomFieldDefinition.deleted_at.is_(None),
        )
        .order_by(CustomFieldDefinition.position)
    )
    return list(result.all())


async def update_field(
    db: AsyncSession, field_id: uuid.UUID, data: CustomFieldUpdate, project_id: uuid.UUID | None = None
) -> CustomFieldDefinition:
    field = await _get_or_404(db, field_id, project_id)
    updates = data.model_dump(exclude_none=True)
    if "options" in updates:
        updates["options"] = [o.model_dump() for o in data.options] if data.options else None
    for key, value in updates.items():
        setattr(field, key, value)
    await db.commit()
    await db.refresh(field)
    return field


async def delete_field(db: AsyncSession, field_id: uuid.UUID, project_id: uuid.UUID | None = None) -> None:
    field = await _get_or_404(db, field_id, project_id)
    field.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def validate_custom_fields(
    db: AsyncSession, project_id: uuid.UUID, values: dict
) -> dict:
    """Validate custom field values against project definitions. Returns validated dict."""
    if not values:
        return values

    definitions = await list_fields(db, project_id)
    def_map = {str(d.id): d for d in definitions}

    errors: list[str] = []
    for field_id_str, value in values.items():
        defn = def_map.get(field_id_str)
        if defn is None:
            errors.append(f"Unknown custom field: {field_id_str}")
            continue
        if value is None:
            if defn.required:
                errors.append(f"Field '{defn.name}' is required")
            continue
        _validate_value(defn, value, errors)

    # Check required fields that were not provided
    for defn in definitions:
        if defn.required and str(defn.id) not in values:
            errors.append(f"Field '{defn.name}' is required")

    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"custom_fields": errors},
        )

    return values


def _validate_value(defn: CustomFieldDefinition, value, errors: list[str]) -> None:
    ft = defn.field_type
    name = defn.name

    if ft == "text":
        if not isinstance(value, str):
            errors.append(f"Field '{name}': expected string")
    elif ft == "number":
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            errors.append(f"Field '{name}': expected number")
    elif ft == "date":
        if not isinstance(value, str):
            errors.append(f"Field '{name}': expected ISO date string")
        else:
            try:
                datetime.fromisoformat(value)
            except ValueError:
                errors.append(f"Field '{name}': invalid ISO date string")
    elif ft == "checkbox":
        if not isinstance(value, bool):
            errors.append(f"Field '{name}': expected boolean")
    elif ft == "url":
        if not isinstance(value, str) or not (
            value.startswith("http://") or value.startswith("https://")
        ):
            errors.append(f"Field '{name}': expected URL starting with http:// or https://")
    elif ft == "single_select":
        valid_ids = {opt["id"] for opt in (defn.options or [])}
        if value not in valid_ids:
            errors.append(f"Field '{name}': invalid option '{value}'")
    elif ft == "multi_select":
        if not isinstance(value, list):
            errors.append(f"Field '{name}': expected list of option IDs")
        else:
            valid_ids = {opt["id"] for opt in (defn.options or [])}
            invalid = [v for v in value if v not in valid_ids]
            if invalid:
                errors.append(f"Field '{name}': invalid options {invalid}")
