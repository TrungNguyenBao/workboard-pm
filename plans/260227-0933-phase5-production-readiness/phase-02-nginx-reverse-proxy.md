# Phase 2 — Nginx Reverse Proxy

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 1h
- **Depends on:** Phase 1 (Docker production builds)

Single nginx entry point: serves frontend static files, proxies `/api` and `/uploads` to backend.

## Key Insights
- Vite dev server already proxies `/api` and `/uploads` to backend (see `vite.config.ts`) -- nginx replicates this in prod
- SSE endpoint at `/api/v1/sse` needs special proxy config (no buffering, long timeout)
- WebSocket not used (project uses SSE + LISTEN/NOTIFY)
- Frontend uses client-side routing (React Router) -- nginx must fallback to `index.html`

## Files to Create
- `nginx/nginx.conf` — main nginx config
- `nginx/default.conf` — server block with proxy rules

## Files to Modify
- `docker-compose.prod.yml` — add nginx service

## Implementation Steps

### 1. Create `nginx/default.conf`
```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name _;

    # Frontend static files
    root /usr/share/nginx/html;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE — disable buffering
    location /api/v1/sse {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # Uploaded files proxy
    location /uploads/ {
        proxy_pass http://backend;
    }

    # SPA fallback — all other routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;
}
```

### 2. Create `nginx/nginx.conf`
Minimal top-level config: worker processes, events block, include `default.conf`.

### 3. Update `docker-compose.prod.yml`
```yaml
nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - frontend_dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: unless-stopped
```
- Frontend build stage copies `dist/` into a named volume or use multi-stage copy
- Alternative: build frontend image, copy dist out in compose build step

### 4. Handle frontend static files
Two approaches (pick simpler):
- **Option A (recommended):** Build frontend in CI, copy `dist/` into nginx image via Dockerfile
- **Option B:** Use Docker named volume shared between frontend builder and nginx

Recommend Option A: create `nginx/Dockerfile` that copies frontend dist from builder stage:
```dockerfile
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=frontend /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
```
This replaces `frontend/Dockerfile.prod` -- single image for nginx+frontend.

## Success Criteria
- [ ] `curl http://localhost/` returns React app HTML
- [ ] `curl http://localhost/api/v1/health` proxied to backend
- [ ] SSE connections stay open without nginx buffering
- [ ] Client-side routes (e.g., `/projects/123`) return `index.html`
- [ ] Security headers present in responses
- [ ] Only port 80 exposed externally (backend/postgres/redis internal only)
