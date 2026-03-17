# FleeMa Architecture Overview

## System Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│   Browser    │────▶│    Nginx     │────▶│  React SPA   │
│              │     │  (reverse    │     │  (Vite)      │
└──────────────┘     │   proxy)     │     └──────────────┘
                     │              │
                     │  /api/* ─────│────▶┌──────────────┐
                     └──────────────┘     │   Django     │
                                          │   DRF API    │
                                          │              │
                                          └──────┬───────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    │            │            │
                              ┌─────▼─────┐ ┌───▼───┐  ┌────▼────┐
                              │PostgreSQL │ │ Redis │  │ Storage │
                              │   16      │ │   7   │  │ (files) │
                              └───────────┘ └───────┘  └─────────┘
```

## Multi-Tenancy Model

All business data extends `TenantAwareModel`, which provides:
- Automatic `tenant` foreign key
- `for_tenant(tenant)` queryset filter
- Soft-delete with `deleted_at` timestamp

Data isolation is enforced at the query level — every queryset is scoped to the requesting user's tenant.

## Authentication Flow

1. User POSTs email + password to `/api/v1/auth/login/`
2. Server validates credentials, creates/returns DRF Token
3. Token is set as an httpOnly cookie (`fleema_auth`)
4. All subsequent requests include the cookie automatically
5. `CookieTokenAuthentication` reads the cookie (or falls back to `Authorization` header)

## RBAC

Five roles stored on the User model:
- **Superadmin** — platform-wide access
- **Tenant Admin** — full access within their tenant
- **Manager** — vehicle/driver/expense management
- **Employee** — view own data, submit expenses
- **Driver** — view assigned vehicles and trips

Permission classes (`IsSaaSAdmin`, `IsTenantAdmin`, etc.) enforce role checks on every view.
