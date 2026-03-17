# CLAUDE.md — FleeMa Project Guide

---

## Development Methodology — Superpowers Workflow

**All development work follows the Superpowers methodology. These workflows are mandatory and apply automatically.**

### Core Philosophy

- **Test-Driven Development** — Write failing tests first, always
- **YAGNI** — You Aren't Gonna Need It (build only what is specified)
- **DRY** — Don't Repeat Yourself
- **Systematic over ad-hoc** — Process over guessing
- **Evidence over claims** — Verify before declaring success (never say "should work")
- **Complexity reduction** — Simplicity is a primary goal
fo- **No emojis** — Never use emojis in code, commits, comments, or documentation

### Mandatory Workflows

#### 1. BRAINSTORMING — Before Writing Code

Before implementing anything non-trivial:
1. Ask clarifying questions to refine requirements
2. Explore alternatives and trade-offs
3. Present design in short readable sections for validation
4. Get explicit approval before proceeding

**Do not jump to code.** Confirm design first.

#### 2. WRITING PLANS — After Design Approval

Break work into bite-sized tasks (2–5 minutes each). Every task must include:
- Exact file paths to create or modify
- Complete code (not pseudocode)
- Test to write first (RED step)
- Verification steps

Plans prioritize: RED/GREEN/REFACTOR TDD, YAGNI, DRY.

#### 3. USING GIT WORKTREES — Before Executing Plans

Before starting implementation:
1. Check for `.worktrees/` directory (use if exists)
2. Verify git-ignored: `git check-ignore .worktrees`
3. Create worktree: `git worktree add .worktrees/<feature> -b feature/<feature>`
4. Run project setup (install deps)
5. Verify clean test baseline

**Never start implementation on `main`/`dev` without explicit consent.**

#### 4. TEST-DRIVEN DEVELOPMENT — During All Implementation

Strict RED → GREEN → REFACTOR cycle:

1. **RED**: Write smallest failing test. Run it. Confirm failure for right reason.
2. **GREEN**: Write minimum code to pass. Run it. Confirm pass.
3. **REFACTOR**: Clean up. Run tests again. Confirm still green.
4. **COMMIT** after each passing cycle.

**Rules:**
- Never write implementation before failing test
- If code exists before test, delete it and start with test
- Never skip RED step — always watch test fail first
- Tests must be automated, not manual

#### 5. SYSTEMATIC DEBUGGING — Before Proposing Fixes

**THE IRON LAW: No fixes without root cause investigation first.**

**Phase 1 — Root Cause Investigation:**
- Read full error messages (stack traces, line numbers, codes)
- Reproduce issue consistently
- Check recent changes (`git diff`, recent commits)
- Add diagnostic instrumentation at boundaries
- Trace data flow backward to source

**Phase 2 — Pattern Analysis:**
- Find working examples of similar code
- Read reference implementations completely
- List every difference between working and broken

**Phase 3 — Hypothesis Testing:**
- Form ONE specific hypothesis: "I think X is the root cause because Y"
- Make SMALLEST possible change to test it
- One variable at a time
- If failed, form NEW hypothesis — don't stack fixes

**Phase 4 — Implementation:**
- Create failing test case FIRST
- Implement ONE fix addressing root cause
- Verify: tests pass, no regressions
- If 3+ fixes failed: STOP — question the architecture

**Red flags — return to Phase 1:**
- "Quick fix for now"
- "Just try changing X"
- Proposing solutions before tracing data flow
- "I don't fully understand but this might work"

#### 6. VERIFICATION BEFORE COMPLETION

**THE IRON LAW: No completion claims without fresh verification evidence.**

Before claiming done/fixed/passing:
1. Identify command that proves the claim
2. Run FULL command fresh
3. Read full output, check exit code, count failures
4. Only then make claim — include evidence

**Never use:** "should work", "probably passes", "looks correct", "seems fine", "I'm confident"

Every positive claim requires command run in same message.

#### 7. REQUESTING CODE REVIEW — Between Tasks

