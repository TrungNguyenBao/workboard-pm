#!/usr/bin/env bash
# setup-vps.sh — One-time VPS provisioning script for A-ERP on Ubuntu
# Run as root or with sudo on the VPS: bash setup-vps.sh
# VPS: 192.168.1.198 | User: btrung
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
DEPLOY_USER="${DEPLOY_USER:-btrung}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/a-erp}"
GITHUB_REPO="${GITHUB_REPO:?Set GITHUB_REPO=owner/repo before running}"
RUNNER_VERSION="2.321.0"  # https://github.com/actions/runner/releases

log()  { echo "[setup] $(date '+%H:%M:%S') $*"; }
fail() { log "ERROR: $*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run as root: sudo bash setup-vps.sh"

# ── Step 1: Install Docker ───────────────────────────────────────────────────
install_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker already installed: $(docker --version)"
    return
  fi
  log "Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg lsb-release

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # Allow deploy user to run docker without sudo
  usermod -aG docker "$DEPLOY_USER"
  log "Docker installed: $(docker --version)"
}

# ── Step 2: Install GitHub Actions self-hosted runner ───────────────────────
install_runner() {
  local runner_home="/home/$DEPLOY_USER/actions-runner"
  if [ -f "$runner_home/run.sh" ]; then
    log "GitHub Actions runner already installed at $runner_home"
    return
  fi

  log "Installing GitHub Actions runner v${RUNNER_VERSION}..."
  mkdir -p "$runner_home"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$runner_home"

  local arch
  arch=$(dpkg --print-architecture)
  local runner_tar="actions-runner-linux-${arch}-${RUNNER_VERSION}.tar.gz"

  # Download, verify checksum, then extract as deploy user
  su - "$DEPLOY_USER" -c "
    cd $runner_home
    curl -fsSL https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${runner_tar} \
      -o runner.tar.gz
    curl -fsSL https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${runner_tar}.sha256 \
      -o runner.tar.gz.sha256
    sha256sum -c runner.tar.gz.sha256 || { echo 'Checksum mismatch — aborting'; exit 1; }
    tar xzf runner.tar.gz
    rm runner.tar.gz runner.tar.gz.sha256
  "

  log "Runner extracted. Next step: register it with your GitHub repo."
  log ""
  log "  Run these commands as $DEPLOY_USER:"
  log "  cd $runner_home"
  log "  ./config.sh --url https://github.com/$GITHUB_REPO \\"
  log "              --token <REGISTRATION_TOKEN> \\"
  log "              --name a-erp-vps \\"
  log "              --labels 'self-hosted,linux,production' \\"
  log "              --unattended"
  log ""
  log "  Get the token from: https://github.com/$GITHUB_REPO/settings/actions/runners/new"
}

# ── Step 3: Install runner as systemd service ────────────────────────────────
install_runner_service() {
  local runner_home="/home/$DEPLOY_USER/actions-runner"
  [ -f "$runner_home/svc.sh" ] || { log "SKIP: runner not yet configured — run register step first"; return; }

  log "Installing runner as systemd service..."
  cd "$runner_home"
  bash svc.sh install "$DEPLOY_USER"
  bash svc.sh start
  log "Runner service started."
}

# ── Step 4: Create deploy directory and placeholder env file ─────────────────
setup_deploy_dir() {
  log "Creating deploy directory: $DEPLOY_DIR..."
  mkdir -p "$DEPLOY_DIR" "$DEPLOY_DIR/.backups"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

  local env_file="$DEPLOY_DIR/.env.prod"
  if [ ! -f "$env_file" ]; then
    cat > "$env_file" <<'EOF'
# A-ERP Production Environment
# Fill in all values before first deploy

# Database
DATABASE_URL=postgresql+asyncpg://workboard:CHANGE_ME@postgres:5432/workboard
POSTGRES_DB=workboard
POSTGRES_USER=workboard
POSTGRES_PASSWORD=CHANGE_ME

# Redis
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=CHANGE_ME_USE_OPENSSL_RAND_HEX_32

# App
ENVIRONMENT=production
FRONTEND_URL=https://192.168.1.198
CORS_ORIGINS=["https://192.168.1.198"]
LOG_LEVEL=INFO
WEB_CONCURRENCY=4
MAX_UPLOAD_SIZE_MB=10
EOF
    chown "$DEPLOY_USER:$DEPLOY_USER" "$env_file"
    chmod 600 "$env_file"
    log "Created placeholder env file: $env_file"
    log "ACTION REQUIRED: Edit $env_file and fill in all CHANGE_ME values."
  else
    log "Env file already exists: $env_file"
  fi
}

# ── Step 5: Set up self-signed SSL certificate ───────────────────────────────
setup_ssl() {
  local ssl_dir="/etc/nginx/ssl/a-erp"
  # Note: Let's Encrypt (certbot) requires a public domain. For local LAN IPs,
  # we generate a self-signed certificate. Browsers will show a warning that
  # users must accept once. Use a real domain + certbot for production internet.

  if [ -f "$ssl_dir/server.crt" ]; then
    log "SSL certificate already exists: $ssl_dir/server.crt"
    return
  fi

  log "Generating self-signed SSL certificate (valid 10 years)..."
  apt-get install -y -qq openssl
  mkdir -p "$ssl_dir"

  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "$ssl_dir/server.key" \
    -out "$ssl_dir/server.crt" \
    -subj "/CN=192.168.1.198/O=A-ERP/C=VN" \
    -addext "subjectAltName=IP:192.168.1.198"

  chmod 600 "$ssl_dir/server.key"
  log "SSL certificate generated: $ssl_dir/server.crt"
  log "SSL cert path (for docker mount): $ssl_dir"
}

# ── Step 6: Add GitHub Secrets reminder ──────────────────────────────────────
print_secrets_reminder() {
  log ""
  log "========================================="
  log "GITHUB SECRETS REQUIRED"
  log "Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
  log ""
  log "Add these repository secrets:"
  log "  DEPLOY_DIR   = $DEPLOY_DIR"
  log "  ENV_FILE_PATH = $DEPLOY_DIR/.env.prod"
  log "========================================="
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  log "========================================="
  log "A-ERP VPS Setup — Ubuntu"
  log "Deploy user : $DEPLOY_USER"
  log "Deploy dir  : $DEPLOY_DIR"
  log "GitHub repo : $GITHUB_REPO"
  log "========================================="

  install_docker
  setup_deploy_dir
  install_runner
  install_runner_service
  setup_ssl
  print_secrets_reminder

  log ""
  log "VPS setup complete."
  log "Next steps:"
  log "  1. Edit $DEPLOY_DIR/.env.prod — fill in all CHANGE_ME values"
  log "  2. Register the GitHub Actions runner (see instructions above)"
  log "  3. Add DEPLOY_DIR and ENV_FILE_PATH secrets in GitHub"
  log "  4. Push to main branch to trigger first deploy"
}

main "$@"
