# Phase 3: CD Workflow

## Priority: P1 | Status: complete | Effort: 45m

## Overview

Add a `deploy` job to the existing `.github/workflows/ci.yml`. The job runs on the self-hosted runner after CI passes, pulls latest code, builds Docker images, runs migrations, and restarts services.

## Context

- Current CI file: `.github/workflows/ci.yml` (67 lines, single `lint-and-test` job)
- Production compose: `docker-compose.prod.yml` (backend, nginx, postgres, redis)
- Runner labels: `self-hosted, linux, x64, production`

## Architecture

```
push to main
  │
  ├─► lint-and-test (ubuntu-latest)  ── CI: ruff, pytest, eslint
  │       │
  │       ▼ (needs: lint-and-test)
  │
  └─► deploy (self-hosted)           ── CD: pull, build, migrate, restart
          │
          ├── git pull origin main
          ├── docker compose build
          ├── docker compose run backend alembic upgrade head
          ├── docker compose up -d
          └── health check (curl /api/v1/health)
```

## Implementation Steps

### 3.1 Modify `.github/workflows/ci.yml`

Add the `deploy` job after the existing `lint-and-test` job. Key points:

- **Trigger**: only on `push` to `main` (not on PRs) — use `if: github.event_name == 'push'`
- **Runner**: `runs-on: [self-hosted, linux, production]`
- **Depends on**: `needs: lint-and-test`
- **Working directory**: The runner checks out code to its workspace; deploy script copies/symlinks to `/opt/a-erp`

### 3.2 Proposed Workflow Addition

```yaml
  deploy:
    needs: lint-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: [self-hosted, linux, production]

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        env:
          DEPLOY_DIR: ${{ secrets.DEPLOY_DIR }}
          ENV_FILE_PATH: ${{ secrets.ENV_FILE_PATH }}
        run: |
          chmod +x scripts/deploy.sh
          bash scripts/deploy.sh
```

### 3.3 Why This Design

| Decision | Rationale |
|----------|-----------|
| Single workflow file | KISS — no need for separate `cd.yml` when it's just one extra job |
| `if: push && main` | PRs should NOT trigger deploy |
| Deploy script in repo | Version-controlled, testable, reusable outside CI |
| `actions/checkout@v4` | Runner gets fresh code; deploy script syncs to `/opt/a-erp` |

### 3.4 Full Modified ci.yml

The complete file should be ~95 lines. Structure:

```yaml
name: CI/CD Pipeline              # renamed from "CI Pipeline"

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      # ... (existing 15 steps, unchanged)

  deploy:
    needs: lint-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: [self-hosted, linux, production]
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        env:
          DEPLOY_DIR: ${{ secrets.DEPLOY_DIR }}
          ENV_FILE_PATH: ${{ secrets.ENV_FILE_PATH }}
        run: |
          chmod +x scripts/deploy.sh
          bash scripts/deploy.sh
```

## Related Files

| File | Action |
|------|--------|
| `.github/workflows/ci.yml` | Modify — add `deploy` job, rename workflow |
| `scripts/deploy.sh` | Create — see Phase 4 |

## Zero-Downtime Considerations

- `docker compose up -d --build` rebuilds only changed images
- Postgres and Redis containers are NOT rebuilt (image-only, no build context) — they stay running
- Backend containers restart sequentially by default
- For true zero-downtime: would need `docker compose up -d --no-deps --scale backend=2` then drain — overkill for local VPS

## Success Criteria

- [ ] Push to `main` triggers CI then CD automatically
- [ ] PR to `main` triggers CI only (no deploy)
- [ ] Deploy job shows green in GitHub Actions UI
- [ ] `deploy` job uses self-hosted runner (visible in job logs)

## Risks

| Risk | Mitigation |
|------|------------|
| Runner offline when push happens | Job queues until runner comes back online |
| CI passes but deploy fails | Deploy script has error handling + health check |
| Concurrent deploys (rapid pushes) | GitHub Actions queues jobs for same runner; `concurrency` group can be added if needed |
