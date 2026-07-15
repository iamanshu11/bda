# Prompt: BDA Full QA, Security & Hardening Brief (Backend + Frontend)

You are a senior full-stack engineer + application security reviewer working on **Bokaro Defence Academy (BDA)**.

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind, React Query) frontend; Node + Express + TypeScript + Prisma + PostgreSQL backend. Layering: Route → Controller → Service → Prisma. Response envelope `{ success, message, data }` with a central `ApiError` + error handler. Auth: JWT access (in-memory) + rotating httpOnly refresh cookie, Email-OTP 2FA, RBAC (STUDENT / FACULTY / ADMIN / SUPER_ADMIN). Payments via Razorpay (order → verify → webhook). Includes a paid **Written Test** module with anti-cheat proctoring.

**Rules for all changes:** preserve the existing architecture, exports, response envelope, and `ApiError` conventions. Frontend: reuse design tokens (`bg-background`, `bg-surface`, `bg-surface-alt`, `border-border`, `text-foreground`, `text-muted`, `navy-*`, `rust-*`) and the `cn()` helper; no new colors; guard `window`/`document`/`localStorage` inside effects. After every change run `npx tsc --noEmit` (both apps) + `next build` and keep them green. Deliver a CHANGELOG of every file touched.

The work is grouped: **A) Code fixes** (implement now), **B) Security hardening** (implement + verify), **C) Test suites** (write automated tests), **D) Ops / performance / monitoring** (implement + document). Priority stars: ⭐⭐⭐⭐⭐ = do first.

---

## A. CODE FIXES (implement)

### A1. Constant-time signature comparison in payment verify ⭐⭐⭐⭐⭐
**File:** `backend/src/services/payment.service.ts` (interactive order-verify, ~line 179–187).
The signature is compared with a plain `!==`, while the webhook path uses `crypto.timingSafeEqual`. Make both consistent:

```ts
const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET)
  .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`).digest('hex');