After each task, review against plan:
- Code matches spec exactly? (not more, not less)
- Missing requirements?
- Extra/unrequested additions?
- Code quality: naming, duplication, complexity, test coverage

Critical issues block progress.

#### 8. FINISHING A DEVELOPMENT BRANCH — When Work Complete

When all tasks done:
1. Verify ALL tests pass
2. Determine base branch
3. Present exactly these 4 options:
   - Merge back to `<base-branch>` locally
   - Push and create Pull Request
   - Keep branch as-is
   - Discard this work
4. Execute chosen option
5. Clean up worktree (options 1 and 4)

For "Discard": require typed confirmation `discard`.

### Quick Decision Reference

| Situation | Apply |
|-----------|-------|
| Starting any feature/task | Brainstorming → Writing Plans |
| About to write code | Using Git Worktrees first |
| Writing implementation | Test-Driven Development |
| Encountered bug/failure | Systematic Debugging |
| About to say "done"/"fixed" | Verification Before Completion |
| Finished a task | Code Review |
| All tasks complete | Finishing a Development Branch |

### Red Flags — Always Stop

- Writing code before failing test exists
- Proposing fixes before root cause found
- Claiming success without running verification
- Working directly on `main`/`dev` without worktree/branch
- YAGNI violations (building unrequested features)
- Skipping reviews between tasks

---

## Project Overview

**FleeMa** is a multi-tenant fleet management platform that helps organizations manage vehicles, drivers, customers, and related operations. Built with Django REST Framework (backend) and React + TypeScript (frontend), it provides a modern SaaS architecture with role-based access control (RBAC) and full data isolation between tenants.

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend API | Django + DRF | 5.1 |
| Frontend | React + TypeScript + Vite | 19.2 |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| State Management | Zustand | 5.0 |
| Authentication | DRF Token (httpOnly cookie) | - |
| Testing (Backend) | pytest + pytest-django | - |
| Testing (Frontend) | Vitest + Testing Library | - |
| Linting (Backend) | Ruff | - |
| Linting (Frontend) | ESLint + Prettier | - |
| Deployment | Docker + Docker Compose + Nginx | - |
| CI/CD | GitHub Actions | - |

---

## Project Structure

```
FleeMa/
├── backend/                    # Django REST API
│   ├── config/                 # Django settings, URL routing, WSGI/ASGI
│   ├── authentication/         # Custom User model, auth views, permissions
│   │   ├── models.py           # User model with Role (5 RBAC roles)
│   │   ├── views.py            # Login, register, profile, password change
│   │   ├── authentication.py   # CookieTokenAuthentication
│   │   ├── permissions.py      # RBAC permission classes
│   │   └── tests/              # 2 test files (auth_views, permissions)
│   ├── tenants/                # Multi-tenancy core
│   │   ├── models.py           # Tenant + TenantAwareModel (soft-delete)
│   │   ├── permissions.py      # Tenant isolation checks
│   │   └── tests/              # Tenant model tests
│   ├── fleet/                  # Vehicle management
│   │   ├── models.py           # Vehicle, StatusHistory, VehicleDocument
│   │   ├── views.py            # CRUD + search/filter
│   │   ├── serializers.py      # DRF serializers
│   │   └── tests/              # 2 test files (API + models)
│   ├── customers/              # Customer management
│   │   ├── models.py           # Customer (individual/business)
│   │   ├── views.py            # CRUD + search/summary
│   │   └── tests/              # Customer API tests
│   ├── manage.py
│   ├── requirements.txt        # Production dependencies
│   ├── requirements-dev.txt    # Dev/test dependencies
│   ├── pytest.ini              # pytest configuration
│   ├── ruff.toml               # Ruff linter/formatter config
│   └── Dockerfile
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── lib/
│   │   │   └── api.ts          # Axios client with cookie auth
│   │   ├── store/              # Zustand stores
│   │   │   ├── authStore.ts    # Auth state + login/logout/register
│   │   │   ├── vehicleStore.ts # Vehicle CRUD + filtering
│   │   │   └── customerStore.ts# Customer CRUD + search
│   │   ├── pages/              # Route components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── VehiclesPage.tsx
│   │   │   ├── VehicleFormPage.tsx
│   │   │   ├── VehicleDetailPage.tsx
│   │   │   ├── CustomersPage.tsx
│   │   │   └── CustomerFormPage.tsx
│   │   ├── components/
│   │   │   └── RouteGuards.tsx # Protected routes wrapper
│   │   ├── hooks/
│   │   │   └── usePermissions.ts # Role-based permission checks
│   │   ├── test/
│   │   │   └── setup.ts        # Vitest + Testing Library setup
│   │   ├── types.ts            # Shared TypeScript types
│   │   ├── App.tsx             # React Router setup
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── nginx/                      # Reverse proxy for production
│   └── nginx.conf              # Routes / to frontend, /api/* to backend
│
├── .github/workflows/
│   └── ci.yml                  # CI pipeline: lint + test + docker build
│
├── docs/
│   └── architecture.md         # System architecture diagrams
│
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Dev overrides
├── Makefile                    # Developer commands
├── .env.example                # Environment variable template
├── README.md                   # Quick start guide
└── CLAUDE.md                   # This file
```

