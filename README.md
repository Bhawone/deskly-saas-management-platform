# Deskly — B2B Support Ticket Platform

A full-stack B2B support ticketing platform built with **Laravel 11** (backend) and **Next.js 16** (frontend). Companies sign up, manage their team, and track support tickets — each company's data is strictly isolated from every other tenant at the database level.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Backend    | Laravel 11 · PHP 8.2+ · MySQL 8 |
| Auth       | Laravel Sanctum (Bearer tokens) |
| Frontend   | Next.js 16 (App Router) · TypeScript |
| UI         | Shadcn UI · Tailwind CSS v4 |
| Forms      | React Hook Form · Zod |
| Data Table | TanStack Table (React Table v8) |
| HTTP       | Axios with interceptors |
| State      | TanStack Query (server state) · React Context (auth) |

---

## Repository Structure

```
saas-management-platform/
├── backend/     # Laravel 11 REST API
└── frontend/    # Next.js 16 App Router
```

---

## Prerequisites

- PHP 8.2+ with `php-mbstring`, `php-xml`, `php-curl`, `php-pdo`, `php-mysql` extensions
- Composer 2.x  (`~/bin/composer` if installed locally)
- Node.js 18.17+ and npm 9+
- MySQL 8.0+

---

## Backend Setup (Laravel)

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Install PHP dependencies

```bash
composer install
```

> If Composer was installed locally during setup, use `~/bin/composer install`

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your MySQL credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=saas_support_desk
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 4. Generate application key

```bash
php artisan key:generate
```

### 5. Create the MySQL database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS saas_support_desk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 6. Run migrations and seed the database

```bash
php artisan migrate:fresh --seed
```

This will create all tables and populate the database with:
- **1 SuperAdmin** account
- **3 Companies**: Acme Corp (Pro), Globex Inc (Enterprise), Initech LLC (Free)
- **9 Users** across all roles
- **20 realistic Tickets** spread across companies

### 7. Start the development server

```bash
php artisan serve --port=8000
```

The API will be available at `http://localhost:8000`

---

## Frontend Setup (Next.js)

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Configure environment

The `.env.local` file is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Start the development server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## Seeded Test Accounts

All accounts use the password: `password`

| Role | Name | Email | Company |
|------|------|-------|---------|
| SuperAdmin | Platform Admin | `admin@deskly.io` | — (system-wide access) |
| CompanyAdmin | Sarah Mitchell | `sarah.mitchell@norvik.io` | Norvik Software |
| Employee | James Parker | `james.parker@norvik.io` | Norvik Software |
| Employee | Emily Rodriguez | `emily.rodriguez@norvik.io` | Norvik Software |
| CompanyAdmin | Michael Chen | `michael.chen@fieldstone.co` | Fieldstone Co. |
| Employee | Laura Bennett | `laura.bennett@fieldstone.co` | Fieldstone Co. |
| Employee | Daniel Kim | `daniel.kim@fieldstone.co` | Fieldstone Co. |
| CompanyAdmin | Rahul Mehta | `rahul.mehta@lumosdigital.co` | Lumos Digital |
| Employee | Chloe Tran | `chloe.tran@lumosdigital.co` | Lumos Digital |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/companies/onboard` | Public | Atomic company + admin creation |
| POST | `/api/auth/login` | Public | Login, returns Bearer token |
| POST | `/api/auth/logout` | Bearer | Revoke current token |
| GET | `/api/auth/me` | Bearer | Authenticated user info |
| GET | `/api/dashboard/stats` | Bearer | KPI statistics |
| GET | `/api/tickets` | Bearer | Paginated, filterable ticket list |
| POST | `/api/tickets` | Bearer | Create ticket |
| GET | `/api/tickets/{id}` | Bearer | Single ticket (tenant-scoped) |
| PATCH | `/api/tickets/{id}/status` | Bearer | Update status (Admin only) |
| DELETE | `/api/tickets/{id}` | Bearer | Delete ticket (Admin only) |
| GET | `/api/users` | Bearer | List company users |
| POST | `/api/users/invite` | Bearer | Invite new user (Admin only) |
| DELETE | `/api/users/{id}` | Bearer | Remove user (Admin only) |

### Query parameters for `GET /api/tickets`:
- `page` — page number (default: 1)
- `per_page` — results per page (default: 10)
- `sort_by` — `title`, `status`, or `created_at`
- `sort_dir` — `asc` or `desc`
- `status` — filter by ticket status
- `date_from` / `date_to` — date range filter (YYYY-MM-DD)
- `search` — full-text search in title & description

---

## Multi-Tenancy Data Isolation

### Strategy: Eloquent Global Scope

The core isolation mechanism is a **Laravel Global Scope** (`TenantScope`) that is automatically applied to every single database query on the `Ticket` model.

```php
// app/Models/Scopes/TenantScope.php
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check() && !auth()->user()->isSuperAdmin()) {
            $builder->where(
                $model->getTable() . '.company_id',
                auth()->user()->company_id
            );
        }
    }
}
```

The scope is registered directly in the model's `booted()` method:

```php
// app/Models/Ticket.php
protected static function booted(): void
{
    static::addGlobalScope(new TenantScope());
}
```

### Why This Is Bulletproof

1. **Cannot be forgotten** — Unlike manually adding `where('company_id', ...)` in each controller, the Global Scope is registered at the model level. Every query — `find()`, `all()`, `paginate()`, `where()` — automatically includes the tenant filter.

2. **ID-guessing attacks are blocked** — If a `CompanyAdmin` from Acme Corp makes a request like `GET /api/tickets/9` (where ticket 9 belongs to Globex), Laravel's model binding calls `Ticket::findOrFail(9)`. The Global Scope injects `WHERE company_id = 1 AND id = 9` — finding nothing — and returns a **404 Not Found**.

3. **SuperAdmins bypass it** — The `isSuperAdmin()` check in the scope ensures system administrators can still access all data when needed.

4. **Verified by test** — The isolation was verified during development:
   - Alice (Acme Corp CompanyAdmin) sees exactly 8 tickets, all with `company_id=1`
   - Requesting ticket #9 (Globex's) returns `404 No query results for model`

### Layer 2: Policy-Based Authorization

Beyond the Global Scope, `TicketPolicy` and `UserPolicy` provide role-based authorization:

- `Employee` can **create** tickets and **view** tickets (but only their company's, enforced by scope)
- `CompanyAdmin` can additionally **update status** and **delete** tickets
- `CompanyAdmin` is the only role that can **invite** new users

---

## Frontend Architecture

### Routes

| Path | Description | Auth Required |
|------|-------------|---------------|
| `/` | Public marketing/landing page | No |
| `/login` | Login form | No |
| `/dashboard` | KPI stats & recent tickets | Yes |
| `/tickets` | Full data table with filters | Yes |
| `/users` | Team management + invite | Yes (Admin only) |

### Role-Aware UI

- The sidebar navigation dynamically filters items based on the user's role
- `Employee` users do **not** see the "Users" tab
- `Shadcn Sheet` (slide-over) is used for the invite form on `/users`
- `TanStack Table` on `/tickets` with server-side pagination, sorting, and dual filters (status + date range)

---

## Running Both Services

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend && php artisan serve --port=8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Then open `http://localhost:3000` in your browser.
