#!/usr/bin/env bash
# deploy.sh — Production deployment script for A-ERP
# Runs on self-hosted VPS runner via GitHub Actions.
# Required env vars: DEPLOY_DIR, ENV_FILE_PATH
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_DIR:?DEPLOY_DIR env var is required}"
ENV_FILE_PATH="${ENV_FILE_PATH:?ENV_FILE_PATH env var is required}"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
HEALTH_URL="https://localhost/api/v1/health"
BACKUP_DIR="$DEPLOY_DIR/.backups"
MAX_RETRIES=15
RETRY_INTERVAL=4
PRE_DEPLOY_REVISION=""  # captured before migration for rollback

# ── Helpers ─────────────────────────────────────────────────────────────────
log()  { echo "[deploy] $(date '+%H:%M:%S') $*"; }
fail() { log "ERROR: $*"; exit 1; }

# ── Step 1: Validate prerequisites ──────────────────────────────────────────
check_prerequisites() {
  log "Checking prerequisites..."
  command -v docker >/dev/null 2>&1 || fail "docker not found"
  docker compose version >/dev/null 2>&1 || fail "docker compose plugin not found"
  [ -f "$ENV_FILE_PATH" ] || fail "env file not found: $ENV_FILE_PATH"
  [ -f "$COMPOSE_FILE" ] || fail "compose file not found: $COMPOSE_FILE (sync must run first)"
}

# ── Step 1b: Ensure SSL cert exists (auto-generate self-signed if missing) ──
ensure_ssl_cert() {
  local ssl_dir="/etc/nginx/ssl/a-erp"
  if [ ! -f "$ssl_dir/server.crt" ] || [ ! -f "$ssl_dir/server.key" ]; then
    log "SSL cert not found — generating self-signed cert..."
    mkdir -p "$ssl_dir"
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout "$ssl_dir/server.key" \
      -out "$ssl_dir/server.crt" \
      -subj "/CN=localhost" \
      2>/dev/null
    log "Self-signed SSL cert generated at $ssl_dir"
  else
    log "SSL cert already exists — skipping generation."
  fi
}

# ── Step 2: Sync code from runner workspace to deploy dir ───────────────────
sync_code() {
  log "Syncing code to $DEPLOY_DIR..."
  mkdir -p "$DEPLOY_DIR"
  rsync -a --delete \
    --exclude='.git/' \
    --exclude='.env*' \
    --exclude='node_modules/' \
    --exclude='__pycache__/' \
    --exclude='.venv/' \
    --exclude='*.pyc' \
    --exclude='plans/' \
    --exclude='docs/wireframe/' \
    "${GITHUB_WORKSPACE}/" "$DEPLOY_DIR/"
  log "Code sync complete."
}

# ── Step 3: Backup database before migration ────────────────────────────────
backup_database() {
  # Skip backup on first deploy when postgres container is not yet running
  if ! docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" \
      ps --quiet postgres 2>/dev/null | grep -q .; then
    log "Postgres not running — skipping backup (likely first deploy)."
    return
  fi

  log "Backing up database..."
  mkdir -p "$BACKUP_DIR"
  local backup_file="$BACKUP_DIR/db-$(date '+%Y%m%d-%H%M%S').sql.gz"

  # Read only the needed values without sourcing the entire env file into the
  # process environment (which would expose SECRET_KEY, passwords, etc.)
  local db_user db_name
  db_user=$(grep -E '^POSTGRES_USER=' "$ENV_FILE_PATH" | cut -d= -f2- | tr -d '"'"'" || echo "workboard")
  db_name=$(grep -E '^POSTGRES_DB='   "$ENV_FILE_PATH" | cut -d= -f2- | tr -d '"'"'" || echo "workboard")
  db_user="${db_user:-workboard}"
  db_name="${db_name:-workboard}"

  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" \
    exec -T postgres pg_dump -U "$db_user" "$db_name" \
    | gzip > "$backup_file" \
    || { log "ERROR: Database backup failed — aborting deploy."; exit 1; }

  log "Database backup saved: $backup_file"

  # Keep only the last 5 backups to prevent disk bloat
  ls -t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm --
}

