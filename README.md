# FleeMa — Fleet Management System

A multi-tenant fleet management platform built with Django + React.

![CI](https://github.com/pelino250/FleeMa/actions/workflows/ci.yml/badge.svg)

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Django 5 + Django REST Framework  |
| Frontend   | React 19 + TypeScript + Vite      |
| Database   | PostgreSQL 16                     |
| Cache      | Redis 7                           |
| Auth       | DRF Token (httpOnly cookie)       |
| Deployment | Docker Compose + Nginx            |
| CI/CD      | GitHub Actions                    |

## Quick Start

### Prerequisites
- Python 3.12+, Node.js 22+, Docker (optional)

### Local Development (no Docker)

```bash
# Clone
git clone https://github.com/pelino250/FleeMa.git && cd FleeMa

# Copy env
cp .env.example .env

# Install everything
make install

# Run database migrations (uses SQLite by default for dev)
USE_SQLITE=True make migrate

# Start both servers
make dev
```

- Backend: http://localhost:8000/api/v1/
- Frontend: http://localhost:5173/

### Docker Development

```bash
cp .env.example .env
docker compose up --build
```

Full stack at http://localhost (Nginx proxy).

## Available Commands

```
make help             # Show all commands
make dev              # Start backend + frontend
make test             # Run all tests
make lint             # Run all linters
make format           # Auto-format code
make migrate          # Run Django migrations
make createsuperuser  # Create admin user
```

## API Endpoints

### Authentication (`/api/v1/auth/`)

| Method | Endpoint          | Description            | Auth Required |
|--------|-------------------|------------------------|---------------|
| POST   | `/register/`      | Create account + tenant | No           |
| POST   | `/login/`         | Login, receive token   | No            |
| POST   | `/logout/`        | Invalidate token       | Yes           |
| GET    | `/me/`            | Get current user       | Yes           |
| PUT    | `/me/`            | Update profile         | Yes           |
| POST   | `/change-password/`| Change password       | Yes           |

## Project Structure

```
FleeMa/
├── backend/              # Django API
│   ├── config/           # Django settings, urls, wsgi
│   ├── authentication/   # User model, auth views, RBAC
│   ├── tenants/          # Multi-tenancy models
│   └── Dockerfile
├── frontend/             # React SPA
│   ├── src/
│   │   ├── lib/          # API client, utilities
│   │   ├── store/        # Zustand state management
│   │   └── test/         # Test setup
│   └── Dockerfile
├── nginx/                # Reverse proxy config
├── docker-compose.yml    # Production stack
├── docker-compose.dev.yml # Dev override
├── Makefile              # Developer commands
└── .github/workflows/    # CI/CD pipelines
```

## RBAC Roles

| Role         | Scope          | Description                         |
|--------------|----------------|-------------------------------------|
| Superadmin   | Platform-wide  | Manages all tenants                 |
| Tenant Admin | Single tenant  | Full tenant management              |
| Manager      | Single tenant  | Manages vehicles, drivers, expenses |
| Employee     | Single tenant  | Views own data, submits expenses    |
| Driver       | Single tenant  | Views assigned vehicles, trips      |

## License

[MIT](LICENSE)

testing stuff
