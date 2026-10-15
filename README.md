# Municipal Tax Payment Portal (Nepal)

A full-stack municipal tax e-governance system built as a BSc CSIT final-year project. Citizens register properties, track verification, view tax bills, pay online (test provider) or at the counter, and download receipts. Municipal staff verify properties, configure tax rules, issue bills, record payments, and review revenue reports — all behind JWT authentication and role-based access control.

> **Academic disclaimer:** all tax rates, penalty percentages, and calculation figures shipped with this project are **fictional demonstration values**, not official Nepalese municipal rates. Real deployments must configure rules via the admin console.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Demo credentials](#demo-credentials)
- [User workflows](#user-workflows)
- [Tax categories & calculation](#tax-categories--calculation)
- [Payments & receipts](#payments--receipts)
- [API reference](#api-reference)
- [Database & migrations](#database--migrations)
- [Testing](#testing)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [Known limitations & future work](#known-limitations--future-work)

## Features

### Citizen portal (`fe-citizen`, port 3001)

- Self-registration and secure login (Citizen role only)
- Property registration requests with document upload (PDF/JPG/PNG/WebP, ≤ 5 MB)
- Application tracking: pending / correction-requested / approved / rejected, with reviewer notes and resubmission
- Verified property list with verification status
- Tax bills with full calculation breakdown, penalties, due dates, and printable layout
- Online payment through the development test provider (server-confirmed, never browser-confirmed)
- Payment history, receipts with balance-after snapshot, notifications

### Admin portal (`fe-admin`, port 3002)

- Dashboard: taxpayers, properties, verification queue, bills issued/outstanding/overdue, revenue, fines
- Property verification queue: approve (creates verified property + ownership record), reject with reason, request corrections
- Tax-rule console per category and fiscal year: rates/slabs, minima, effective dates, billing periods, due dates, penalty % + base, grace days (overlap-guarded; never rewrites issued bills)
- Bill management: individual issuance, controlled duplicate-safe bulk billing, versioned amendments, cancellations, overdue sweep
- Fine management: percentage penalties with explicit base, idempotent application, waivers with mandatory reason
- Office (cash) payment recording, online-payment verification, receipts
- Reports (revenue by category/period, outstanding, overdue, collections, verification) with CSV export
- Employee profiles (ward assignments, duty flags, self-edit protection) and a full audit log

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Backend  | NestJS 11, TypeORM, PostgreSQL, Passport JWT + local strategy, class-validator, Winston, bcrypt |
| Citizen / Admin frontends | Next.js 16 (App Router), React 19, TanStack Query, React Hook Form + Zod, Tailwind CSS v4, shadcn/Base UI, lucide-react |
| Package manager | pnpm |
| Money math | Integer-paisa arithmetic (`be/src/common/utils/money.util.ts`) — never float |

## Architecture

```
municipal-tax-portal/
├── be/            NestJS REST API (http://localhost:8000, prefix /api)
├── fe-citizen/    Citizen portal (http://localhost:3001)
└── fe-admin/      Admin portal (http://localhost:3002)
```

- The backend returns every response wrapped as `{ success, message, data, timestamp }`.
- Frontends are **static-exported** (`output: "export"` in each `next.config.ts`) for Render Static Sites: there is no Next.js server at runtime, so the browser calls NestJS directly via the shared axios client (`lib/axios.ts`, base `${NEXT_PUBLIC_API_URL}/api`) with `Authorization: Bearer` JWTs kept in Web Storage (`lib/token-storage.ts`) plus a 401-triggered `POST /auth/refresh` rotation. A client-side `AuthGuard` replaces the old edge middleware for route protection.
- Auth: JWT access (15 min) + rotating refresh tokens (7 days), 5-strike temporary lockout, role/permission guards on every restricted route.

## Project structure

```
be/src/
├── common/          guards, decorators, interceptors, enums, money utils, document storage
├── config/          jwt + app configuration
├── database/        data-source, forward-only migrations, idempotent seeders
└── modules/
    ├── auth / users / roles / permissions / user-roles / rolePermissions
    ├── property-applications   verification workflow + document metadata
    ├── properties              verified properties, ownership history, transfers
    ├── tax-categories / tax-rules / fiscal-periods
    ├── tax-assessments          immutable once issued
    ├── bills / fines            issuance, amendments, penalties
    ├── payments                 office + mock-online provider, allocations
    ├── receipts / notifications / reports / audit / employee-profiles
    └── dashboard / health

fe-citizen / fe-admin
├── app/(auth)/      login (+ citizen self-registration)
├── app/(portal)/    role-scoped pages (guarded by components/auth/AuthGuard)
├── features/        per-domain API clients + React Query hooks (direct NestJS calls)
├── components/      shared + shadcn UI primitives
└── lib/             axios client, token storage, env, NPR formatting
```

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL 14+ (local instance)

## Getting started

### 1. Backend

```bash
cd be
pnpm install
cp .env.example .env        # then set DB credentials + secrets
pnpm migration:run          # apply schema (TypeORM synchronize is OFF)
pnpm seed:dev               # roles, permissions, demo users, demo rules
pnpm start:dev              # http://localhost:8000
```

### 2. Citizen portal

```bash
cd fe-citizen
pnpm install
cp .env.example .env.local  # defaults to http://localhost:8000
pnpm dev                    # http://localhost:3001
```

### 3. Admin portal

```bash
cd fe-admin
pnpm install
cp .env.example .env.local  # defaults to http://localhost:8000
pnpm dev                    # http://localhost:3002
```

### Production builds

```bash
cd be && pnpm build && pnpm start:prod
cd fe-citizen && pnpm build   # static export → fe-citizen/out (no `pnpm start`; deploy `out/`)
cd fe-admin && pnpm build      # static export → fe-admin/out (no `pnpm start`; deploy `out/`)
```

### Render deployment (Static Sites)

Each frontend is its own Render **Static Site** (the NestJS backend is a separate Web Service):

| Site | Root Directory | Build Command | Publish Directory |
| ---- | -------------- | ------------- | ----------------- |
| `municipal-tax-admin` | `fe-admin` | `pnpm install --frozen-lockfile && pnpm build` | `out` |
| `municipal-tax-citizen` | `fe-citizen` | `pnpm install --frozen-lockfile && pnpm build` | `out` |

Alternative with the repository root as Root Directory: Build Command `pnpm --dir fe-admin install --frozen-lockfile && pnpm --dir fe-admin build` (or `fe-citizen`), Publish Directory `fe-admin/out` (or `fe-citizen/out`). Set `NEXT_PUBLIC_API_URL` at build time — it is embedded into the static bundle, so changing it later requires a rebuild. There is intentionally no root `pnpm-workspace.yaml`; each package installs from its own lockfile.

## Demo credentials

Seeded by `pnpm seed:dev`:

| Role | Email | Password |
| ---- | ----- | -------- |
| Super Admin | `superadmin@municipaltax.gov.np` | `ChangeMe123!` |
| Citizen | `ram@example.com` | `Citizen123!` |
| Citizen | `sita@example.com` | `Citizen123!` |
| Citizen | `hari@example.com` | `Citizen123!` |

New citizens can also self-register from the citizen portal. Staff accounts can only be created by administrators.

## User workflows

1. **Citizen registration** — self-service (`/register`) or staff-assisted (`Users → Add user`); both validate identically and the Citizen role is always assigned server-side.
2. **Property verification** — citizen submits request + documents → `pending` → staff approves (verified property + ownership record created), rejects with reason, or requests corrections → citizen resubmits. Direct staff-created records stay `unverified` until reviewed.
3. **Assessment & billing** — staff issues a bill from the active rule; the amount is calculated server-side and the breakdown is frozen on the bill. Duplicates per subject + period are rejected; bulk runs report skipped rows.
4. **Fines** — overdue bills accrue the rule's penalty % on the configured base (principal or outstanding balance), once per bill + period; waivers need a reason.
5. **Payments** — counter cash (recorded verified) or online test checkout (initiated server-side, settled only by signed provider confirmation). Receipts issue automatically for verified payments.
6. **Corrections** — bill amendments create a superseding version with reason + audit; paid bills can't be amended or cancelled.

## Tax categories & calculation

All five categories share one framework (`TaxCalculationService`) with per-category input strategies:

| Category | Taxable base | Billing |
| -------- | ------------ | ------- |
| Property Tax | Municipal assessed value, % rate or progressive slabs | Annual |
| House Rent Tax | Monthly rent × months (or annual), minus deductions | Monthly / annual |
| Business Tax | Fixed fee (with business identity) or turnover % | Annual |
| Land Tax | Land area × configured rate-per-sqm (distinct from property value) | Annual |
| Advertisement Tax | Fixed, per-board, or size × qty × months × unit rate | One-time |

Rules carry effective-from/to dates, fiscal-year applicability, minima, exemptions, due dates, grace days, and rounding via paisa math. Changing a rule never mutates issued bills.

## Payments & receipts

- Online flow: `initiate` (server computes amount, returns provider ref) → test checkout → **server-side** settlement (signed callback or dev-only `mock-confirm`, disabled in production). Duplicate callbacks are idempotent; amount mismatches fail safely.
- Every payment allocates to its bill under row locks; overpayment is rejected; partial payments update balances.
- Receipts (`RCP-######`) include bill reference, method, transaction ref, amount, and remaining balance, with a print-friendly layout. No official seals or endorsements are fabricated.

## API reference

All paths are prefixed with `/api` and wrapped as `{ success, message, data }`. JWT Bearer required unless noted.

| Method | Path | Permission |
| ------ | ---- | ---------- |
| POST | `/auth/register` (public), `/auth/login` (public), `/auth/refresh`, `/auth/logout` | — |
| GET/POST | `/property-applications`, `PATCH /:id/review`, `PATCH /:id/resubmit` | `propertyApplication.*` |
| GET/POST/PATCH | `/tax-rules` | `taxRule.*` |
| GET/POST | `/fiscal-periods` | `fiscalPeriod.*` |
| GET/POST | `/bills`, `POST /bills/bulk`, `PATCH /bills/:id/amend`, `PATCH /:id/cancel` | `bill.*` |
| POST/PATCH | `/fines/bills/:billId/apply`, `/fines/:id/waive` | `fine.*` |
| GET/POST | `/payments`, `POST /payments/office`, `POST /payments/online/initiate` | `payment.*` |
| POST | `/payments/online/callback` (HMAC-signed), `/payments/online/mock-confirm` (dev) | signature / `payment.create` |
| GET | `/receipts`, `/receipts/my`, `/reports/:name`, `/audit-events`, `/employee-profiles` | `receipt.view`, `report.view`, `auditLog.view`, `user.*` |

## Database & migrations

- PostgreSQL with TypeORM, `synchronize: false` — schema changes only via forward-only migrations in `be/src/database/migrations/`.
- Key invariants: one account ≠ verified ownership; only verified properties are billable; issued bills keep frozen calculations; payment status is server-verified; balances reconcile from ledger entries; duplicates prevented by unique constraints + transactional checks; history survives rule changes and ownership transfers.
- Never reset the database or edit applied migrations — add a new one.

## Testing

```bash
cd be && pnpm exec jest        # 14 unit tests: 5-category calculation, paisa exactness, RBAC seed consistency, callback signatures
```

Critical flows (registration → verification → billing → payment → receipt, duplicate protection, IDOR blocks) were additionally verified live against the API. Frontend type-safety and builds: `pnpm exec tsc --noEmit` and `pnpm build` in each app.

## Scripts

| Command | Purpose |
| ------- | ------- |
| `pnpm --dir be migration:run` | Apply pending migrations |
| `pnpm --dir be seed:dev` | Idempotent seed (roles, permissions, demo data, demo rules) |
| `pnpm --dir be start:dev` | Backend with watch mode |
| `pnpm --dir be test` | Jest unit tests |
| `pnpm --dir be lint` | ESLint + autofix |
| `pnpm --dir fe-citizen dev/build` | Citizen portal |
| `pnpm --dir fe-admin dev/build` | Admin portal |

## Environment variables

Backend (`be/.env`, see `be/.env.example`): `PORT`, `DB_HOST/PORT/USERNAME/PASSWORD/NAME`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `SUPER_ADMIN_*` seed, `BCRYPT_SALT_ROUNDS`, `MOCK_PAY_SECRET` (HMAC for the test provider — set a strong random value), `DOCUMENT_STORAGE_PATH` (default `./uploads/documents`, gitignored, served only via authorized endpoints), `CORS_ORIGIN` (comma-separated exact frontend origins, e.g. `https://municipal-tax-fe-admin.onrender.com,https://municipal-tax-fe-citizen.onrender.com`; unset = same-origin only).
Frontends (build-time `NEXT_PUBLIC_API_URL`, dev `.env.local`, see each `fe-*/.env.example`): `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`, WITHOUT trailing `/api`; `API_URL` kept as fallback). Production example: `NEXT_PUBLIC_API_URL=https://municipal-tax-be.onrender.com`.

## Known limitations & future work

These are accepted as out of scope for the semester project (production-hardening or external dependencies), not incomplete core work:

- **Rate limiting** not yet configured — recommended before any public deployment.
- **Ward-scoped list queries** for staff are modeled (profiles + review-time enforcement) but not yet applied as automatic query filters everywhere.
- **Bikram Sambat display** — fiscal years are stored as labels (e.g. `2082/83`); a tested BS-conversion library should back any Nepali-calendar UI.
- **Real payment gateway** — the mock provider interface is ready, but live eSewa integration needs merchant credentials and gateway certification.
- **Object storage** — documents use local disk via an abstraction; S3-compatible storage can be plugged in later.
- **Official rates** — deliberately not invented; the municipality must configure real rules, penalty bases, and liability policies.