---

## Core Architecture

### Multi-Tenancy

All business data inherits from `TenantAwareModel` (`backend/tenants/models.py`), which provides:

- Automatic `tenant` ForeignKey
- `.for_tenant(tenant)` queryset filter for data isolation
- Soft-delete with `deleted_at` timestamp (`is_deleted()` property)
- `created_at` and `updated_at` timestamps

**Data Isolation:** Every API request is scoped to the authenticated user's tenant. Querysets are filtered automatically to prevent cross-tenant data leaks.

### Authentication Flow

1. User submits `email` + `password` to `POST /api/v1/auth/login/`
2. Django validates credentials, creates/retrieves DRF Token
3. Token is set in an **httpOnly cookie** named `fleema_auth` (7-day expiry)
4. All subsequent requests include the cookie automatically
5. `CookieTokenAuthentication` reads the cookie (or falls back to `Authorization: Token <token>` header)
6. User object and tenant are attached to `request.user`

**Security:**
- `httpOnly` prevents XSS access to token
- `SameSite=Lax` prevents CSRF attacks
- `Secure` flag enabled in production (HTTPS only)

### RBAC (Role-Based Access Control)

Five roles defined in `authentication.models.Role`:

| Role | Scope | Permissions |
|------|-------|-------------|
| `SUPERADMIN` | Platform-wide | Manages all tenants, unrestricted access |
| `TENANT_ADMIN` | Single tenant | Full tenant management (users, vehicles, customers) |
| `MANAGER` | Single tenant | Manage vehicles, drivers, expenses |
| `EMPLOYEE` | Single tenant | View own data, submit expenses |
| `DRIVER` | Single tenant | View assigned vehicles, trips |

Permission classes (`backend/authentication/permissions.py`):
- `IsSaaSAdmin` — allows only superadmins
- `IsTenantAdmin` — allows tenant admins + superadmins
- `IsTenantMember` — allows any tenant member (blocks cross-tenant access)

---

## Key Models

### User (`backend/authentication/models.py`)

Custom user model extending Django's `AbstractUser`:

```python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(choices=Role.choices)
    tenant = models.ForeignKey('tenants.Tenant', ...)
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD = 'email'
```

**Key Properties:**
- `is_superadmin`, `is_tenant_admin`, `is_manager` — role checks

### Tenant (`backend/tenants/models.py`)

```python
class Tenant(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
```

Each tenant represents an organization using the platform.

### Vehicle (`backend/fleet/models.py`)

```python
class Vehicle(TenantAwareModel):
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    license_plate = models.CharField(max_length=30)
    vin = models.CharField(max_length=50, blank=True)
    fuel_type = models.CharField(choices=FuelType.choices)
    status = models.CharField(choices=VehicleStatus.choices)
    current_mileage = models.PositiveIntegerField(default=0)
    baseline_fuel_consumption = models.DecimalField(...)
    assigned_driver = models.OneToOneField(User, ...)
```

