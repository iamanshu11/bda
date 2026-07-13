# BDA Platform — Engineering Task Brief

A prioritized backlog for the Bokaro Defence Academy (BDA) platform. Hand each ticket to a developer as-is. Every ticket lists **why**, **scope**, **files/pointers**, and **acceptance criteria (AC)**.

## Context for the team

- **Monorepo:** `frontend/` (Next.js 15, App Router, TypeScript, Tailwind, React Query) and `backend/` (Node + Express + TypeScript, PostgreSQL via Prisma).
- **Backend architecture:** Route → Middleware → Controller → Service → Prisma. Keep this layering. Generic API response via `utils/ApiResponse.ts`; errors via `utils/ApiError.ts` + `middleware/errorHandler.ts`.
- **Auth:** JWT access token (in-memory on frontend) + rotating refresh token (httpOnly cookie). Email-OTP 2FA. RBAC roles: `STUDENT`, `FACULTY`, `ADMIN`, `SUPER_ADMIN`.
- **Payments:** Razorpay (`config/razorpay.ts`, `services/payment.service.ts`), order → client checkout → server-side signature verify → enroll.
- **Ground rule:** run `npm run type-check` in **both** apps before every PR merge; both must be green. Add this to CI (see P2-1).

---

# P0 — Blockers (do first)

## P0-1 — Fix TypeScript errors that break the production build
**Why:** The app runs in dev (`next dev` / `tsx`) which ignores type errors, but `npm run build` / `npm run type-check` currently fail. Production deploys will fail.

**Scope / known errors:**
1. `backend/src/controllers/student.controller.ts` — `updateProfile` passes `academyId: string | null` but `studentService.updateProfile()` (`backend/src/services/student.service.ts`) types the param `academyId?: string`. Widen the service signature to `academyId?: string | null` (Prisma accepts `null` to clear the FK).
2. `backend/src/services/quizBattle.service.ts` — `liveState()` has no explicit return type and self-references, triggering `TS7023`. Add an explicit return type (define an interface for the live-battle payload).

**AC:**
- `cd backend && npm run type-check` exits 0.
- `cd frontend && npm run type-check` exits 0.
- `npm run build` succeeds in both apps.

## P0-2 — Razorpay payment webhook (paid-but-not-enrolled protection)
**Why:** Enrollment currently only happens if the browser calls `POST /students/payments/verify` after checkout. If the user closes the tab / loses network after paying, **money is captured but the student is never enrolled** and the payment stays `CREATED`. This is a money-vs-access risk in live mode.

**Scope:**
- Add `POST /api/v1/payments/webhook` (public route, **raw body**, no auth). Mount it so it uses `express.raw({ type: 'application/json' })` for that path (needed for signature verification — do NOT let the global `express.json()` consume it first).
- Verify the webhook signature using `RAZORPAY_WEBHOOK_SECRET` (already in `config/env.ts` / `.env.example`): `HMAC_SHA256(rawBody, webhookSecret) === X-Razorpay-Signature` header.
- Handle `payment.captured` (and optionally `order.paid`): look up the `Payment` by `razorpayOrderId`, mark `PAID` (idempotent — ignore if already `PAID`), and enroll the student via `studentService.enroll()` (swallow "already enrolled").
- Configure the webhook URL + secret in the Razorpay dashboard (document in `backend/README.md`).

**Files:** new `backend/src/routes/payment.routes.ts` (or extend), `backend/src/controllers/payment.controller.ts`, `backend/src/services/payment.service.ts`, mount in `backend/src/app.ts` before the JSON body parser for the webhook path.

**AC:**
- Sending a valid `payment.captured` webhook enrolls the user even if `/verify` was never called.
- Invalid signature → 400, no enrollment.
- Replaying the same event does not double-enroll or error.

---

# P1 — Important features

