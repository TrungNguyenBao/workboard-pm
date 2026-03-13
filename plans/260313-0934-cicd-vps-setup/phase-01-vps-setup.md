# Phase 1: VPS Setup

## Priority: P1 | Status: complete | Effort: 45m

## Overview

Prepare the Linux VPS at 192.168.1.198 with Docker, the GitHub Actions self-hosted runner, and the deployment directory structure.

## Prerequisites

- SSH access to VPS: `ssh btrung@192.168.1.198`
- VPS runs a modern Linux distro (Ubuntu 22.04+ or Debian 12+ recommended)
- Internet access from VPS (runner polls GitHub API outbound on HTTPS/443)

## Implementation Steps

### 1.1 Install Docker + Docker Compose

```bash
# SSH into VPS
ssh btrung@192.168.1.198

# Install Docker (official convenience script)
curl -fsSL https://get.docker.com | sudo sh

# Add user to docker group (no sudo needed for docker commands)
sudo usermod -aG docker btrung

# Log out and back in for group change to take effect
exit
ssh btrung@192.168.1.198

# Verify
docker --version
docker compose version
```

### 1.2 Create Deployment Directory

```bash
sudo mkdir -p /opt/a-erp
sudo chown btrung:btrung /opt/a-erp
```

### 1.3 Configure Production Environment

Create `/opt/a-erp/.env.prod` on VPS (never committed to git):

```bash
cat > /opt/a-erp/.env.prod << 'EOF'
# Database
DATABASE_URL=postgresql+asyncpg://workboard:CHANGE_THIS_PASSWORD@postgres:5432/workboard
POSTGRES_DB=workboard
POSTGRES_USER=workboard
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# Redis
REDIS_URL=redis://redis:6379

# JWT — generate with: openssl rand -hex 32
SECRET_KEY=GENERATE_A_REAL_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS — adjust to actual frontend URL
CORS_ORIGINS=http://192.168.1.198:8081
FRONTEND_URL=http://192.168.1.198:8081

# App
ENVIRONMENT=production
LOG_LEVEL=INFO
WEB_CONCURRENCY=4
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_MB=10
EOF

chmod 600 /opt/a-erp/.env.prod
```

### 1.4 Install GitHub Actions Self-Hosted Runner

Go to: `https://github.com/TrungNguyenBao/workboard-pm/settings/actions/runners/new`

Select **Linux** and follow the generated commands (token is unique per setup):

```bash
# Create runner directory
mkdir -p /opt/github-runner && cd /opt/github-runner

# Download latest runner (check GitHub page for exact URL + version)
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.XXX.X/actions-runner-linux-x64-2.XXX.X.tar.gz

tar xzf actions-runner-linux-x64.tar.gz

# Configure — use the token from GitHub settings page
./config.sh --url https://github.com/TrungNguyenBao/workboard-pm \
  --token YOUR_REGISTRATION_TOKEN \
  --name "vps-runner" \
  --labels "self-hosted,linux,x64,production" \
  --work "/opt/github-runner/_work"

# Install as systemd service (auto-starts on boot)
sudo ./svc.sh install btrung
sudo ./svc.sh start
sudo ./svc.sh status
```

### 1.5 Verify Runner Registration

1. Go to `https://github.com/TrungNguyenBao/workboard-pm/settings/actions/runners`
2. Confirm runner `vps-runner` shows as **Idle** (green)
3. Labels should include: `self-hosted`, `linux`, `x64`, `production`

## Directory Structure on VPS (after setup)

```
/opt/
├── a-erp/
│   └── .env.prod          # production environment (chmod 600)
└── github-runner/
    ├── _work/              # runner workspace (auto-managed)
    ├── config.sh
    ├── svc.sh
    └── ...
```

## Security Notes

- `.env.prod` is chmod 600 — only `btrung` can read it
- Runner runs as `btrung` user, not root
- Docker socket access via group membership (standard practice)
- No inbound ports needed for runner — it polls GitHub outbound over HTTPS

## Success Criteria

- [ ] `docker compose version` works without sudo
- [ ] `/opt/a-erp/.env.prod` exists with real secrets
- [ ] Runner shows "Idle" in GitHub Settings > Actions > Runners
- [ ] Runner survives VPS reboot (systemd service)

## Risks

| Risk | Mitigation |
|------|------------|
| Runner loses connection to GitHub | Systemd auto-restarts; check `sudo ./svc.sh status` |
| Docker disk space fills up | Add `docker system prune` to periodic cron or deploy script |
| VPS IP changes | Irrelevant — runner polls outbound, no inbound needed |