**Features:**
- Status workflow: `ACTIVE` → `MAINTENANCE` → `OUT_OF_SERVICE` → `SOLD`
- `.transition_status(new_status)` enforces valid state transitions
- `StatusHistory` tracks all status changes
- `VehicleDocument` for registration, insurance, inspection docs

### Customer (`backend/customers/models.py`)

```python
class Customer(TenantAwareModel):
    customer_type = models.CharField(choices=CustomerType.choices)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
```

**Features:**
- Two types: `INDIVIDUAL` / `BUSINESS`
- Unique email per tenant (constraint)

---

## API Endpoints

All endpoints are prefixed with `/api/v1/`.

### Authentication (`/auth/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register/` | No | Create account + tenant |
| POST | `/login/` | No | Login, receive token in cookie |
| POST | `/logout/` | Yes | Invalidate token |
| GET | `/me/` | Yes | Get current user |
| PUT | `/me/` | Yes | Update profile |
| POST | `/change-password/` | Yes | Change password |

### Vehicles (`/vehicles/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | Yes | List vehicles (paginated, searchable) |
| POST | `/` | Yes | Create vehicle |
| GET | `/:id/` | Yes | Get vehicle detail |
| PUT | `/:id/` | Yes | Update vehicle |
| DELETE | `/:id/` | Yes | Soft-delete vehicle |
| GET | `/summary/` | Yes | Vehicle status summary (counts) |

**Search/Filter:**
- `?search=<query>` — searches make, model, license plate
- `?status=<status>` — filter by status
- `?fuel_type=<type>` — filter by fuel type

### Customers (`/customers/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/` | Yes | List customers (paginated, searchable) |
| POST | `/` | Yes | Create customer |
| GET | `/:id/` | Yes | Get customer detail |
| PUT | `/:id/` | Yes | Update customer |
| DELETE | `/:id/` | Yes | Soft-delete customer |
| GET | `/summary/` | Yes | Customer type summary (counts) |

**Search/Filter:**
- `?search=<query>` — searches name, email, phone
- `?customer_type=<type>` — filter by customer type

---

## Development Workflow

### Prerequisites

- Python 3.12+
- Node.js 22+
- PostgreSQL 16 (or use Docker / SQLite for local dev)
- Redis 7 (optional, for caching)

### Quick Start (No Docker)

```bash
# Clone
git clone https://github.com/pelino250/FleeMa.git
cd FleeMa

# Copy environment variables
cp .env.example .env

# Install all dependencies
make install

# Run migrations (uses SQLite by default)
USE_SQLITE=True make migrate

# Create superuser (optional)
make createsuperuser

# Start both servers in parallel
make dev
```

- Backend: http://localhost:8000/api/v1/
- Frontend: http://localhost:5173/

### Docker Development

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Full stack at http://localhost (Nginx proxy).

### Available Make Commands

```bash
make help              # Show all commands
make dev               # Start backend + frontend (parallel)
make test              # Run all tests
make test-backend      # Run backend tests (pytest)
make test-frontend     # Run frontend tests (vitest)
make lint              # Run all linters
make lint-backend      # Lint backend (ruff)
make lint-frontend     # Lint frontend (eslint)
make format            # Auto-format all code
make migrate           # Run Django migrations
make createsuperuser   # Create Django superuser
```

---

## Testing

### Backend Tests

- Framework: **pytest** + **pytest-django** + **pytest-cov**
- Location: `backend/<app>/tests/`
- Config: `backend/pytest.ini`
- Total: **10 test files**

**Run tests:**
```bash
make test-backend
# or
cd backend && USE_SQLITE=True .venv/bin/pytest -v
```

**Coverage:**
```bash
cd backend
USE_SQLITE=True .venv/bin/pytest --cov=. --cov-report=html
```

