# Multi-Tenant B2B Support Ticket Module — Implementation Plan

## Overview

A full-stack SaaS application where companies (tenants) can sign up, manage employees, and submit support tickets. The system enforces strict data isolation between tenants at the database query level.

**Stack:** Laravel 11 (PHP) + MySQL · Next.js 14 (App Router) + Shadcn UI + Tailwind CSS

---

## Repository Structure

```
saas-management-platform/
├── backend/          # Laravel 11 API
└── frontend/         # Next.js 14 App
```

---

## Proposed Changes

### Phase 1 — Laravel Backend

#### [NEW] `backend/` — Laravel 11 Project

**Database Schema (Migrations)**

| Table | Key Fields |
|---|---|
| `companies` | id, name, subscription_tier (enum: free, pro, enterprise), timestamps |
| `users` | id, company_id (FK), name, email, password, role (enum: SuperAdmin, CompanyAdmin, Employee), timestamps |
| `tickets` | id, company_id (FK), user_id (FK), title, description, status (enum: open, in_progress, resolved, closed), timestamps |

**Models & Relationships**

- `Company` → hasMany Users, hasMany Tickets
- `User` → belongsTo Company
- `Ticket` → belongsTo Company, belongsTo User

**Multi-Tenancy Strategy (The Core Challenge)**

Multi-tenancy isolation will be enforced using a **two-layer approach**:

1. **Eloquent Global Scope (`TenantScope`)** — Automatically appended to all `Ticket` queries for non-SuperAdmin users. It injects `WHERE company_id = auth()->user()->company_id` on every query.
2. **Auth Middleware (`EnsureTenantScope`)** — Applied to all protected API routes. Validates that the authenticated user's `company_id` is set and boots the global scope. SuperAdmins bypass this scope.

This means even if a `CompanyAdmin` manually crafts a request like `GET /api/tickets/999`, the Global Scope ensures the query returns empty if ticket `999` belongs to a different company.

**API Routes**

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/companies/onboard` | None | Public |
| POST | `/api/auth/login` | None | Public |
| POST | `/api/auth/logout` | Bearer | Any |
| GET | `/api/auth/me` | Bearer | Any |
| GET | `/api/tickets` | Bearer | CompanyAdmin, Employee |
| POST | `/api/tickets` | Bearer | Employee, CompanyAdmin |
| GET | `/api/tickets/{id}` | Bearer | CompanyAdmin, Employee |
| PATCH | `/api/tickets/{id}/status` | Bearer | CompanyAdmin |
| DELETE | `/api/tickets/{id}` | Bearer | CompanyAdmin |
| GET | `/api/users` | Bearer | CompanyAdmin, SuperAdmin |
| POST | `/api/users/invite` | Bearer | CompanyAdmin |
| DELETE | `/api/users/{id}` | Bearer | CompanyAdmin |
| GET | `/api/dashboard/stats` | Bearer | CompanyAdmin |

**Key Features**
- `POST /api/companies/onboard` — wrapped in `DB::transaction()`, creates Company + CompanyAdmin User atomically, returns Sanctum token
- Laravel Sanctum for API token authentication
- Policy-based authorization (`TicketPolicy`, `UserPolicy`)
- Database Seeders with 3 dummy companies, users per role, and 20+ tickets

---

### Phase 2 — Next.js Frontend

#### [NEW] `frontend/` — Next.js 14 App Router Project

**Route Structure**

```
app/
├── page.tsx                     # Public landing/marketing page
├── (auth)/
│   ├── login/page.tsx           # Login page
│   └── register/page.tsx        # Company signup (hits /onboard)
├── (admin)/
│   ├── layout.tsx               # Admin shell with sidebar
│   ├── dashboard/page.tsx       # Stats & overview
│   ├── tickets/page.tsx         # Data table with filters
│   └── users/page.tsx           # User management (CompanyAdmin only)
```

**Public Landing Page (`/`)**
- Hero section with CTA
- Features section
- 3 Pricing tier cards (Shadcn `Card`) — Free / Pro / Enterprise
- Contact/Signup form (react-hook-form + zod) → hits `/api/companies/onboard`
  - Inline validation errors from Laravel (e.g., red border on duplicate email)
  - Loading spinner state during submission

**Admin Panel**
- Sidebar with role-aware navigation (Employees don't see "Users" tab)
- `/admin/dashboard` — KPI cards (ticket counts by status, total users)
- `/admin/tickets` — TanStack Table with:
  - Server-side pagination
  - Column sorting (title, status, created_at)
  - Complex filtering (status dropdown + date range picker)
  - Row actions (view, change status, delete)
- `/admin/users` — User list + Slide-over/Sheet containing:
  - Invite Employee form (react-hook-form + zod)
  - Role selection via Shadcn `Select`
- Auth guard HOC/middleware that redirects unauthenticated users

**State Management**
- React Context for auth state (`useAuth` hook)
- TanStack Query for server state (tickets, users)
- `next/navigation` for route-based auth guards

---

## Multi-Tenancy Data Isolation — Implementation Detail

```php
// TenantScope.php
class TenantScope implements Scope {
    public function apply(Builder $builder, Model $model): void {
        if (auth()->check() && !auth()->user()->isSuperAdmin()) {
            $builder->where('company_id', auth()->user()->company_id);
        }
    }
}

// Ticket.php — auto-registers the scope
protected static function booted(): void {
    static::addGlobalScope(new TenantScope());
}
```

All ticket reads/writes/deletes automatically filter by `company_id`. The scope is registered in the model's `booted()` method, so it cannot be accidentally bypassed by individual controllers.

---

## Verification Plan

### Automated Tests
```bash
# Backend
cd backend && php artisan test

# Frontend build check
cd frontend && npm run build
```

### Manual Verification
1. Run seeders to populate DB with 3 companies
2. Login as `CompanyAdmin` of Company A → verify only Company A tickets appear
3. Manually attempt `GET /api/tickets/[ticket_id_from_company_B]` → verify 404
4. Login as `Employee` → verify "Users" tab is hidden
5. Test onboarding form with duplicate email → verify inline error

---

## Open Questions

> [!IMPORTANT]
> **PHP & Composer version**: The plan uses Laravel 11, which requires PHP 8.2+. Please confirm your local PHP version (`php -v`) before proceeding.

> [!IMPORTANT]
> **Node.js version**: Next.js 14 requires Node.js 18.17+. Please confirm (`node -v`).

> [!NOTE]
> **MySQL credentials**: The plan uses default `root`/`password` for local MySQL. Let me know if you have different credentials and I'll update the `.env` accordingly.

> [!NOTE]
> **Email for invites**: The invite feature will store the invited user record directly (no SMTP needed for local dev). Real email sending can be added later.
