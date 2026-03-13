# Stage 1: build frontend static assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json ./
COPY frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
# sync-guides.js looks for /docs at build time
COPY docs/ /docs/
RUN npm run build

# Stage 2: nginx serves static files + proxies /api to backend
FROM nginx:alpine
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