## P1-1 — Completion certificates
**Why:** LMS marks a course complete but there's no certificate — cadets expect one.
**Scope:**
- Prisma: `Certificate` model (`id, userId, courseId, serial (unique), issuedAt`), unique `(userId, courseId)`.
- On final module completion (`learning.service.ts` — when all modules of a course are complete), issue a certificate + a notification.
- Backend: `GET /students/certificates`, `GET /students/certificates/:id` (owner only), and a public verify endpoint `GET /verify/certificate/:serial` (for QR verification).
- Generate a PDF (use `pdfkit` or an HTML→PDF lib) with cadet name, course, serial, date, and a QR code linking to the verify URL.
- Frontend: "Certificates" section in the dashboard + a download button on a completed Training Mission.

**AC:** completing all operations in a course issues exactly one certificate; PDF downloads; the public verify URL confirms authenticity; re-completion doesn't duplicate.

## P1-2 — Payments admin + refunds + invoices
**Why:** Admins can't see or manage payments; no refunds or receipts.
**Scope:**
- Admin screen `frontend/app/admin/payments/page.tsx` (use the existing `ResourceManager` pattern) listing payments with filters (status, date, course, user), read-only + a "Refund" action.
- Backend admin routes (guard `ADMIN`/`SUPER_ADMIN`): `GET /admin/payments`, `POST /admin/payments/:id/refund` (calls Razorpay Refunds API, updates status to `REFUNDED` — add to the `PaymentStatus` enum, and un-enroll or flag per policy).
- Email + PDF **receipt/invoice** on successful payment (reuse the certificate PDF approach). Include GST fields if applicable — confirm tax requirements with finance.

**AC:** admin can view all payments, filter, and refund a test payment; buyer receives a receipt email.

## P1-3 — Faculty (Commander) area
**Why:** `FACULTY` exists in RBAC but faculty currently land on the student dashboard; they have no tools.
**Scope:**
- A `/faculty` (or `/commander`) dashboard gated to `FACULTY` (+ admins). Route logins with role `FACULTY` here (update `dashboardPathForRole` in `frontend/types/auth.ts` and `RequireAuth`).
- Faculty can manage modules/quizzes **for courses they're assigned to** (reuse `ModuleManager`/`QuizManager`, scoped by the `CourseFaculties` relation), and view enrolled cadets + progress for those courses.
- Backend: faculty-scoped endpoints + an `authorize`/ownership guard so a faculty can only touch their assigned courses.

**AC:** a FACULTY user logs into the faculty area, edits only their assigned course content, and cannot access other courses or the admin panel.

