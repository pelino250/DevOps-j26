# FleeMa System Overview

**Version:** 0.2.0
**Last Updated:** 2026-03-15
**Status:** Active Development

---

## Table of Contents

1. [What is FleeMa?](#what-is-fleema)
2. [System Architecture](#system-architecture)
3. [Core Modules](#core-modules)
4. [Technology Stack](#technology-stack)
5. [Key Features](#key-features)
6. [Module Breakdown](#module-breakdown)
7. [Data Flow](#data-flow)
8. [Security & Access Control](#security--access-control)
9. [Deployment Architecture](#deployment-architecture)
10. [Getting Started](#getting-started)

---

## What is FleeMa?

**FleeMa** (Fleet Management) is a modern, cloud-native **multi-tenant SaaS platform** designed to help organizations efficiently manage their vehicle fleets, drivers, customers, and related operations.

### Purpose

FleeMa solves the complexity of fleet management by providing:

- **Centralized vehicle tracking** - Monitor all vehicles, their status, mileage, and assignments in one place
- **Multi-tenant isolation** - Each organization's data is completely isolated and secure
- **Driver management** - Assign vehicles to drivers and track their activity
- **Customer relationship management** - Maintain customer records for transportation services
- **Automated workflows** - Handle maintenance schedules, expense approvals, and reporting
- **Role-based access** - Control who can access what data based on their role

### Target Users

- **Fleet Operators** - Companies managing delivery vehicles, taxis, or rental cars
- **Transportation Services** - Ride-sharing, logistics, and courier companies
- **Corporate Fleets** - Businesses managing company vehicles for employees
- **Government Agencies** - Public sector organizations with vehicle fleets

---

## System Architecture

FleeMa follows a **modern microservices-inspired architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   React SPA (TypeScript + Vite + Zustand)           │   │
│  │   - Authentication UI                                 │   │
│  │   - Vehicle Management Dashboard                     │   │
│  │   - Customer Management Interface                    │   │
│  │   - Reports & Analytics                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                      REVERSE PROXY                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Nginx                                              │   │
│  │   - Route /api/* to Backend                          │   │
│  │   - Route /* to Frontend                             │   │
│  │   - SSL/TLS Termination (Production)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       API LAYER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Django REST Framework (Python 3.12)                │   │
│  │   - RESTful API Endpoints                            │   │
│  │   - Token Authentication                             │   │
│  │   - Permission Checks (RBAC)                         │   │
│  │   - Tenant Isolation Middleware                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ┌──────────────┬──────────────┬──────────────┬─────────┐   │
│  │ Authentication│   Tenants    │    Fleet     │Customers│   │
│  │   Module      │   Module     │   Module     │ Module  │   │
│  └──────────────┴──────────────┴──────────────┴─────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌──────────────────────┬──────────────────────────────┐    │
│  │  PostgreSQL 16       │  Redis 7                     │    │
│  │  - User Data         │  - Session Cache             │    │
│  │  - Tenant Data       │  - Query Cache               │    │
│  │  - Vehicle Data      │  - Celery Queue (Future)     │    │
│  │  - Customer Data     │                              │    │
│  └──────────────────────┴──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns** - Frontend, backend, and data layers are independent
2. **API-First Design** - All functionality exposed through REST API
3. **Stateless Backend** - Authentication via tokens, scalable horizontally
4. **Multi-Tenancy** - Data isolation at database level
5. **Security by Default** - Authentication required, RBAC enforced, data encrypted

---

## Core Modules

FleeMa is organized into **6 core modules**, each handling specific business domain:

### 1. Authentication Module
**Purpose:** User identity, authentication, and authorization
**Location:** `backend/authentication/`

### 2. Tenants Module
**Purpose:** Multi-tenancy management and data isolation
**Location:** `backend/tenants/`

### 3. Fleet Module
**Purpose:** Vehicle management and tracking
**Location:** `backend/fleet/`

### 4. Customers Module
**Purpose:** Customer relationship management
**Location:** `backend/customers/`

### 5. Frontend Module
**Purpose:** User interface and client-side logic
**Location:** `frontend/`

### 6. DevOps Module
**Purpose:** Infrastructure, CI/CD, and deployment automation
**Location:** `terraform/`, `ansible/`, `.github/workflows/`

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.12 | Primary programming language |
| **Django** | 5.1 | Web framework and ORM |
| **Django REST Framework** | 3.15 | REST API framework |
| **PostgreSQL** | 16 | Primary relational database |
| **Redis** | 7 | Caching and session storage |
| **Gunicorn** | 23.0 | WSGI HTTP server |
| **pytest** | 8.3 | Testing framework |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2 | UI framework |
| **TypeScript** | 5.7 | Type-safe JavaScript |
| **Vite** | 6.0 | Build tool and dev server |
| **Zustand** | 5.0 | State management |
| **Axios** | 1.7 | HTTP client |
| **Vitest** | 2.1 | Testing framework |

### Infrastructure & DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | 27.x | Containerization |
| **Nginx** | 1.27 | Reverse proxy |
| **Terraform** | 1.10 | Infrastructure as Code |
| **Ansible** | 2.18 | Configuration management |
| **GitHub Actions** | - | CI/CD automation |
| **AWS EC2** | - | Application hosting |
| **AWS RDS** | PostgreSQL 16 | Managed database |
| **AWS ElastiCache** | Redis 7 | Managed cache |

---

## Key Features

### ✅ Implemented Features (Sprint 1-2)

#### Multi-Tenant Architecture
- Complete data isolation between organizations
- Automatic tenant assignment on user registration
- Tenant-scoped queries (prevents cross-tenant data leaks)
- Soft-delete with `deleted_at` timestamps

#### Authentication & Authorization
- Email-based authentication
- Token-based auth with httpOnly cookies
- 5-tier RBAC system:
  - **Superadmin** - Platform-wide access
  - **Tenant Admin** - Full tenant management
  - **Manager** - Fleet and expense management
  - **Employee** - Limited data access
  - **Driver** - Vehicle and trip access

#### Vehicle Management
- Complete CRUD operations
- Vehicle status workflow: `ACTIVE` → `MAINTENANCE` → `OUT_OF_SERVICE` → `SOLD`
- Driver assignment (one-to-one)
- Mileage tracking
- Fuel consumption monitoring
- Document management (registration, insurance, inspection)
- Status history tracking
- Search and filtering by status, fuel type, make/model

#### Customer Management
- Individual and business customer types
- Contact information management
- Tax ID tracking for businesses
- Contact person for business accounts
- Search and filtering
- Customer type summary statistics

#### DevOps & Deployment
- Automated CI/CD pipeline
- Docker containerization
- Infrastructure as Code (Terraform)
- Configuration management (Ansible)
- Automated deployments on push to dev
- Security scanning with Trivy
- AWS cloud deployment

### 🚧 Planned Features (Sprint 3-5)

#### Driver Management (Sprint 3)
- Driver profiles and credentials
- License verification
- Vehicle assignment history
- Performance tracking

#### Trip Management (Sprint 3)
- Trip logging (start, end, mileage, fuel)
- Route tracking
- Trip history and reports
- Driver performance metrics

#### Maintenance Management (Sprint 4)
- Maintenance schedules
- Service records
- Preventive maintenance alerts
- Maintenance cost tracking
- Vendor management

#### Expense Management (Sprint 4)
- Expense recording (fuel, repairs, tolls)
- Receipt uploads
- Approval workflows
- Budget tracking
- Cost analysis

#### Reports & Analytics (Sprint 5)
- Fuel consumption reports
- Cost analysis dashboards
- Vehicle utilization metrics
- Driver performance reports
- Export to CSV/PDF

---

## Module Breakdown

### Module 1: Authentication

**Responsibility:** Manage user identity, authentication, and authorization.

#### Components

**Models:**
- `User` - Custom user model extending Django's AbstractUser
  - Email-based authentication (no username)
  - Role assignment (5 roles)
  - Tenant association
  - Phone number
  - Active status

**Views/Endpoints:**
- `POST /api/v1/auth/register/` - Create account + tenant
- `POST /api/v1/auth/login/` - Login and receive token
- `POST /api/v1/auth/logout/` - Invalidate token
- `GET /api/v1/auth/me/` - Get current user
- `PUT /api/v1/auth/me/` - Update profile
- `POST /api/v1/auth/change-password/` - Change password

**Authentication:**
- `CookieTokenAuthentication` - Reads token from httpOnly cookie or Authorization header
- Token stored in `fleema_auth` cookie (7-day expiry)
- Secure, httpOnly, SameSite=Lax

**Permissions:**
- `IsSaaSAdmin` - Superadmin only
- `IsTenantAdmin` - Tenant admin + superadmin
- `IsTenantMember` - Any tenant member

**Security Features:**
- Password hashing with Django's built-in PBKDF2
- Token authentication
- CORS protection
- CSRF protection
- XSS prevention (httpOnly cookies)

**Tests:**
- `test_auth_views.py` - Login, register, profile, logout
- `test_permissions.py` - RBAC permission classes

---

### Module 2: Tenants

**Responsibility:** Enable multi-tenancy with complete data isolation.

#### Components

**Models:**
- `Tenant` - Organization/company entity
  - Unique name and slug
  - Active status
  - Created timestamp

- `TenantAwareModel` (Abstract Base Class)
  - Auto-added `tenant` ForeignKey
  - Auto-added `created_at`, `updated_at`
  - Auto-added `deleted_at` (soft-delete)
  - Custom queryset with `.for_tenant()` method

**Key Features:**

```python
# All business models inherit from TenantAwareModel
class Vehicle(TenantAwareModel):
    # tenant field added automatically
    # created_at, updated_at added automatically
    # deleted_at added automatically
    pass

# Tenant-scoped queries
vehicles = Vehicle.objects.for_tenant(request.user.tenant)

# Soft delete
vehicle.delete()  # Sets deleted_at = now()
vehicle.is_deleted()  # Returns True
```

**Data Isolation:**
- Automatic filtering by tenant in all queries
- Queryset manager enforces tenant scope
- Foreign keys validate same-tenant relationships

**Tests:**
- `test_tenant_models.py` - Tenant isolation, soft-delete

---

### Module 3: Fleet

**Responsibility:** Manage vehicles, their status, assignments, and documentation.

#### Components

**Models:**

1. **Vehicle**
   - Basic info: make, model, year, license plate, VIN
   - Operational: fuel type, current mileage, baseline fuel consumption
   - Status: ACTIVE, MAINTENANCE, OUT_OF_SERVICE, SOLD
   - Assignment: One-to-one with Driver (User)
   - Inherits: TenantAwareModel (tenant, soft-delete, timestamps)

2. **StatusHistory**
   - Tracks all vehicle status changes
   - Records: old status, new status, reason, changed by user
   - Audit trail for compliance

3. **VehicleDocument**
   - Store vehicle-related documents
   - Types: registration, insurance, inspection, manual, other
   - File upload support
   - Expiry date tracking

**Business Logic:**

```python
# Status transition validation
vehicle.transition_status('maintenance')  # ✓ Valid
vehicle.transition_status('sold')  # ✗ Invalid from current state

# Allowed transitions
ACTIVE → MAINTENANCE → ACTIVE
ACTIVE → OUT_OF_SERVICE → MAINTENANCE → ACTIVE
MAINTENANCE → OUT_OF_SERVICE → SOLD
```

**Endpoints:**
- `GET /api/v1/fleet/vehicles/` - List vehicles (paginated, searchable)
- `POST /api/v1/fleet/vehicles/` - Create vehicle
- `GET /api/v1/fleet/vehicles/:id/` - Get vehicle detail
- `PUT /api/v1/fleet/vehicles/:id/` - Update vehicle
- `DELETE /api/v1/fleet/vehicles/:id/` - Soft-delete vehicle
- `GET /api/v1/fleet/vehicles/summary/` - Status summary (counts)

**Search/Filter:**
- `?search=<query>` - Search make, model, license plate
- `?status=<status>` - Filter by status
- `?fuel_type=<type>` - Filter by fuel type

**Validations:**
- Year must be between 1900 and current year + 1
- License plate required
- Status transitions enforced
- Driver assignment (one vehicle per driver)

**Tests:**
- `test_vehicle_api.py` - CRUD, search, filter, soft-delete
- `test_vehicle_models.py` - Status transitions, validations

---

### Module 4: Customers

**Responsibility:** Manage customer information for transportation services.

#### Components

**Models:**

1. **Customer**
   - Type: INDIVIDUAL or BUSINESS
   - Contact: name, email, phone, address
   - Business: tax ID, contact person
   - Notes: Free-form notes field
   - Inherits: TenantAwareModel

**Business Rules:**
- Email must be unique per tenant
- Business customers require contact person
- Tax ID optional but recommended for businesses

**Endpoints:**
- `GET /api/v1/customers/` - List customers (paginated, searchable)
- `POST /api/v1/customers/` - Create customer
- `GET /api/v1/customers/:id/` - Get customer detail
- `PUT /api/v1/customers/:id/` - Update customer
- `DELETE /api/v1/customers/:id/` - Soft-delete customer
- `GET /api/v1/customers/summary/` - Customer type summary

**Search/Filter:**
- `?search=<query>` - Search name, email, phone
- `?customer_type=<type>` - Filter by INDIVIDUAL/BUSINESS

**Validations:**
- Email format validation
- Phone number validation
- Unique email per tenant

**Tests:**
- `test_customer_api.py` - CRUD, search, summary, soft-delete

---

### Module 5: Frontend

**Responsibility:** Provide user interface and client-side application logic.

#### Architecture

```
frontend/
├── src/
│   ├── lib/
│   │   └── api.ts              # Axios client with auth interceptors
│   ├── store/
│   │   ├── authStore.ts        # Authentication state
│   │   ├── vehicleStore.ts     # Vehicle management state
│   │   └── customerStore.ts    # Customer management state
│   ├── pages/
│   │   ├── LoginPage.tsx       # Login form
│   │   ├── RegisterPage.tsx    # Registration form
│   │   ├── ProfilePage.tsx     # User profile
│   │   ├── VehiclesPage.tsx    # Vehicle list
│   │   ├── VehicleFormPage.tsx # Add/edit vehicle
│   │   ├── VehicleDetailPage.tsx # Vehicle details
│   │   ├── CustomersPage.tsx   # Customer list
│   │   └── CustomerFormPage.tsx # Add/edit customer
│   ├── components/
│   │   └── RouteGuards.tsx     # Protected route wrapper
│   ├── hooks/
│   │   └── usePermissions.ts   # Role-based permission checks
│   ├── types.ts                # TypeScript interfaces
│   ├── App.tsx                 # Router configuration
│   └── main.tsx                # Entry point
└── package.json
```

#### State Management (Zustand)

**Auth Store:**
```typescript
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email, password) => Promise<void>
  logout: () => Promise<void>
  register: (userData) => Promise<void>
  fetchCurrentUser: () => Promise<void>
}
```

**Vehicle Store:**
```typescript
interface VehicleStore {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null
  fetchVehicles: () => Promise<void>
  createVehicle: (data) => Promise<void>
  updateVehicle: (id, data) => Promise<void>
  deleteVehicle: (id) => Promise<void>
  searchVehicles: (query) => void
  filterByStatus: (status) => void
}
```

**Customer Store:**
```typescript
interface CustomerStore {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  createCustomer: (data) => Promise<void>
  updateCustomer: (id, data) => Promise<void>
  deleteCustomer: (id) => Promise<void>
  searchCustomers: (query) => void
}
```

#### Routing

```typescript
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Protected routes */}
    <Route element={<RouteGuard />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/vehicles" element={<VehiclesPage />} />
      <Route path="/vehicles/new" element={<VehicleFormPage />} />
      <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/new" element={<CustomerFormPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

#### API Integration

```typescript
// Axios instance with auth
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,  // Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (add token from cookie)
// Response interceptor (handle 401 redirects)
```

**Tests:**
- `authStore.test.ts` - Auth state management
- `usePermissions.test.ts` - Permission hooks
- `App.test.tsx` - Routing
- `sprint2.test.tsx` - Vehicle & customer integration tests

---

### Module 6: DevOps

**Responsibility:** Infrastructure provisioning, configuration management, and deployment automation.

#### Components

**Infrastructure as Code (Terraform):**
- AWS VPC with 2 subnets (Multi-AZ)
- EC2 instance (t3.micro, Ubuntu 22.04)
- RDS PostgreSQL 16 (db.t3.micro)
- ElastiCache Redis 7 (cache.t3.micro)
- Security groups (web, database, cache)
- SSH key pair generation
- Auto-generated outputs

**Configuration Management (Ansible):**
- `playbooks/setup.yml` - Server setup (Docker, firewall, users)
- `playbooks/deploy.yml` - Application deployment
- Idempotent playbooks
- Template-based configuration

**CI/CD Pipeline (GitHub Actions):**
```yaml
Push to dev branch
    ↓
Build Backend Image (parallel)
Build Frontend Image (parallel)
    ↓
Security Scan (Trivy)
    ↓
Push to GHCR
    ↓
Deploy to EC2 (Ansible)
    ↓
Health Check
    ↓
Success ✓
```

**Deployment Flow:**
1. Code pushed to `dev` branch
2. GitHub Actions triggers workflow
3. Docker images built and scanned
4. Images pushed to GitHub Container Registry
5. Ansible connects to EC2 via SSH
6. Pull latest images
7. Stop old containers
8. Start new containers
9. Run database migrations
10. Health check verification
11. Deployment complete (3-4 minutes total)

**Documentation:**
- `docs/devops/01-container-registry.md` - GHCR setup
- `docs/devops/02-terraform-basics.md` - Infrastructure guide
- `docs/devops/03-ansible-basics.md` - Configuration guide
- `docs/devops/04-ci-cd-setup.md` - Pipeline setup
- `docs/devops/README.md` - 8-week learning path

---

## Data Flow

### User Authentication Flow

```
1. User enters email + password in LoginPage
   ↓
2. Frontend sends POST /api/v1/auth/login/
   ↓
3. Backend validates credentials
   ↓
4. Django creates/retrieves DRF Token
   ↓
5. Token set in httpOnly cookie (fleema_auth)
   ↓
6. User object + tenant returned to frontend
   ↓
7. Frontend updates authStore
   ↓
8. User redirected to dashboard
```

### Vehicle Creation Flow

```
1. Manager clicks "Add Vehicle" in VehiclesPage
   ↓
2. VehicleFormPage renders with empty form
   ↓
3. User fills in: make, model, year, license plate, etc.
   ↓
4. User submits form
   ↓
5. Frontend validates data
   ↓
6. vehicleStore.createVehicle() sends POST /api/v1/fleet/vehicles/
   ↓
7. Backend validates permissions (IsManager or higher)
   ↓
8. Backend validates tenant isolation
   ↓
9. Backend creates Vehicle instance with tenant = request.user.tenant
   ↓
10. Backend returns created vehicle
   ↓
11. Frontend updates vehicleStore
   ↓
12. User redirected to VehiclesPage
   ↓
13. New vehicle appears in list
```

### Tenant Isolation Flow

```
User A (Tenant: ABC Corp) requests vehicles
   ↓
GET /api/v1/fleet/vehicles/
   ↓
Backend extracts user from token
   ↓
tenant = request.user.tenant  # ABC Corp
   ↓
queryset = Vehicle.objects.for_tenant(tenant)
   ↓
queryset = Vehicle.objects.filter(tenant=tenant, deleted_at__isnull=True)
   ↓
Only vehicles belonging to ABC Corp returned
   ↓
User A CANNOT see vehicles from XYZ Inc or any other tenant
```

---

## Security & Access Control

### Authentication Mechanisms

1. **Token-Based Authentication**
   - DRF Token created on login
   - Stored in httpOnly cookie (prevents XSS)
   - 7-day expiry
   - SameSite=Lax (prevents CSRF)

2. **Password Security**
   - PBKDF2 hashing with SHA256
   - 600,000 iterations
   - Per-user salt
   - Never stored in plain text

3. **Session Management**
   - Stateless tokens (no server-side session)
   - Token invalidation on logout
   - Token validation on every request

### Authorization Model (RBAC)

**5-Tier Role Hierarchy:**

| Role | Permissions | Use Case |
|------|-------------|----------|
| **SUPERADMIN** | Platform-wide access, manage all tenants | SaaS administrators |
| **TENANT_ADMIN** | Full tenant management, user management | Organization owners |
| **MANAGER** | Manage vehicles, drivers, expenses | Fleet managers |
| **EMPLOYEE** | View own data, submit expenses | Office staff |
| **DRIVER** | View assigned vehicle, log trips | Drivers |

**Permission Matrix:**

| Action | Superadmin | Tenant Admin | Manager | Employee | Driver |
|--------|------------|--------------|---------|----------|--------|
| Create tenant | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage users | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create vehicles | ✓ | ✓ | ✓ | ✗ | ✗ |
| View all vehicles | ✓ | ✓ | ✓ | ✗ | ✗ |
| View assigned vehicle | ✓ | ✓ | ✓ | ✗ | ✓ |
| Manage customers | ✓ | ✓ | ✓ | ✗ | ✗ |
| Submit expenses | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve expenses | ✓ | ✓ | ✓ | ✗ | ✗ |

### Data Security

1. **Encryption in Transit**
   - HTTPS enforced in production
   - TLS 1.3
   - Strong cipher suites

2. **Encryption at Rest**
   - Database encryption (RDS)
   - Storage encryption (EBS)
   - Backup encryption

3. **Tenant Isolation**
   - Row-level security (tenant_id in every query)
   - Foreign key constraints
   - Database-level isolation

4. **Input Validation**
   - Django form validation
   - DRF serializer validation
   - Frontend TypeScript type checking

5. **Output Sanitization**
   - HTML escaping in templates
   - JSON encoding
   - SQL injection prevention (ORM)

---

## Deployment Architecture

### Development Environment

```
Local Machine
├── Backend: http://localhost:8000
├── Frontend: http://localhost:5173
├── Database: SQLite (local file)
└── Cache: Redis (localhost:6379)
```

### Production Environment (AWS)

```
Internet
   ↓
AWS Route 53 (DNS)
   ↓
AWS Application Load Balancer (HTTPS)
   ↓
EC2 Instance (44.199.209.136)
   ├── Nginx (Port 80)
   │   ├── → Frontend Container (Port 3000)
   │   └── → Backend Container (Port 8000)
   ├── Backend Container
   │   ├── Django + Gunicorn
   │   ├── Connects to RDS PostgreSQL
   │   └── Connects to ElastiCache Redis
   ├── RDS PostgreSQL 16
   │   └── fleema-dev-db.cwvio46a8nzz.us-east-1.rds.amazonaws.com
   └── ElastiCache Redis 7
       └── fleema-dev-redis.ftz3yt.0001.use1.cache.amazonaws.com
```

### Container Architecture

```
Docker Network (fleema-network)
│
├── fleema-frontend
│   ├── Image: ghcr.io/pelino250/fleema-frontend:dev
│   ├── Port: 3000:80
│   └── Nginx serving static React build
│
├── fleema-backend
│   ├── Image: ghcr.io/pelino250/fleema-backend:dev
│   ├── Port: 8000:8000
│   ├── Gunicorn WSGI server
│   ├── Environment: POSTGRES_*, REDIS_URL
│   └── Health check: http://localhost:8000/api/v1/
│
└── fleema-nginx
    ├── Image: nginx:1.27-alpine
    ├── Port: 80:80
    ├── Config: /etc/nginx/conf.d/default.conf
    └── Routes:
        ├── / → fleema-frontend:80
        └── /api/ → fleema-backend:8000
```

### Scalability Considerations

**Current (Single Instance):**
- Handles ~100 concurrent users
- ~$12/month with AWS free tier

**Future Scaling Options:**

1. **Horizontal Scaling (Auto-scaling Group)**
   - Multiple EC2 instances
   - Application Load Balancer
   - Session management via Redis
   - Cost: ~$50-100/month

2. **Database Scaling**
   - Read replicas for reporting
   - Connection pooling
   - Query optimization

3. **Caching Layer**
   - Redis caching for frequently accessed data
   - CloudFront CDN for static assets

4. **Microservices Migration**
   - Separate services for fleet, customers, reports
   - Event-driven architecture
   - Message queues (RabbitMQ/SQS)

---

## Getting Started

### For Developers

```bash
# 1. Clone repository
git clone https://github.com/pelino250/FleeMa.git
cd FleeMa

# 2. Install dependencies
make install

# 3. Setup database
USE_SQLITE=True make migrate

# 4. Create superuser
make createsuperuser

# 5. Start development servers
make dev

# Backend: http://localhost:8000/api/v1/
# Frontend: http://localhost:5173/
```

### For DevOps Engineers

```bash
# 1. Configure AWS credentials
aws configure

# 2. Create infrastructure
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply

# 3. Configure servers
cd ../ansible
ansible-playbook playbooks/setup.yml

# 4. Deploy application
ansible-playbook playbooks/deploy.yml \
  --extra-vars "db_password=XXX github_username=XXX"
```

### For End Users

1. Navigate to http://44.199.209.136 (demo environment)
2. Click "Register" to create an account
3. Enter organization name, email, and password
4. Login with your credentials
5. Start managing your fleet!

---

## Project Status

### Completed Sprints

✅ **Sprint 1: Authentication & Multi-Tenancy**
- User registration with automatic tenant creation
- Login/logout with cookie-based auth
- Profile management
- RBAC with 5 roles
- Tenant isolation at database level

✅ **Sprint 2: Core Fleet & Customer Management**
- Vehicle CRUD with status workflow
- Customer CRUD (individual/business)
- Search/filter functionality
- Soft-delete for both entities
- Summary endpoints
- Frontend pages with routing
- 20 backend tests, 18 frontend tests

✅ **Sprint 2.5: DevOps & CI/CD**
- Terraform infrastructure provisioning
- Ansible configuration management
- GitHub Actions CI/CD pipeline
- Automated deployments
- Security scanning
- Comprehensive documentation

### Current Sprint

🚧 **Sprint 3: Driver & Trip Management** (In Planning)
- Driver profiles and licenses
- Trip logging with GPS
- Mileage tracking
- Driver performance metrics

### Future Roadmap

📋 **Sprint 4: Maintenance & Expenses**
- Maintenance scheduling
- Service records
- Expense tracking
- Approval workflows

📋 **Sprint 5: Reports & Analytics**
- Fuel consumption reports
- Cost analysis dashboards
- Vehicle utilization metrics
- Export functionality

📋 **Sprint 6: Mobile App**
- React Native mobile app
- Driver mobile interface
- Real-time GPS tracking
- Push notifications

---

## Resources

### Documentation
- [README.md](../README.md) - Quick start guide
- [CLAUDE.md](../CLAUDE.md) - Project guide with Superpowers methodology
- [Architecture Diagrams](architecture.md) - System architecture
- [DevOps Guide](devops/README.md) - 8-week DevOps learning path
- [CI/CD Setup](devops/04-ci-cd-setup.md) - Pipeline configuration

### API Documentation
- Swagger UI: http://44.199.209.136/api/docs/ (coming soon)
- Redoc: http://44.199.209.136/api/redoc/ (coming soon)

### External Resources
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Ansible Documentation](https://docs.ansible.com/)

---

## Support & Contribution

### Getting Help
- GitHub Issues: https://github.com/pelino250/FleeMa/issues
- Documentation: https://github.com/pelino250/FleeMa/docs

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code of Conduct
- Be respectful and inclusive
- Write clean, documented code
- Follow existing code style
- Write tests for new features
- Update documentation

---

## License

MIT License - See [LICENSE](../LICENSE) for details

---

## Contact

**Project Maintainer:** FleeMa Team
**Repository:** https://github.com/pelino250/FleeMa
**Demo:** http://44.199.209.136

---

**Built with ❤️ for efficient fleet management**