**Test Files:**
- `authentication/tests/test_auth_views.py` — login, register, profile, logout
- `authentication/tests/test_permissions.py` — RBAC permission classes
- `tenants/tests/test_tenant_models.py` — tenant isolation
- `fleet/tests/test_vehicle_api.py` — vehicle CRUD, search, soft-delete
- `fleet/tests/test_vehicle_models.py` — status transitions, constraints
- `customers/tests/test_customer_api.py` — customer CRUD, search, summary

### Frontend Tests

- Framework: **Vitest** + **@testing-library/react**
- Location: `frontend/src/`
- Config: `frontend/vite.config.ts`
- Total: **4 test files**

**Run tests:**
```bash
make test-frontend
# or
cd frontend && npm test
```

**Test Files:**
- `store/authStore.test.ts` — auth state management (login, logout, register)
- `hooks/usePermissions.test.ts` — role-based permission hooks
- `App.test.tsx` — routing smoke tests
- `sprint2.test.tsx` — vehicle + customer page integration tests (18 tests)

---

## Code Quality

### Backend Linting

- Tool: **Ruff** (fast Python linter + formatter)
- Config: `backend/ruff.toml`

```bash
make lint-backend   # Check code
make format         # Auto-fix
```

### Frontend Linting

- Tools: **ESLint** + **Prettier**
- Config: `frontend/.prettierrc`

```bash
make lint-frontend  # Check code
make format         # Auto-fix
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main` or `develop`:

1. **Backend Lint** — `ruff check` + `ruff format --check`
2. **Backend Tests** — `pytest` with coverage
3. **Frontend Lint + Typecheck** — `tsc --noEmit`
4. **Frontend Tests** — `vitest run`
5. **Docker Build** — validates both Dockerfiles build successfully

All jobs run in parallel for fast feedback.

---

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost 127.0.0.1

# Database (PostgreSQL)
POSTGRES_DB=fleema
POSTGRES_USER=fleema
POSTGRES_PASSWORD=fleema
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Use SQLite instead (for local dev without Docker)
USE_SQLITE=True

# CORS (frontend URLs)
CORS_ALLOWED_ORIGINS=http://localhost:5173 http://localhost:3000

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
```

---

## Database Migrations

When you modify models:

```bash
cd backend
.venv/bin/python manage.py makemigrations
.venv/bin/python manage.py migrate
```

Or use the Makefile:

```bash
make migrate
```

---

## Key Design Patterns

### Soft Delete

All models extending `TenantAwareModel` have soft-delete:

```python
vehicle.delete()  # Sets deleted_at = now()
Vehicle.objects.all()  # Includes deleted
Vehicle.objects.filter(deleted_at__isnull=True)  # Active only
vehicle.is_deleted()  # Property check
```

### Tenant Scoping

```python
# In views:
vehicles = Vehicle.objects.for_tenant(request.user.tenant)

# In models (queryset method):
class TenantAwareQuerySet(models.QuerySet):
    def for_tenant(self, tenant):
        return self.filter(tenant=tenant, deleted_at__isnull=True)
```

### Status Transitions

Vehicles have enforced state transitions:

```python
vehicle.transition_status('maintenance')  # Valid
vehicle.transition_status('sold')  # Invalid (raises ValidationError)
```

---

## Frontend State Management

### Zustand Stores

Three global stores in `frontend/src/store/`:

1. **`authStore.ts`**
   - `user`, `isAuthenticated`, `isLoading`
   - `login(email, password)`, `logout()`, `register(...)`
   - `fetchCurrentUser()` — sync auth state on reload

2. **`vehicleStore.ts`**
   - `vehicles`, `isLoading`, `error`
   - `fetchVehicles()`, `createVehicle()`, `updateVehicle()`, `deleteVehicle()`
   - `searchVehicles(query)`, `filterByStatus(status)`

3. **`customerStore.ts`**
   - `customers`, `isLoading`, `error`
   - `fetchCustomers()`, `createCustomer()`, `updateCustomer()`, `deleteCustomer()`
   - `searchCustomers(query)`

### Route Guards

Protected routes in `App.tsx` use `<RouteGuard>` component:

```tsx
<Route element={<RouteGuard />}>
  <Route path="/vehicles" element={<VehiclesPage />} />
  {/* ... other protected routes ... */}