# ── Step 4: Tag current images as :rollback ─────────────────────────────────
backup_images() {
  log "Tagging current images for rollback..."
  local project
  project=$(basename "$DEPLOY_DIR" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]-')

  for svc in backend nginx; do
    local img="${project}-${svc}:latest"
    if docker image inspect "$img" >/dev/null 2>&1; then
      docker tag "$img" "${project}-${svc}:rollback"
      log "  Tagged $img → ${project}-${svc}:rollback"
    fi
  done
}

# ── Step 5: Build Docker images ─────────────────────────────────────────────
build_images() {
  log "Building Docker images..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" build --pull
  log "Build complete."
}

# ── Step 6: Run database migrations ─────────────────────────────────────────
run_migrations() {
  log "Capturing current Alembic revision before migration..."
  PRE_DEPLOY_REVISION=$(
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" \
      run --rm --no-deps backend alembic current 2>/dev/null \
      | grep -oE '[0-9a-f]{12}' | head -1 || echo ""
  )
  log "  Pre-deploy revision: ${PRE_DEPLOY_REVISION:-<none>}"

  log "Running database migrations..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" \
    run --rm backend alembic upgrade head
  log "Migrations complete."
}

# ── Step 7: Restart all services ─────────────────────────────────────────────
restart_services() {
  log "Restarting services..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" up -d
  log "Services restarted."
}

# ── Step 8: Health check ────────────────────────────────────────────────────
health_check() {
  log "Running health check (max ${MAX_RETRIES} attempts)..."
  for i in $(seq 1 "$MAX_RETRIES"); do
    status=$(curl -sk -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$status" = "200" ]; then
      log "Health check passed (attempt $i)."
      return 0
    fi
    log "  Attempt $i/$MAX_RETRIES — HTTP $status, retrying in ${RETRY_INTERVAL}s..."
    sleep "$RETRY_INTERVAL"
  done
  return 1
}

# ── Step 9: Clean dangling images ────────────────────────────────────────────
prune_images() {
  log "Pruning dangling images..."
  docker image prune -f
}

# ── Rollback on failure ──────────────────────────────────────────────────────
rollback() {
  log "Initiating rollback to previous images..."
  local project
  project=$(basename "$DEPLOY_DIR" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]-')

  for svc in backend nginx; do
    local rollback_img="${project}-${svc}:rollback"
    if docker image inspect "$rollback_img" >/dev/null 2>&1; then
      docker tag "$rollback_img" "${project}-${svc}:latest"
      log "  Restored $rollback_img → ${project}-${svc}:latest"
    fi
  done

  # Downgrade DB schema to match the rolled-back code.
  # If no pre-deploy revision was captured (first deploy or migration failed
  # before we could record it), skip DB downgrade and warn — manual restore
  # from backup may be needed.
  if [ -n "$PRE_DEPLOY_REVISION" ]; then
    log "Downgrading DB to revision: $PRE_DEPLOY_REVISION..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" \
      run --rm backend alembic downgrade "$PRE_DEPLOY_REVISION" \
      || log "WARNING: DB downgrade failed — restore manually from: $BACKUP_DIR"
  else
    log "WARNING: No pre-deploy revision captured — skipping DB downgrade."
    log "  Restore DB manually from backup: $BACKUP_DIR"
  fi

  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PATH" up -d
  log "Rollback complete. Previous version is running."
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  log "========================================="
  log "Starting A-ERP deployment"
  log "Deploy dir : $DEPLOY_DIR"
  log "Env file   : $ENV_FILE_PATH"
  log "Commit SHA : ${GITHUB_SHA:-local}"
  log "========================================="

  sync_code
  check_prerequisites
  ensure_ssl_cert
  backup_database
  backup_images
  build_images
  run_migrations
  restart_services

  if health_check; then
    log "Deployment successful."
    prune_images
  else
    log "Health check FAILED — rolling back..."
    rollback
    fail "Deployment failed and rolled back. Check container logs: docker compose -f $COMPOSE_FILE logs"
  fi
}

main "$@"
