# Phase 4: Deploy Script & Health Check

## Priority: P1 | Status: complete | Effort: 45m

## Overview

Create `scripts/deploy.sh` — a self-contained deployment script that syncs code to the deploy directory, builds images, runs migrations, restarts services, and verifies health. Also includes rollback strategy.

## Context

- Deploy dir: `/opt/a-erp` (from `$DEPLOY_DIR` secret)
- Env file: `/opt/a-erp/.env.prod` (from `$ENV_FILE_PATH` secret)
- Compose file: `docker-compose.prod.yml`
- Health endpoint: `GET /api/v1/health` (FastAPI)
- Nginx serves on port 8081

## Implementation Steps

### 4.1 Create `scripts/deploy.sh`

Location: `D:\Coding\workboard-pm\scripts\deploy.sh`

The script should:

1. **Validate** — check required env vars and files exist
2. **Sync** — rsync workspace to deploy dir (preserving .env.prod)
3. **Backup** — tag current running images before rebuild
4. **Build** — `docker compose build`
5. **Migrate** — `alembic upgrade head` in a one-off container
6. **Restart** — `docker compose up -d`
7. **Prune** — clean dangling images
8. **Health check** — poll `/api/v1/health` with retries
9. **Rollback on failure** — if health check fails, revert to backup images

### 4.2 Script Structure

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── Config ──────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_DIR:?DEPLOY_DIR not set}"
ENV_FILE_PATH="${ENV_FILE_PATH:?ENV_FILE_PATH not set}"
HEALTH_URL="http://localhost:8081/api/v1/health"
MAX_RETRIES=15
RETRY_INTERVAL=4

# ── Functions ───────────────────────────────────────
log()   { echo "[deploy] $(date '+%H:%M:%S') $*"; }
fail()  { log "ERROR: $*"; exit 1; }

check_prerequisites() {
  # Verify env file exists, docker is available, compose file present
}

sync_code() {
  # rsync from runner workspace ($GITHUB_WORKSPACE) to $DEPLOY_DIR
  # Exclude: .git, .env*, node_modules, __pycache__, .venv
  # Preserve: .env.prod (already in DEPLOY_DIR, not in repo)
}

backup_images() {
  # Tag current images as :rollback for safety
  # docker tag a-erp-backend:latest a-erp-backend:rollback || true
}

build_images() {
  # docker compose -f docker-compose.prod.yml --env-file $ENV_FILE_PATH build
}

run_migrations() {
  # docker compose -f ... run --rm backend alembic upgrade head
}

restart_services() {
  # docker compose -f ... --env-file $ENV_FILE_PATH up -d
}

health_check() {
  # Poll HEALTH_URL up to MAX_RETRIES times
  # Return 0 on 200 OK, 1 on failure
}

prune_images() {
  # docker image prune -f (remove dangling)
}

rollback() {
  # docker tag a-erp-backend:rollback a-erp-backend:latest
  # docker compose up -d
  # Only if rollback images exist
}

# ── Main ────────────────────────────────────────────
main() {
  log "Starting deployment..."
  check_prerequisites
  sync_code
  backup_images
  build_images
  run_migrations
  restart_services

  if health_check; then
    log "Health check passed. Deployment successful."
    prune_images
  else
    log "Health check FAILED. Rolling back..."
    rollback
    fail "Deployment rolled back. Check logs."
  fi
}

main "$@"
```

### 4.3 Key Implementation Details

**rsync exclusions:**
```
--exclude='.git'
--exclude='.env*'
--exclude='node_modules'
--exclude='__pycache__'
--exclude='.venv'
--exclude='*.pyc'
--exclude='plans/'
--exclude='docs/wireframe/'
```

**Migration command:**
```bash
docker compose -f docker-compose.prod.yml \
  --env-file "$ENV_FILE_PATH" \
  run --rm backend alembic upgrade head
```

This runs a one-off container, applies migrations, then exits. The main backend containers start after.

**Health check logic:**
```bash
for i in $(seq 1 $MAX_RETRIES); do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$status" = "200" ]; then
    return 0
  fi
  log "Attempt $i/$MAX_RETRIES — status: $status, retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done
return 1
```

Max wait: 15 retries x 4s = 60 seconds (enough for image pull + container boot).

### 4.4 Verify Health Endpoint Exists

Check that FastAPI exposes `GET /api/v1/health`. If not, a simple endpoint must be added:

```python
# backend/app/api/v1/routers/health.py
@router.get("/health")
async def health():
    return {"status": "ok"}
```

### 4.5 Rollback Strategy

| Scenario | Action |
|----------|--------|
| Health check fails after deploy | Script auto-restores `:rollback` tagged images, restarts compose |
| Migration fails | `set -e` aborts script before restart; old containers still running |
| Manual rollback needed | SSH in, run: `cd /opt/a-erp && docker compose -f docker-compose.prod.yml --env-file .env.prod down && docker tag <image>:rollback <image>:latest && docker compose up -d` |
| Full revert to previous commit | SSH in, `cd /opt/a-erp && git checkout <prev-sha> && bash scripts/deploy.sh` |

### 4.6 Add Concurrency Guard to Workflow

Prevent overlapping deploys from rapid pushes. Add to `ci.yml`:

```yaml
concurrency:
  group: production-deploy
  cancel-in-progress: false   # queue, don't cancel running deploys
```

## Related Files

| File | Action |
|------|--------|
| `scripts/deploy.sh` | Create (~80 lines) |
| `.github/workflows/ci.yml` | Modify — add `concurrency` block |
| `backend/app/api/v1/routers/health.py` | Verify exists (likely already there) |

## Success Criteria

- [ ] `scripts/deploy.sh` runs successfully on VPS via self-hosted runner
- [ ] Health check confirms backend is responding after deploy
- [ ] Failed health check triggers automatic rollback
- [ ] Script output is clear and readable in GitHub Actions logs
- [ ] Dangling Docker images cleaned up after successful deploy

## Risks

| Risk | Mitigation |
|------|------------|
| Migration breaks production DB | Backup DB before first deploy; test migrations in staging first |
| Disk fills with Docker images | `docker image prune -f` in script; add cron for `docker system prune` weekly |
| Health endpoint doesn't exist | Verify in Phase 4 implementation; add if missing |
| rsync deletes .env.prod | Explicit `--exclude='.env*'` in rsync flags |
