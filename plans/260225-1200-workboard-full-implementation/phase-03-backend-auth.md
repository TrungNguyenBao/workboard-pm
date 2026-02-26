# Phase 03 — Backend Auth

## Overview
- **Priority:** Critical
- **Status:** Pending
- **Description:** JWT auth with access+refresh tokens. Register, login, refresh, logout, me endpoints.

## Context Links
- [Stack Research](../reports/researcher-stack-react-fastapi-postgresql.md) §4 JWT Auth

## Related Code Files

### Create
```
backend/app/
  core/security.py
  schemas/auth.py
  schemas/user.py
  services/auth_service.py
  api/v1/routers/auth.py
  api/v1/dependencies/auth.py    # get_current_user Depends()
```

## Implementation Steps

### 1. core/security.py
```python
import hashlib, secrets, uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token() -> tuple[str, str]:
    """Returns (raw_token, token_hash)"""
    raw = secrets.token_urlsafe(64)
    return raw, hashlib.sha256(raw.encode()).hexdigest()

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

### 2. schemas/auth.py
```python
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    workspace_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    avatar_url: str | None
    model_config = ConfigDict(from_attributes=True)
```

### 3. services/auth_service.py
```python
async def register(db, req: RegisterRequest) -> User:
    # Check email unique, hash password, create User + Workspace + WorkspaceMembership(admin)
    # Return User

async def login(db, req: LoginRequest) -> tuple[User, str, str]:
    # Verify email+password, create refresh token (family=new UUID), store hash in DB
    # Return (user, access_token, raw_refresh_token)

async def refresh(db, raw_token: str) -> tuple[User, str, str]:
    # Hash token, find RefreshToken by hash, verify not revoked + not expired
    # Revoke entire family (security: rotation), create new refresh token same family
    # Return (user, new_access_token, new_raw_refresh_token)

async def logout(db, raw_token: str) -> None:
    # Hash token, find+revoke it (is_revoked=True)
```

### 4. api/v1/routers/auth.py
```python
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
async def register(req: RegisterRequest, request: Request, db=Depends(get_db)):
    user, access_token, refresh_raw = await auth_service.register(db, req)
    response = JSONResponse(TokenResponse(access_token=access_token, user=UserResponse.from_orm(user)))
    response.set_cookie("refresh_token", refresh_raw, httponly=True, secure=True, samesite="strict",
                        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    return response

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(req: LoginRequest, request: Request, db=Depends(get_db)):
    # Same pattern as register

@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, db=Depends(get_db)):
    raw = request.cookies.get("refresh_token")
    if not raw: raise HTTPException(401, "No refresh token")
    user, access_token, new_refresh = await auth_service.refresh(db, raw)
    # Set new cookie, return new access token

@router.post("/logout")
async def logout(request: Request, db=Depends(get_db)):
    raw = request.cookies.get("refresh_token")
    if raw: await auth_service.logout(db, raw)
    response = JSONResponse({"message": "logged out"})
    response.delete_cookie("refresh_token")
    return response

@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(req: UpdateProfileRequest, current_user=Depends(get_current_user), db=Depends(get_db)):
    # Update name, avatar_url
```

### 5. dependencies/auth.py
```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(401, "User not found or inactive")
    return user

async def require_workspace_admin(current_user=Depends(get_current_user), ...):
    # Check WorkspaceMembership role == admin
```

## Todo
- [ ] Implement core/security.py
- [ ] Create schemas/auth.py + schemas/user.py
- [ ] Implement services/auth_service.py (register, login, refresh, logout)
- [ ] Implement dependencies/auth.py (get_current_user)
- [ ] Implement auth router (5 endpoints)
- [ ] Add slowapi rate limiting to register + login
- [ ] Test: register → login → refresh → logout → me

## Success Criteria
- POST /auth/register creates user + workspace, sets HttpOnly cookie, returns access token
- POST /auth/login verifies password, returns new token pair
- POST /auth/refresh rotates refresh token, returns new access token
- POST /auth/logout revokes refresh token, clears cookie
- GET /auth/me returns current user; 401 without valid token
- Invalid refresh token revokes entire token family (security)

## Risk Assessment
- Token family revocation: if attacker reuses stolen refresh token after rotation, family is revoked → legitimate user forced to re-login (correct behavior)
- Access token in memory on frontend: must re-obtain on page reload via refresh endpoint

## Security Considerations
- Never log passwords or tokens
- Refresh token stored as SHA-256 hash in DB, raw only sent via HttpOnly cookie
- Rate limit register (5/min) + login (10/min) endpoints
- Access token: `exp` checked by PyJWT automatically

## Next Steps
→ Phase 04: workspace, teams, projects, RBAC
