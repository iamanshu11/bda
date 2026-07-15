# BDA QA / Hardening — Implementation Log (Pass 1)

Both apps pass `tsc --noEmit`. Backend and frontend build-green.

## Done (code)

**A1 — Timing-safe payment signature compare**
`backend/src/services/payment.service.ts` — order-verify now uses `crypto.timingSafeEqual` with an equal-length guard (matches the webhook path). No plain `!==` on signatures remains.

**A2 — Answer-key protection after attempts**
`backend/src/services/writtenTest.service.ts` — `updateQuestion` blocks changes to `correctOption`/`marks`, and `deleteQuestion` blocks deletion, once any SUBMITTED/EXPIRED attempt exists (409 conflict). Typo fixes to question text/explanation still allowed.

**A5 — CORS allowlist**
`backend/src/app.ts` + `config/env.ts` — new `CLIENT_URLS` (comma-separated) is merged with `CLIENT_URL`; `cors` uses an origin function that also allows server-to-server (no-origin) requests.

**B1 — Security headers**
`backend/src/app.ts` — hardened helmet: CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), HSTS (prod only, 2y + preload), Referrer-Policy, plus a `Permissions-Policy` (camera/mic/geolocation off, `fullscreen=(self)` for the exam shell). `X-Content-Type-Options: nosniff` on static uploads. *(Add matching `headers()` in Next.js `next.config.js` — pending.)*

**B4 — Upload hardening**
`backend/src/middleware/upload.ts` — strict extension↔MIME allowlist map; SVG blocked; server-generated safe filename with normalized extension (defeats double-extension); `files: 1`. `backend/src/app.ts` static `/uploads` now sends `nosniff`, cache headers, and `Content-Disposition: attachment` for non-inline types. *(Magic-byte content sniffing still recommended — pending.)*

**D1 — Shared rate-limit store**
`backend/src/middleware/rateLimiter.ts` — optional Redis store behind `REDIS_URL`; loads `ioredis` + `rate-limit-redis` at runtime only if installed, else falls back to in-memory (build stays green without the deps).

**D4 — Correlation IDs + safe request logging**
`backend/src/middleware/requestId.ts` (new) sets/propagates `x-request-id`; `requestLogger` now logs `requestId` + `userId` and only safe metadata (no bodies/tokens/OTPs).

**A3 — Responsive header + sidebar**
`Header.tsx` and `DashboardShell.tsx` use a side-sliding drawer (transform), dimmed backdrop, close-on backdrop/Escape/route-change, body-scroll lock, ARIA dialog, animated burger↔X, collapsible desktop rail (persisted), overflow-safe topbar. `Logo` supports a `compact` icon rail.

**A4 — Table overflow**
`frontend/app/dashboard/leaderboard/page.tsx` — wrapper switched to `overflow-x-auto` + `min-w` so wide rows scroll on mobile.

**Docs** — `backend/.env.example` documents `CLIENT_URLS` and `REDIS_URL`.

## Pass 2 — Transaction safety + automated tests

**C3 — Atomic, idempotent payment→enrollment**
`backend/src/services/payment.service.ts` — `markPaidAndEnroll` now runs mark-PAID + coupon redemption + enrollment inside a single `prisma.$transaction`. It can no longer leave a "paid but not enrolled" (or coupon-counted-without-enrollment) state, and re-running it (duplicate webhook, retry, reconciliation) will not double-enroll or double-count. Notification + email moved to run AFTER commit (a slow mailer can never roll back a payment).

**Refactor for testability** — extracted pure, DB-free helpers into new modules:
`backend/src/utils/paymentSignature.ts` (`verifyRazorpaySignature`, `verifyWebhookSignature`) and `backend/src/utils/examRules.ts` (`endsAt`, `durationExpired`, `isGenuineTakeover`, `gradeAnswers`). `payment.service` and `writtenTest.service` now import from these; the webhook handler uses `verifyWebhookSignature` too.

**Test runner + suite** — added Vitest (`npm test`), `vitest.config.ts`, `test/setup.ts`, and 24 passing tests:
- `test/paymentSignature.test.ts` (C2) — valid/tampered/wrong-secret/empty/unequal-length signatures fail closed.
- `test/examRules.test.ts` (B5/B6/C1) — server-authoritative timer, anti-cheat 25s takeover grace, negative-marking grading incl. no-negative-total.
- `test/upload.test.ts` (B4) — SVG blocked, double-extension, MIME spoofing, executables, disallowed types rejected.

Run: `cd backend && npm install && npm test` → **24 passed**. Both apps still `tsc --noEmit` green.

## Pass 3 — RBAC tests, audit trail, Next.js headers

**B2 — RBAC/IDOR tests** — `test/authMiddleware.test.ts` (11) unit-tests `authenticate` / `authorize` / `requirePermission`; `test/rbac.integration.test.ts` (7) uses Supertest against the real Express app to assert deny paths at the HTTP boundary: 401 without a token, 403 for STUDENT/FACULTY on admin routes, 401 on garbage tokens, and the `x-request-id` header. Prisma is mocked in the integration file so it runs on any platform. **Total: 42 tests passing.**

**D5 — Admin audit trail** — new `AuditLog` model in `db/schema.prisma`; `src/services/audit.service.ts` (best-effort, never throws); wired into the admin CRUD controller (CREATE/UPDATE/DELETE, incl. user role changes) and written-test force-submit. Read-only `/admin/audit-logs` API (registry) + a new admin page `app/admin/audit-logs/page.tsx` and nav entry.
> ⚠️ Run `npm run prisma:migrate` (or `prisma migrate dev`) + `prisma generate` to create the `audit_logs` table before this writes. Code is written against a typed accessor so it compiles now and activates after the migration.

**B1 tail — Next.js security headers** — `frontend/next.config.mjs` now sends `Permissions-Policy` always, and (production only, to keep dev HMR working) a Razorpay-compatible `Content-Security-Policy` + HSTS, alongside the existing nosniff / X-Frame-Options / Referrer-Policy.

Verification: `frontend` + `backend` `tsc --noEmit` green; `cd backend && npm test` → **42 passed**.

## Remaining (verification / infra / tests — need your go-ahead)

- **B2** RBAC + IDOR audit matrix (per-endpoint ownership tests).
- **B3** Injection/XSS automated fuzz tests + rich-text sanitization audit.
- **B4** Magic-byte (content) validation for uploads.
- **B5/B6 + C1** Exam timer-tamper + anti-cheat integration tests.
- **C2/C3** Payment edge cases + wrap payment→enroll in `prisma.$transaction`.
- **C4** API abuse/load test of the limiter.
- **D2/D3** Performance + exam stress (100→5k) with k6/Artillery.
- **D5** Admin audit-trail table + view.
- **D6** Sentry + worker/webhook health checks.
- **D7** Backup + restore drill.
- **D8/D9** Cross-browser + accessibility (axe/Lighthouse).
- **B1** Next.js `next.config.js` security headers.