const sigBuf = Buffer.from(input.razorpaySignature ?? '', 'utf8');
const expBuf = Buffer.from(expected, 'utf8');
const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
if (!valid) { /* mark FAILED + throw ApiError.badRequest('Payment verification failed.') */ }
```
Audit the whole file for any other signature `===`/`!==` comparisons and fix the same way.

### A2. Protect the written-test answer key after attempts exist ⭐⭐⭐⭐⭐
**Files:** `backend/src/services/writtenTest.service.ts` (`updateQuestion`, `deleteQuestion`), controller.
An admin can change `correctOption` or delete a question after students submitted; old attempts are never re-graded, so results silently diverge. Implement ONE (prefer a):
- **(a) Guard (recommended):** count attempts on the parent test with status in `['SUBMITTED','EXPIRED']`; if any exist and the edit changes `correctOption` (or it's a delete), throw `ApiError.conflict('Cannot change the answer key after students have attempted this test. Clone the test instead.')`. Allow non-answer edits (typo fixes in `question`/`explanation`).
- **(b) Re-grade:** after the change, re-run the existing `gradeAnswers` helper across all submitted attempts, update `score/correct/wrong/totalMarks`, and notify affected students. Do not duplicate grading logic.
Surface the rule in the admin written-tests UI.

### A3. Fully responsive Header + Sidebar (side-slide mobile drawer) ⭐⭐⭐⭐
**Files:** `frontend/components/layout/Header.tsx`, `frontend/components/dashboard/DashboardShell.tsx`, audit `components/ui/Button.tsx` + dashboard action rows.
- `Header.tsx` mobile menu drops down via `max-height` — convert to a **side drawer** (`-translate-x-full` → `translate-x-0`, `transition-transform duration-300 ease-in-out`).
- `DashboardShell.tsx` drawer has no slide animation and a floating close-`X` overlapping content — animate it and put a single close button **inside** the panel.
- Both: dimmed backdrop (`bg-black/40`) closing on click; panel `fixed h-full w-72 max-w-[85vw] bg-surface` with own scroll; close on backdrop / button / route change (`usePathname`) / `Escape`; lock body scroll while open; add `role="dialog" aria-modal="true" aria-expanded aria-label`.
- Buttons never break: `whitespace-nowrap`, `shrink-0` icons, `truncate` labels, rows `flex flex-wrap gap-2/3` and `flex-col sm:flex-row`, `w-full sm:w-auto` on mobile, tap targets ≥40px. Topbar: hide name/role at `sm:` and below, `truncate` the title.
- No horizontal scroll at **320 / 375 / 414 / 768 / 1024 / 1280 / 1536px**, light + dark.

### A4. Fix leaderboard table overflow on mobile ⭐⭐⭐
**File:** `frontend/app/dashboard/leaderboard/page.tsx` (~line 99). Wrapper uses `overflow-hidden` → change to `overflow-x-auto` (keep rounded border). Scan all other `<table>`s for a missing horizontal-scroll ancestor and fix identically.

### A5. Multiple CORS origins ⭐⭐⭐⭐
**Files:** `backend/src/app.ts`, `config/env.ts`. CORS `origin` is a single `env.CLIENT_URL`; apex+`www`/previews break. Accept a comma-separated `CLIENT_URLS` allowlist via an `origin` function that allows no-origin (server-to-server) and allowlisted origins, else rejects. Keep `credentials: true`.

---

## B. SECURITY HARDENING (implement + verify)

### B1. Security headers ⭐⭐⭐⭐⭐
**File:** `backend/src/app.ts` (helmet is present but default). Explicitly configure and verify:
- **Content-Security-Policy** (lock `default-src 'self'`; allow only the API/frontend origins, Razorpay checkout, and your CDN; no `unsafe-inline` scripts).
- **X-Frame-Options: DENY** (and CSP `frame-ancestors 'none'`).
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** (disable camera/mic/geolocation unless needed; keep `fullscreen=(self)` for the exam shell).
- **Strict-Transport-Security (HSTS)** with `includeSubDomains; preload` in production only.
On the **Next.js** side add matching headers via `headers()` in `next.config.js`.
**Verify:** run the deployed site through securityheaders.com and target an A/A+; record the result in the CHANGELOG.

### B2. Server-side authorization audit (RBAC + IDOR) ⭐⭐⭐⭐⭐
Enumerate **every** endpoint and confirm server-side guards — never trust the client. Build a matrix: for each route × role (STUDENT / FACULTY / ADMIN / SUPER_ADMIN) record allowed/denied, and confirm actual behavior matches.
- Confirm STUDENT cannot reach any `/admin/*` route (expect 403), FACULTY only what's intended, etc.
- **IDOR:** for every resource fetched by id (attempts, results, payments, enrollments, profiles, notifications), confirm the handler scopes by the authenticated `userId` (or role), so `GET /students/123` as user `456` returns **403/404**, not another user's data. Add tests that assert this for each id-addressable endpoint.
Fix any endpoint that resolves records by id without an ownership/role check.

### B3. Injection / XSS testing ⭐⭐⭐⭐⭐
Add automated tests that fuzz inputs with: `'`, `"`, `<script>alert(1)</script>`, `" OR 1=1 --`, `UNION SELECT ...`, `../../../etc/passwd`, null bytes, oversized strings, unicode. Verify:
- **Prisma parameterization** — no raw string-built queries; audit any `$queryRaw`/`$executeRaw` to ensure they use tagged-template parameters, never interpolation.
- **Output escaping** — no `dangerouslySetInnerHTML` with unsanitized content (rich-text notes must be sanitized server-side, e.g. DOMPurify/sanitize-html, before storage/render).
- **Validation** — every write endpoint validates with Zod; reject unexpected fields (mass-assignment) as the CRUD/controllers already do.

### B4. File upload security ⭐⭐⭐⭐⭐
**File:** `backend/src/middleware/upload.ts` (+ controller). Size + mime filter already exist; additionally harden and test against:
- **Double extensions** (`x.php.jpg`, `x.jpg.exe`) — normalize and force a safe server-generated filename/extension.
- **SVG XSS** — either block `image/svg+xml` or sanitize SVGs; never serve them inline from the same origin.
- **MIME spoofing** — validate real content (magic bytes) not just the client-sent `Content-Type`.
- **Executables / scripts** — reject by content, not just extension.
- **Zip bombs / decompression** — cap size before any extraction; don't auto-extract user archives.
- Serve uploads with `Content-Type` from validated type, `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment` for non-images, and cache headers. Confirm the static `/uploads` handler in `app.ts` applies these.

### B5. Exam timer tampering ⭐⭐⭐⭐⭐
The **server** is the single source of truth for timing; never trust client timestamps. Verify/enforce:
- `startedAt`, `endsAt`, and remaining duration are computed **server-side** from DB (`endsAt(attempt, durationMins)` already does this) and re-checked on every `heartbeat`, `saveAnswers`, and `submit`.
- A client cannot pause, extend, or spoof the timer by editing payloads or changing local/browser time — the API ignores any client-supplied time and recomputes expiry, auto-submitting when `durationExpired` is true (as `startAttempt`/`heartbeat` already do).
- Add tests: forged `endsAt`/duration in the payload is ignored; a late submit after server expiry is rejected/auto-submitted; changing device clock has no effect.

### B6. Written-test anti-cheat security ⭐⭐⭐⭐⭐
Add explicit end-to-end tests for the proctoring flow (the recent fixes must not regress):
- Multiple tabs (BroadcastChannel MULTI_TAB), another browser/device (MULTI_DEVICE only on genuine takeover, i.e. heartbeat ≥25s stale — a fast re-mount must NOT flag), internet disconnect (OFFLINE + offline-timeout auto-submit), refresh (single count, no StrictMode double-fire), tab switch counts **once** (visibility only, not blur+visibility).
- Exceeding `maxCheatingAttempts` auto-submits via `finalizeAttempt(..., 'CHEAT_LIMIT')`; admins are notified; every violation is persisted in `examViolation`; final score/answers remain correct and answers stay hidden until `answersRevealAt`.

---

## C. AUTOMATED TEST SUITES (write)

Use Vitest/Jest + Supertest (API) and Playwright (browser/E2E). Wire `npm test` + CI. Minimum coverage:

### C1. Exam lifecycle & integrity ⭐⭐⭐⭐⭐ (see B5, B6)
Start → resume → violation increments → auto-submit → answer reveal gating → timer tamper rejection.

### C2. Payment edge cases ⭐⭐⭐⭐⭐
Test: double-click Pay, browser closed after payment, refresh during checkout, network interruption, **duplicate webhook delivery (idempotent — enroll once)**, invalid webhook payload (bad/missing signature → 400, no enroll), payment success but enrollment failure (see C3), and the refund policy (document and enforce whatever BDA's rule is — e.g. no refund after enrollment).

### C3. Database transactions ⭐⭐⭐⭐⭐
Wrap the payment→enrollment→(notification/invoice) success path in a single `prisma.$transaction` so a failure can't leave a partial state (paid but not enrolled, or enrolled twice). Add a test that forces a mid-flow failure and asserts the DB rolls back cleanly and the operation is safely retryable/idempotent.

### C4. API abuse / rate limiting
Hit endpoints at 100 / 500 / 1k / 10k requests and assert: rate limiter returns `429` with the JSON envelope, no crashes/unhandled rejections, memory stays bounded. (Pairs with D1.)

### C5. Auth & RBAC (see B2)
Login+OTP, refresh rotation + reuse detection, RBAC 403 matrix, IDOR 403/404 per id-addressable resource.

---

## D. OPS, PERFORMANCE & MONITORING

### D1. Move rate limiting to a shared store ⭐⭐⭐⭐
**File:** `backend/src/middleware/rateLimiter.ts`. Default in-memory store resets on restart and isn't shared across instances. Add a Redis store (`rate-limit-redis` + Redis client) behind `REDIS_URL`, fall back to in-memory when unset. Apply to both limiters.

### D2. Performance testing
Measure and record p50/p95 for: dashboard, leaderboard, admin analytics, mock tests, search. Targets (tune to infra): API < 300 ms, dashboard < 2 s, search < 500 ms. Add DB indexes where queries are slow (e.g. leaderboard ordering, attempt lookups) and paginate any unbounded lists.

### D3. Exam stress testing ⭐⭐⭐⭐⭐
Load-test the same written exam with 100 → 500 → 1k → 5k concurrent students (k6/Artillery). Monitor CPU, memory, Postgres connections, Redis, and any WebSockets. Confirm heartbeat/save/submit stay within target latency and no attempts are lost; size the DB connection pool accordingly.

### D4. Logging audit ⭐⭐⭐⭐
Structured logs must include: userId, IP, device/UA, endpoint, duration, status, and a **correlation/request ID** (add per-request middleware). Must **never** log passwords, OTPs, JWTs/refresh tokens, or payment secrets — grep the codebase and redact. Verify the existing `requestLogger` covers this.

### D5. Admin audit trail ⭐⭐⭐⭐⭐
Persist an `AuditLog` (actorId, action, targetType, targetId, before/after or diff, IP, timestamp) for every sensitive admin action: login/logout, payment refund, question edits, course/test publish, student deletion, role changes, coupon changes. Expose an admin view.

### D6. Production monitoring
Wire Sentry (frontend + backend), confirm the `/health` endpoint, and add health/liveness for cron jobs, queue workers, email delivery, and webhook delivery (dead-letter + alert on repeated failures).

### D7. Backup verification ⭐⭐⭐⭐⭐
Automate DB backups **and** a restore drill: restore into a scratch DB, run smoke tests, confirm data integrity. A backup that has never been restored is not verified. Document RPO/RTO.

### D8. Browser compatibility ⭐⭐⭐⭐
Verify core flows (auth, enroll/pay, learning, exam) on Chrome, Edge, Firefox, Safari, Android Chrome, iPhone Safari — with special attention to the exam fullscreen/visibility APIs on Safari/iOS.

### D9. Accessibility ⭐⭐⭐⭐
Verify keyboard navigation, visible focus states, screen-reader labels/roles, color contrast (WCAG AA), and form labels across auth, dashboard, admin CRUD, and the exam shell. Run axe/Lighthouse and record scores.

---

## Deliverables
1. All A + B + D code changes, conventions preserved, `tsc --noEmit` (both apps) + `next build` green.
2. C test suites (exam, payment, transactions, auth/RBAC/IDOR, injection/XSS, uploads, abuse) wired into `npm test` + CI.
3. Reports: securityheaders.com grade (B1), RBAC/IDOR matrix (B2), load-test results (D3), performance p95s (D2), a11y scores (D9).
4. A CHANGELOG listing every file touched and what was fixed, plus any new env vars (`CLIENT_URLS`, `REDIS_URL`, Sentry DSNs) documented in the README.