## P1-4 — Account management gaps
**Why:** Missing common account flows.
**Scope:**
- **Resend verification** if the signup OTP expired (endpoint likely exists as `resend-otp`; ensure it's surfaced on the verify-OTP screen with the cooldown).
- **Change email** (with OTP re-verification of the new address).
- **Deactivate / delete account** (soft delete: set `isActive=false`, revoke refresh tokens).

**AC:** each flow works end-to-end with proper OTP/verification and session revocation.

## P1-5 — Wire the `AuditLog` model
**Why:** The `AuditLog` table exists but nothing writes to it — no admin action trail.
**Scope:** add a small helper/middleware that records admin create/update/delete actions (actor, action, entity, entityId, ip) and an admin "Audit Log" read-only screen.
**AC:** admin CRUD actions appear in the audit log with actor + entity.

---

# P2 — Production readiness (before public launch)

## P2-1 — CI/CD + tests
- Add GitHub Actions (or your CI) running, on every PR: `npm ci`, `prisma generate`, `type-check`, `lint`, `build` for both apps.
- Add a test runner (Vitest/Jest + Supertest). Start with the highest-risk paths: **auth (OTP, refresh rotation), quiz grading + module unlock, payment verify signature, RBAC guards**.
- **AC:** PRs are blocked unless type-check, lint, build and tests pass.

## P2-2 — Dockerization + deploy config
- Dockerfiles for `frontend` and `backend`, a `docker-compose.yml` (app + Postgres) for local/staging, and documented env for prod.
- **AC:** `docker compose up` brings up the full stack from scratch (migrate + seed).

## P2-3 — Error monitoring + analytics
- Integrate Sentry (frontend + backend) for error tracking; wire `NEXT_PUBLIC_GA_ID` (already an env var) for analytics.
- **AC:** an unhandled error surfaces in Sentry with stack + request context.

## P2-4 — Rate limiting on payment + sensitive endpoints
- Apply `authRateLimiter` (exists in `middleware/rateLimiter.ts`) to `/students/payments/*` and other write-heavy endpoints.
- **AC:** rapid repeated calls to payment endpoints are throttled.

## P2-5 — File storage → S3 (or object storage)
- Local disk uploads are lost on redeploy. Implement the S3 storage driver behind `STORAGE_DRIVER` (already stubbed in `middleware/upload.ts`) so uploaded banners/photos/PDFs persist. Serve via CDN.
- **AC:** with `STORAGE_DRIVER=s3`, uploads land in the bucket and URLs are returned; existing controllers unchanged.

## P2-6 — Secrets & prod hardening
- Ensure strong, unique `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, real SMTP, and **live** Razorpay keys are set in the deploy environment (not the `.env.example` placeholders).
- Confirm CORS `CLIENT_URL`, secure cookies (`secure: true` in prod), and HTTPS-only.
- **AC:** a security checklist is completed and signed off before go-live.

---

# Suggested sequencing
1. **P0-1, P0-2** (build green + payment webhook) — this week.
2. **P1-2, P1-1** (payments admin/refunds + certificates) — revenue + student value.
3. **P1-3, P1-4, P1-5** (faculty area, account flows, audit log).
4. **P2** (CI/CD, Docker, monitoring, S3, hardening) — before public launch.

# Definition of Done (all tickets)
- Types green (`npm run type-check` both apps), lint clean, `npm run build` passes.
- New endpoints validated (Zod/express-validator), guarded by the correct role, and return the standard `{ success, message, data }` envelope.
- New DB changes ship with a committed Prisma migration (`db/migrations/`) and, where relevant, seed data.
- Manual test steps documented in the PR.

---

# P3 — Growth features (conversion, retention, revenue)

> **Already built — do NOT rebuild (enhance only):** in-app notifications (bell + `/students/notifications`), SEO base (`frontend/app/robots.ts`, `sitemap.ts`, `lib/seo.ts` with OG/Twitter/JSON-LD/canonical), competitive rankings + leaderboard, faculty records (name/bio/photo/expertise), course demo videos (`DemoVideo`).

## G1 — Coupon / Discount system ⭐ (high impact)
**Why:** Promo pricing (`WELCOME50`, `BDA2026`, `ARMY20`) drives conversions.
**Schema (Prisma `Coupon`):** `id, code (unique, upper-cased), type (PERCENTAGE|FIXED), value, expiryAt, maxUses, usedCount, minAmount?, status (ACTIVE|DISABLED), courseId? (null = all courses), createdAt`. Add a `CouponRedemption` table (`couponId, userId, paymentId, discountApplied`) to enforce per-user limits + audit.
**Backend:**
- `POST /students/coupons/validate` `{ code, courseId }` → returns `{ valid, discount, finalAmount }` (checks expiry, status, maxUses, min amount, course scope, per-user usage).
- Integrate into `paymentService.createOrder`: accept an optional `couponCode`, re-validate **server-side**, compute the discounted amount, store the applied coupon on the `Payment`, and increment `usedCount` + write a `CouponRedemption` only after payment succeeds (in verify/webhook).
- Admin CRUD for coupons (reuse `ResourceManager` + admin registry in `backend/src/routes/admin.routes.ts`).
**Frontend:** coupon input on the enroll/checkout screen (`components/enroll/CourseSelector.tsx`) with live validate + price update; admin `app/admin/coupons/page.tsx`.
**AC:** a valid coupon reduces the Razorpay order amount; expired/over-limit/wrong-course coupons are rejected server-side; `usedCount` only increments on successful payment; a user can't exceed the per-user limit.

## G2 — Reviews & Ratings ⭐
**Why:** Social proof for future students; only after real completion (trust).
**Schema (`CourseReview`):** `id, userId, courseId, rating (1–5), title?, body?, isApproved (default false), createdAt`, unique `(userId, courseId)`.
**Rule:** only a student who has **completed** the course (all modules) may submit a review.
**Backend:** `POST /students/courses/:courseId/reviews`, `GET /courses/:slug/reviews` (public, approved only + aggregate avg + count), admin moderation (`GET/PATCH /admin/reviews`).
**Frontend:** star widget + review list on the course detail page (`app/(marketing)/courses/[slug]/page.tsx`); "Leave a review" on a completed Training Mission; admin approval screen.
**AC:** only completers can review; course detail shows avg rating + approved reviews; unapproved reviews are hidden publicly.

## G3 — Wishlist
**Schema (`Wishlist`):** `id, userId, courseId, createdAt`, unique `(userId, courseId)`.
**Backend:** `GET/POST/DELETE /students/wishlist`.
**Frontend:** heart/save button on course cards + detail; a "Saved Missions" tab in the dashboard.
**AC:** save/remove works, persists, and shows in the dashboard; "Buy" from wishlist goes straight to checkout.

## G4 — Instructor (Commander) profiles — enhance
**Why:** Credibility. Faculty records exist but lack structured credentials.
**Scope:** extend `Faculty` with `experienceYears?, credentials (String[]), achievements (String[]), rank?` and add a public detail page `app/(marketing)/faculty/[slug]/page.tsx` (backend `GET /faculty/:slug` already exists) showing experience, credentials, and the courses they teach.
**AC:** public instructor page renders full profile + their courses; admin can edit the new fields.

## G5 — Notifications: push + SMS (in-app already done)
**Scope:** add **Web Push** (service worker + VAPID) for events like *Payment Successful, New Quiz, Course Updated, Certificate Ready*; optional **SMS** via a provider (MSG91/Twilio) behind a feature flag. Reuse the existing `notificationService.emit()` as the single fan-out point (email + in-app + push + sms).
**AC:** a triggered event delivers via in-app + push (and SMS if enabled); users can opt out per channel.

## G6 — Mock test ranking (extends existing rankings)
**Why:** NDA/CDS aspirants want National/Batch rank + percentile.
**Scope:** the app already has `rankings`/`leaderboard` (competitive). Add **mock-test-specific** ranking: after a mock test/quiz attempt, compute **National Rank, Batch/Academy Rank, Percentile, Average Score, Top Performers** for that test. Store attempt scores; compute percentile across all attempts of the same test.
**AC:** after a mock test the student sees their national + batch rank, percentile, and the top performers board.

## G7 — Doubt discussion (Q&A)
**Why:** Move doubts off WhatsApp into the platform.
**Schema:** `Doubt (id, userId, courseId?, moduleId?, title, body, status OPEN|RESOLVED, createdAt)` + `DoubtReply (id, doubtId, userId, body, isFacultyAnswer, createdAt)`.
**Backend:** student create/list own doubts; faculty/admin reply + mark resolved; other enrolled students can view/reply within the same course.
**Frontend:** a "Doubts" tab in the learning view (per module/course); faculty answer UI.
**AC:** student posts a doubt → faculty replies → thread visible to co-enrolled students → can be marked resolved; notification on reply.

## G8 — Global search
**Why:** Currently only the public courses page has a title filter.
**Scope:** a global search endpoint across **courses, modules, quizzes, notes, faculty** (start with Postgres `ILIKE`/full-text `tsvector`; upgrade to Meilisearch/Typesense later). Public search covers courses/faculty; in-app search (authenticated) also covers modules/notes for enrolled courses.
**Frontend:** a search box in the header + a `/search?q=` results page.
**AC:** searching returns grouped results (Courses / Faculty / Modules) with links; respects enrollment for gated content.

## G9 — Course preview (pre-purchase)
**Why:** Preview content increases conversions.
**Scope:** add an `isPreview` flag to `CourseModule` (and/or reuse `DemoVideo`) + a `samplePdfUrl` and optional demo quiz on the course. Public course detail shows preview video(s), sample PDF, and a short demo quiz **without** enrollment.
**AC:** a logged-out visitor can watch preview video, open the sample PDF, and try the demo quiz on the course detail page; full content stays locked.

## G10 — Invoice / receipt download anytime
**Why:** Students expect to re-download receipts.
**Scope:** (pairs with P1-2) generate a PDF invoice on successful payment; expose `GET /students/payments/:id/invoice` (owner only) and a "Download invoice" button in a **Purchases/Payments** section of the dashboard.
**AC:** any past successful payment can be re-downloaded as a PDF invoice from the dashboard.

## G11 — Razorpay retry payment ⭐
**Why:** Failed payments are common; retry should be one click.
**Scope:** when a `Payment` is `CREATED`/`FAILED`, allow a **retry**: reuse the same Razorpay order if still valid, else create a fresh order for the same course; never double-charge or double-enroll (idempotent on `razorpayOrderId` + the P0-2 webhook). Surface a "Retry payment" button on failed checkout and in the payments list.
**AC:** a failed payment can be retried and, on success, enrolls exactly once; no orphaned/duplicate enrollments.

## G12 — Abandoned checkout recovery
**Why:** Recover lost sales.
**Scope:** when an order is created but no payment completes within N hours (a `CREATED` `Payment` with no `PAID`), send a reminder email (and in-app) with a resume link. Implement via a scheduled job (cron/worker) querying stale `CREATED` payments.
**AC:** a stale unpaid order triggers exactly one reminder with a working resume link; completing later doesn't re-notify.

## G13 — Course expiry / validity
**Why:** Support Lifetime / 365-day / 180-day access.
**Scope:** add `accessDays Int?` to `Course` (null = lifetime); set `Enrollment.expiresAt` on enroll. Gate learning access when expired (block module fetch in `learning.service`), show an "expired — renew" state, and optionally allow renewal (new payment extends `expiresAt`).
**AC:** a 180-day course locks after expiry; lifetime courses never expire; expiry shown on the course card + dashboard.

## G14 — Admin analytics dashboard ⭐
**Why:** Owners need revenue/ops visibility (current admin overview is just 4 counts in `dashboard.controller.ts`).
**Scope:** an analytics endpoint + screen with **Revenue Today / This Month, Total Students, Active Users, New Registrations, Course Sales, Top Courses, Refunds, Pending Payments**, with simple charts (Recharts). Compute from `Payment`, `Enrollment`, `User`.
**AC:** admin sees accurate revenue (today/month), top courses by sales, and pending/refunded payment counts.

## G15 — SEO & marketing — enhance (base already built)
**Already done:** robots.txt, dynamic sitemap, OG/Twitter tags, JSON-LD, canonical URLs, per-page metadata via `lib/seo.ts`.
**Enhance:** per-course JSON-LD (`Course` schema) on detail pages (present — verify), **dynamic OG images** per course (e.g. `@vercel/og`), and add courses/blogs to the sitemap dynamically.
**AC:** each course has a unique OG image + `Course` structured data; sitemap includes all published courses.

## G16 — Backup & disaster recovery ⭐ (ops)
**Scope:** automated **daily PostgreSQL backups** (managed provider snapshot or `pg_dump` to object storage), **weekly** retention to S3, documented **restore runbook**, and a **quarterly restore test**. Note in `backend/README.md`.
**AC:** backups run automatically; a documented restore has been tested successfully at least once.

## G17 — Terms acceptance at checkout
**Why:** Legal + refund-policy consent.
**Scope:** a required checkbox at checkout — "I agree to Terms, Refund Policy, Privacy Policy" — and **store the acceptance** (`termsAcceptedAt` on the `Payment` or a `ConsentLog` row with version + timestamp + IP). Add the Terms/Refund/Privacy pages.
**AC:** checkout can't proceed without consent; the acceptance timestamp + policy version is stored with the payment.

---

## Priority within P3 (business impact first)
1. **G1 Coupons, G11 Retry payment, G14 Admin analytics, G17 Terms** — directly affect revenue/ops and are quick.
2. **G2 Reviews, G9 Course preview, G3 Wishlist** — conversion boosters.
3. **G10 Invoices, G12 Abandoned checkout, G13 Course expiry, G4 Instructor profiles** — retention/revenue polish.
4. **G6 Mock ranking, G7 Doubts, G8 Search, G5 Push/SMS** — engagement/retention.
5. **G16 Backups, G15 SEO enhancements** — ops + growth (backups are non-negotiable before scaling).
