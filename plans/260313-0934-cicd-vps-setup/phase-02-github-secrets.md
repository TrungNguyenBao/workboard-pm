# Phase 2: GitHub Secrets Configuration

## Priority: P1 | Status: complete | Effort: 15m

## Overview

Configure GitHub Actions secrets so the CD workflow can reference production values without hardcoding credentials. Since the self-hosted runner deploys from the VPS directly, most secrets live in `/opt/a-erp/.env.prod` on the VPS itself. GitHub Secrets here are minimal — only what the workflow YAML needs.

## Key Insight

With a self-hosted runner approach, the runner already has filesystem access to `/opt/a-erp/.env.prod`. The workflow reads env from that file via `--env-file`. This means we do NOT need to duplicate every env var as a GitHub Secret.

GitHub Secrets are only needed for values used **inside the workflow YAML itself** (not inside containers).

## Required GitHub Secrets

Navigate to: `https://github.com/TrungNguyenBao/workboard-pm/settings/secrets/actions`

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `DEPLOY_DIR` | `/opt/a-erp` | Deployment root on VPS |
| `ENV_FILE_PATH` | `/opt/a-erp/.env.prod` | Path to production env file |

That's it. Two secrets. The runner is on the VPS so it reads `.env.prod` directly.

## Why NOT More Secrets?

| Approach | Secrets needed | Complexity |
|----------|---------------|------------|
| **SSH-based deploy** (remote runner) | SSH_HOST, SSH_KEY, SSH_USER, DB_PASSWORD, SECRET_KEY, ... | High |
| **Self-hosted runner** (our approach) | DEPLOY_DIR, ENV_FILE_PATH | Low |

The self-hosted runner eliminates the need for SSH credentials and duplicated env vars in GitHub Secrets. The `.env.prod` file on disk is the single source of truth.

## Implementation Steps

### 2.1 Add Secrets via GitHub CLI

From the dev machine (requires `gh` CLI authenticated):

```bash
gh secret set DEPLOY_DIR --body "/opt/a-erp"
gh secret set ENV_FILE_PATH --body "/opt/a-erp/.env.prod"
```

### 2.2 Verify

```bash
gh secret list
```

Should show:
```
DEPLOY_DIR     Updated 2026-03-13
ENV_FILE_PATH  Updated 2026-03-13
```

## Security Notes

- Production passwords/secrets stay in `.env.prod` on VPS — never in GitHub
- GitHub Secrets only hold non-sensitive paths
- `.env.prod` is chmod 600, owned by `btrung`
- If you later need notification webhooks (Slack, Discord), add those as GitHub Secrets

## Success Criteria

- [ ] `gh secret list` shows `DEPLOY_DIR` and `ENV_FILE_PATH`
- [ ] No passwords or API keys stored in GitHub Secrets (they live on VPS)
