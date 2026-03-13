---
title: "CI/CD Pipeline for Local VPS Deployment"
description: "Self-hosted GitHub Actions runner on local VPS with Docker Compose production deployment"
status: complete
priority: P1
effort: 3h
branch: main
tags: [devops, cicd, docker, deployment]
created: 2026-03-13
completed: 2026-03-13
---

# CI/CD Pipeline for Local VPS Deployment

## Summary

Deploy A-ERP to a local VPS (192.168.1.198) using a GitHub Actions self-hosted runner. The VPS is on a private network unreachable by GitHub's cloud runners, so the runner must live on the VPS itself.

## Architecture

```
GitHub (push to main)
  -> CI job (ubuntu-latest): lint + test
  -> CD job (self-hosted): pull code, build images, migrate DB, restart services

VPS (192.168.1.198)
  ├── GitHub Actions Runner (polls GitHub API outbound)
  ├── Docker Compose (prod)
  │   ├── nginx (port 8081) — serves SPA + proxies /api
  │   ├── backend (FastAPI, 4 workers)
  │   ├── postgres:15-alpine
  │   └── redis:7-alpine
  └── /opt/a-erp/ (deployment root)
```

## Phases

| Phase | File | Effort | Status |
|-------|------|--------|--------|
| 1. VPS Setup | [phase-01-vps-setup.md](./phase-01-vps-setup.md) | 45m | complete |
| 2. GitHub Secrets | [phase-02-github-secrets.md](./phase-02-github-secrets.md) | 15m | complete |
| 3. CD Workflow | [phase-03-cd-workflow.md](./phase-03-cd-workflow.md) | 45m | complete |
| 4. Deploy Script & Health Check | [phase-04-deploy-script.md](./phase-04-deploy-script.md) | 45m | complete |

## Key Decisions

- **Self-hosted runner** — only viable option for private-network VPS
- **Single workflow file** (`ci.yml`) — CD job depends on CI job via `needs:`
- **Deploy via git pull + docker compose** — no registry needed, builds on VPS
- **Rolling restart** — `docker compose up -d --build` rebuilds changed services; postgres/redis persist via volumes
- **No registry** — images built locally on VPS to avoid extra infrastructure

## Dependencies

- VPS accessible via SSH from dev machine
- Docker + Docker Compose installed on VPS
- GitHub repo: `TrungNguyenBao/workboard-pm`

## Files to Create/Modify

| File | Action |
|------|--------|
| `.github/workflows/ci.yml` | Modify — add `deploy` job |
| `scripts/deploy.sh` | Create — deployment + health check script |
| `.env.example` | Verify — no changes needed (already complete) |
