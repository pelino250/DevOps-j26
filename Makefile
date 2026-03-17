# ─────────────────────────────────────────────
# FleeMa — Root Makefile
# ─────────────────────────────────────────────
BACKEND  := backend
FRONTEND := frontend

.PHONY: help dev dev-backend dev-frontend test test-backend test-frontend \
        lint lint-backend lint-frontend install install-backend install-frontend \
        migrate createsuperuser format

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Install ──────────────────────────────────
install: install-backend install-frontend ## Install all deps

install-backend: ## Install backend deps
	cd $(BACKEND) && python3 -m venv .venv && \
		.venv/bin/pip install -r requirements.txt -r requirements-dev.txt

install-frontend: ## Install frontend deps
	cd $(FRONTEND) && npm install

# ── Dev ──────────────────────────────────────
dev: ## Start backend + frontend (parallel)
	@make -j2 dev-backend dev-frontend

dev-backend: ## Start Django dev server
	cd $(BACKEND) && .venv/bin/python manage.py runserver

dev-frontend: ## Start Vite dev server
	cd $(FRONTEND) && npm run dev

# ── Test ─────────────────────────────────────
test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	cd $(BACKEND) && USE_SQLITE=True .venv/bin/pytest -v

test-frontend: ## Run frontend tests
	cd $(FRONTEND) && npm test

# ── Lint ─────────────────────────────────────
lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint backend (ruff)
	cd $(BACKEND) && .venv/bin/ruff check . && .venv/bin/ruff format --check .

lint-frontend: ## Lint frontend (eslint)
	cd $(FRONTEND) && npm run lint

# ── Format ───────────────────────────────────
format: ## Auto-format all code
	cd $(BACKEND) && .venv/bin/ruff format . && .venv/bin/ruff check --fix .
	cd $(FRONTEND) && npm run format

# ── Django management ────────────────────────
migrate: ## Run Django migrations
	cd $(BACKEND) && .venv/bin/python manage.py migrate

createsuperuser: ## Create Django superuser
	cd $(BACKEND) && .venv/bin/python manage.py createsuperuser