</Route>
```

If not authenticated, redirects to `/login`.

### Permission Checks

`hooks/usePermissions.ts` provides role-based checks:

```tsx
const { canManageVehicles, canManageCustomers } = usePermissions();

{canManageVehicles && <CreateVehicleButton />}
```

---

## Deployment

### Production Stack (Docker Compose)

```bash
docker compose up -d --build
```

Services:
- **backend** — Django + Gunicorn (port 8000)
- **frontend** — Nginx serving static React build (port 80)
- **nginx** — Reverse proxy routing `/` to frontend, `/api/*` to backend
- **postgres** — PostgreSQL 16
- **redis** — Redis 7

### Static Files

```bash
cd backend
.venv/bin/python manage.py collectstatic --noinput
```

---

## Common Tasks

### Add a New Django App

```bash
cd backend
.venv/bin/python manage.py startapp <app_name>
```

1. Add to `INSTALLED_APPS` in `config/settings.py`
2. Create models (inherit `TenantAwareModel`)
3. Run `makemigrations` and `migrate`
4. Add views, serializers, URLs
5. Register with admin (optional)

### Add a New Frontend Page

1. Create component in `frontend/src/pages/<PageName>.tsx`
2. Add route in `frontend/src/App.tsx`
3. Add store if needed in `frontend/src/store/<storeName>.ts`

### Add a New Test

**Backend:**
```bash
# Create test file
touch backend/<app>/tests/test_<feature>.py

# Write tests using pytest + pytest-django
# Run: make test-backend
```

**Frontend:**
```bash
# Create test file
touch frontend/src/<component>.test.tsx

# Write tests using vitest + testing-library
# Run: make test-frontend
```

---

## Current Sprint Status

### Completed Features

**Sprint 1: Authentication & Multi-Tenancy**
- User registration with automatic tenant creation
- Login/logout with httpOnly cookie auth
- Profile management
- RBAC with 5 roles
- Tenant isolation at database level

**Sprint 2: Core Fleet & Customer Management**
- Vehicle CRUD with status workflow
- Customer CRUD (individual/business)
- Search/filter for vehicles and customers
- Soft-delete for both entities
- Summary endpoints (status counts, customer type counts)
- Frontend pages with forms and routing
- 20 backend tests, 18 frontend tests

### Upcoming Sprints

**Sprint 3: Driver & Trip Management**
- Driver profiles
- Trip logging (start, end, mileage, fuel)
- Driver assignment to vehicles
- Trip history and reports

**Sprint 4: Maintenance & Expenses**
- Maintenance records
- Expense tracking (fuel, repairs, tolls)
- Expense approval workflow
- Maintenance schedules and alerts

**Sprint 5: Reports & Analytics**
- Fuel consumption reports
- Cost analysis
- Vehicle utilization metrics
- Export to CSV/PDF

---

---

## DevOps Implementation

FleeMa includes a complete, beginner-friendly DevOps setup for learning infrastructure as code, automation, and deployment practices.

### DevOps Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container Registry | GitHub Container Registry (GHCR) | Store and distribute Docker images |
| Infrastructure as Code | Terraform | Provision AWS infrastructure |
| Configuration Management | Ansible | Automate server setup and deployment |
| CI/CD | GitHub Actions | Automated testing, building, and deployment |
| Cloud Provider | AWS | Host application (EC2, RDS, ElastiCache) |
| Security Scanning | Trivy | Container vulnerability scanning |

### Learning Path (8 Weeks)

**Phase 1: Container Registry (Week 1)**
- GitHub Container Registry setup
- Automated image builds with GitHub Actions
- Security scanning with Trivy
- Semantic versioning

**Phase 2: Infrastructure as Code (Week 2-3)**
- Terraform basics and workflow
- Provision VPC, EC2, RDS, ElastiCache
- AWS fundamentals (networking, security groups)
- State management

**Phase 3: Configuration Management (Week 4)**
- Ansible playbooks for server setup
- Automated deployment with Ansible
- Docker Compose orchestration
- Idempotency and automation patterns

**Phase 4: CI/CD Pipeline (Week 5)**
- Enhanced CI pipeline (lint, test, build, scan, push)
- Continuous deployment workflow
- Automated health checks
- Deployment strategies

**Phase 5: Security Basics (Week 6)**
- Secrets management (AWS Parameter Store)
- SAST scanning (Bandit, ESLint security)
- Container scanning integration
- AWS IAM and encryption

**Phase 6: Monitoring Essentials (Week 7)**
- CloudWatch logging and metrics
- Application dashboards
- Basic alerting (SNS + email)
- Log aggregation

**Phase 7: Documentation (Week 8)**
- Deployment runbooks
- Troubleshooting guides
- Architecture documentation

### AWS Infrastructure (Dev Environment)

```
VPC (10.0.0.0/16)
  ├── Public Subnet (10.0.1.0/24)
  │   └── EC2 Instance (t3.micro)
  │       ├── Docker + Docker Compose
  │       ├── Backend container
  │       ├── Frontend container
  │       └── Nginx reverse proxy
  ├── RDS PostgreSQL (db.t3.micro, single AZ)
  └── ElastiCache Redis (cache.t3.micro, single node)
```

**Cost:** ~$5-10/month with AWS free tier, ~$38/month after

### Quick Start

**1. Build and Push Images (Phase 1)**
```bash
# Workflow runs automatically on push to main/dev
git push origin dev
# Check: GitHub → Actions tab → Build and Push to GHCR
```

**2. Provision Infrastructure (Phase 2)**
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```

**3. Deploy Application (Phase 3)**
```bash
cd ansible
# Edit inventory.ini with EC2 IP from terraform output
ansible-playbook playbooks/setup.yml
ansible-playbook playbooks/deploy.yml \
  --extra-vars "db_password=XXX github_username=YYY"
```

### Documentation

Complete learning guides available in `docs/devops/`:
- [DevOps Learning Roadmap](docs/devops/README.md)
- [Phase 1: Container Registry](docs/devops/01-container-registry.md)
- [Terraform Configuration](terraform/README.md)
- [Ansible Automation](ansible/README.md)

### Key Features

**Beginner-Friendly:**
- Simple, flat Terraform structure (no complex modules)
- Well-commented configuration files
- Step-by-step documentation with explanations
- Clear progression from basic to advanced

**Practical:**
- Real AWS infrastructure (not toy examples)
- Production-ready patterns
- AWS free tier optimized
- Portfolio-worthy project

**Comprehensive:**
- Complete CI/CD pipeline
- Infrastructure as code
- Automated deployment
- Security scanning
- Basic monitoring

---

## Additional Resources

- **README.md** — Quick start guide
- **docs/architecture.md** — System architecture diagrams
- **docs/devops/README.md** — DevOps learning roadmap
- **CONTRIBUTING.md** — Contribution guidelines
- **CODE_OF_CONDUCT.md** — Community standards
- **LICENSE** — MIT License

---

## Troubleshooting

### Backend Issues

**Import errors:**
```bash
cd backend
.venv/bin/pip install -r requirements.txt -r requirements-dev.txt
```

**Database errors:**
```bash
# Reset database (SQLite)
rm backend/test_db.sqlite3
make migrate

# Or use PostgreSQL
docker compose up postgres -d
make migrate
```

**Test failures:**
```bash
# Run with verbose output
cd backend
USE_SQLITE=True .venv/bin/pytest -vv --tb=short
```

### Frontend Issues

**Dependency errors:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
cd frontend
npx tsc -b --noEmit  # Check for type errors
npm run build
```

**Test failures:**
```bash
cd frontend
npm test -- --reporter=verbose
```

---

## Contact & Support

- **GitHub:** https://github.com/pelino250/FleeMa
- **Issues:** https://github.com/pelino250/FleeMa/issues
- **License:** MIT

---

**Last Updated:** 2026-03-15
**Version:** 0.1.0
**Status:** Active Development
