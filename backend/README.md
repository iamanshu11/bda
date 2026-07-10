# Bokaro Defence Academy — Backend API

Production-oriented REST API for BDA, built with **Node.js + Express + TypeScript**, **PostgreSQL** via **Prisma**, JWT auth with **Email-OTP 2FA**, and role-based access control.

## Tech Stack

- Node.js + Express 4 + TypeScript
- PostgreSQL + Prisma ORM
- JWT (access + rotating refresh tokens)
- Email OTP 2FA (Nodemailer) — no SMS
- Zod + express-validator
- Winston logging (error / combined / request logs, daily rotation)
- Helmet, CORS, compression, rate limiting, bcrypt
- Multer uploads (local now, S3-ready)

## Architecture

Clean, layered, and modular — **Route → Middleware → Controller → Service → Repository → Prisma**:

```
src/
├── app.ts                # Express app assembly (security, routes, error handling)
├── server.ts             # Boot: DB connect, listen, graceful shutdown
├── config/               # env (zod-validated), prisma client
├── constants/            # enums (roles, OTP purposes), HTTP status
├── interfaces/           # shared types (ApiResponse, JwtPayload, AuthedRequest)
├── controllers/          # HTTP layer (auth, content)
├── services/             # business logic (auth, email)
├── repositories/         # data access (auth, content)
├── routes/               # route definitions + main router index
├── middleware/           # auth/RBAC, validate, errorHandler, rateLimiter, upload, logging
├── validations/          # express-validator rule sets
├── helpers/              # jwt, password, otp, date, pagination
├── emails/               # branded HTML email templates
├── logger/               # Winston setup
└── uploads/              # local file storage

db/
├── schema.prisma         # full data model (24 models, relations, indexes)
├── seed.ts               # roles + super admin + categories + hall of fame
└── migrations/           # created by `prisma migrate`
```

## Getting Started

Prisma is configured for **PostgreSQL** (`provider = "postgresql"` in `db/schema.prisma`).  
Migrations live in `db/migrations/` and should be committed so every developer can apply the same schema.

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#   → set DATABASE_URL (postgresql://USER:PASSWORD@HOST:PORT/bda?schema=public)
#   → set JWT secrets and SMTP creds

# 3. Create the Postgres database (once)
createdb bda   # or: psql -c 'CREATE DATABASE bda;'

# 4. Generate Prisma client + apply all committed migrations
npm run prisma:generate
npm run prisma:deploy

# 5. Seed roles + super admin + sample data
npm run db:seed

# 6. Run
npm run dev            # http://localhost:5000/api/v1
```

### Migrations (for everyone)

| Situation | Command |
| --- | --- |
| New clone / shared DB setup | `npm run prisma:deploy` — applies all migrations in `db/migrations/` |
| You changed `db/schema.prisma` | `npm run prisma:migrate -- --name short_description` — creates + applies a new migration |
| Check if DB matches schema | `npx prisma migrate status` |

Commit new migration folders under `db/migrations/` so teammates can run `prisma:deploy`.

> In development, if SMTP is not configured, OTP emails are logged to the console instead of being sent — so you can test signup/login without a mail server.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server (tsx watch) |
| `npm run build` / `start` | Compile to `dist/` and run |
| `npm run type-check` | `tsc --noEmit` |
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:migrate` | Create/apply a **new** dev migration from schema changes |
| `npm run prisma:deploy` | Apply **existing** migrations (use this for shared/prod DBs) |
| `npm run prisma:studio` | Prisma Studio GUI |
| `npm run db:seed` | Seed database |

## Authentication & 2FA

Email-OTP verification on **signup only**. OTPs are **6 digits, hashed before storage, single-use, expire in 5 min, and can be resent after 60 s**.

**Signup:** `signup` → OTP emailed → `verify-signup` → account activated (welcome email).
**Login:** `login` (email + password) → access token (JSON) + refresh token (httpOnly cookie).

Refresh tokens are hashed in the DB and **rotated** on every `/refresh`. Reset/change-password revoke all sessions.

### API Endpoints (`/api/v1`)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/signup` | public | Create account, send signup OTP |
| POST | `/auth/verify-signup` | public | Activate account |
| POST | `/auth/login` | public | Verify creds, issue tokens |
| POST | `/auth/verify-login` | public | *(deprecated — login no longer uses OTP)* |
| POST | `/auth/resend-otp` | public | Resend an OTP |
| POST | `/auth/forgot-password` | public | Send reset OTP |
| POST | `/auth/reset-password` | public | Reset password |
| POST | `/auth/change-password` | auth | Change password |
| POST | `/auth/refresh` | cookie | Rotate + new access token |
| POST | `/auth/logout` | public | Revoke refresh token |
| GET | `/auth/me` | auth | Current user |
| GET | `/courses` · `/courses/:slug` | public | List / detail (paginated) |
| GET | `/categories` | public | Exam categories |
| GET | `/faculty` · `/faculty/:slug` | public | Faculty |
| GET | `/gallery` | public | Gallery |
| GET | `/results` | public | Results + Hall of Fame |
| GET | `/testimonials` | public | Approved testimonials |
| POST | `/contact` | public | Submit contact message |
| GET | `/students/dashboard` | STUDENT | Student area (stub) |
| GET | `/users` | ADMIN | Users (stub) |
| GET | `/admin/dashboard` | ADMIN | Admin area (stub) |
| GET/PUT | `/settings` | public/SUPER_ADMIN | Settings (stub) |

Protected route stubs (`students`, `users`, `admin`, `dashboard`, `settings`) demonstrate the auth + RBAC wiring; flesh them out following the same Repository → Service → Controller pattern used by `auth` and `content`.

## Response Envelope

Every endpoint returns a consistent shape:

```json
{ "success": true, "message": "Courses fetched.", "data": [], "meta": { "page": 1, "limit": 12, "total": 0, "totalPages": 1 } }
```

Errors: `{ "success": false, "message": "...", "data": null, "errors": [...] }`.

## Security

Helmet, CORS (credentials), global + auth-specific rate limiting, bcrypt hashing, JWT + rotating refresh tokens, Zod/express-validator input validation, Prisma parameterization (SQL-injection safe), httpOnly cookies, and env-based secrets.

## File Uploads

`middleware/upload.ts` uses Multer with local disk storage and type/size limits. To move to S3, swap the storage engine there — controllers read `req.file` and won't change. Toggle intent with `STORAGE_DRIVER` in `.env`.
