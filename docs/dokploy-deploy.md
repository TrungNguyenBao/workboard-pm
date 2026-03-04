# Hướng dẫn Deploy lên Dokploy

## Yêu cầu

- Đã cài đặt Dokploy trên server (VPS/cloud)
- Repo đã được push lên GitHub/GitLab
- Domain hoặc subdomain trỏ về IP server

---

## Bước 1: Tạo Compose App

1. Đăng nhập Dokploy dashboard
2. Vào **Projects** → **Create Project** → đặt tên (vd: `workboard-pm`)
3. Trong project vừa tạo, nhấn **Create Service** → chọn **Docker Compose**
4. Chọn nguồn: **Git** → kết nối GitHub và chọn repo `workboard-pm`
5. **Compose File Path**: `docker-compose.prod.yml`
6. Nhấn **Save**

---

## Bước 2: Cấu hình Environment Variables

Vào tab **Environment** của service, dán nội dung sau và thay giá trị thực:

```env
# Database
DATABASE_URL=postgresql+asyncpg://workboard:StrongPassword123@postgres:5432/workboard
POSTGRES_DB=workboard
POSTGRES_USER=workboard
POSTGRES_PASSWORD=StrongPassword123

# Redis
REDIS_URL=redis://redis:6379

# JWT – generate: openssl rand -hex 32
SECRET_KEY=your-generated-secret-key-here

# Domain (không có dấu / ở cuối)
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=["https://your-domain.com"]

# Backend
WEB_CONCURRENCY=4
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=10
```

> **Quan trọng:** `SECRET_KEY` phải đủ mạnh. Tạo bằng lệnh:
> ```bash
> openssl rand -hex 32
> ```

---

## Bước 3: Cấu hình Domain

1. Vào tab **Domains** → **Add Domain**
2. Nhập domain của bạn (vd: `workboard.yourdomain.com`)
3. Chọn service **nginx** và port **80**
4. Bật **HTTPS** (Let's Encrypt tự động)

---

## Bước 4: Deploy

1. Vào tab **General** → nhấn **Deploy**
2. Theo dõi build logs — quá trình build:
   - `nginx`: build frontend React → copy vào nginx image (~2-3 phút)
   - `backend`: install Python deps → copy code
   - `postgres` & `redis`: pull image
3. Khi tất cả services `Running` → deploy thành công ✅

---

## Bước 5: Kiểm tra

| URL                                     | Kết quả mong đợi     |
| --------------------------------------- | -------------------- |
| `https://your-domain.com`               | Trang login hiển thị |
| `https://your-domain.com/api/v1/health` | `{"status":"ok"}`    |

---

## Database Migration

Sau lần deploy đầu, chạy Alembic migration để tạo tables:

1. Vào Dokploy → service **backend** → tab **Terminal** (hoặc SSH vào server)
2. Chạy:

```bash
docker exec -it <backend-container-id> sh
alembic upgrade head
```

Hoặc thêm vào `docker-compose.prod.yml` trong backend command:

```yaml
command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-4}"
```

---

## Troubleshooting

| Lỗi                           | Nguyên nhân         | Fix                                                               |
| ----------------------------- | ------------------- | ----------------------------------------------------------------- |
| Backend `connection refused`  | Postgres chưa ready | Đợi healthcheck pass, xem logs                                    |
| `CORS error` trên browser     | `CORS_ORIGINS` sai  | Kiểm tra domain khớp chính xác                                    |
| 502 Bad Gateway               | Backend crash       | Xem logs backend container                                        |
| Files upload mất sau redeploy | Chưa có volume      | Volume `uploads_data` đã cấu hình trong `docker-compose.prod.yml` |
