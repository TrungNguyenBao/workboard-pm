.PHONY: dev dev-backend dev-frontend migrate seed test lint format docker-up docker-down docker-prod-build docker-prod-up docker-prod-down install

# Development
dev:
	docker-compose up -d && concurrently "make dev-backend" "make dev-frontend"

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# Database
migrate:
	cd backend && uv run alembic upgrade head

migrate-down:
	cd backend && uv run alembic downgrade -1

migrate-create:
	cd backend && uv run alembic revision --autogenerate -m "$(name)"

seed:
	cd backend && uv run python -m app.scripts.seed

db-reset:
	cd backend && uv run alembic downgrade base && uv run alembic upgrade head

# Testing
test:
	cd backend && uv run pytest -v && cd ../frontend && npm run test:run

test-backend:
	cd backend && uv run pytest -v

test-frontend:
	cd frontend && npm run test:run

test-e2e:
	cd e2e && npm test

# Code quality
lint:
	cd backend && uv run ruff check app/ && cd ../frontend && npm run lint

format:
	cd backend && uv run ruff format app/ && cd ../frontend && npm run format

# Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Production Docker
docker-prod-build:
	docker-compose -f docker-compose.prod.yml build

docker-prod-up:
	docker-compose -f docker-compose.prod.yml up -d

docker-prod-down:
	docker-compose -f docker-compose.prod.yml down

run-worker:
	cd backend && uv run arq app.worker.tasks.WorkerSettings

# Install dependencies
install:
	cd backend && uv sync && cd ../frontend && npm install && cd ../e2e && npm install
