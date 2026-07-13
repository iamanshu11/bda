# Bokaro Defence Academy (BDA)

Full-stack educational platform for **Bokaro Defence Academy** — coaching for NDA, CDS, AFCAT, Agniveer and other defence & government exams.

## Status

| Part | Status |
| --- | --- |
| **Frontend** (Next.js 15) | ✅ CMS-driven marketing site (Courses/Faculty/Gallery/Results pull live from the API, with course detail pages) + auth flow + Student & Admin dashboards with CRUD — responsive, dark/light, full SEO |
| **Backend** (Node/Express + PostgreSQL + Prisma) | ✅ JWT + Email-OTP 2FA auth, RBAC, full Prisma schema, public content APIs, admin CRUD for all resources, student dashboard APIs, security & logging |

## Payments — Course purchase (Razorpay)

Paid courses are purchased through **Razorpay**; free courses (fees `0`/empty) enrol directly with no checkout.

**Flow:** student clicks Enroll → backend `POST /students/payments/order` creates a Razorpay order + a `payment` row (status `CREATED`) → the Razorpay Checkout modal opens in the browser → on success the browser sends the payment ids to `POST /students/payments/verify`, which **verifies the HMAC signature server-side** (payment can't be faked), marks the payment `PAID`, and enrols the student.

### Set up test keys (one time)

1. Create a free Razorpay account and open the **Dashboard → Settings → API Keys → Generate Test Key**.
2. Put them in `backend/.env` (never commit real keys, and don't paste the secret anywhere public):

   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_test_key_secret
   ```
3. Apply the new DB table + deps:

   ```bash
   cd backend
   npm install                 # pulls in the razorpay package
   npm run prisma:migrate -- --name payments
   ```
4. Restart the backend. The publishable key id is returned to the browser by the order endpoint — the frontend needs no extra env var.

### Reviews, wishlist & course preview

- **Reviews & Ratings:** students who have **completed** a course can leave a star rating + review on the course page; reviews appear publicly only after an admin approves them at `/admin/reviews`. Course pages show the average rating + count.
- **Wishlist:** a heart on every course card + detail page saves a course to **Saved Missions** (`/dashboard/saved`), from which students can enroll later.
- **Course preview:** admins mark any module as a **free preview** (checkbox in the module editor); those modules (video + notes + a sample quiz, no answers) render on the public course page before purchase.

> Migration for these: `cd backend && npm run prisma:migrate -- --name reviews_wishlist_preview && npm run db:seed` (adds `course_reviews`, `wishlists`, and the module `isPreview` flag; seeds the CDS course's first operation as a preview).

### Coupons, retry & admin analytics

- **Coupons:** admins create them at `/admin/coupons` (percentage or fixed, with expiry, usage caps, per-user limit, min price, course scope). Students apply a code on the enroll screen — the discount is **re-validated + applied server-side** on the Razorpay order, and the redemption is recorded only once the payment is captured. Seeded samples: `WELCOME50`, `ARMY20`, `BDA2026`.
- **Retry payment:** students see their **Purchases** (`/dashboard/purchases`) with status; failed/incomplete payments have a one-click **Retry** (a fresh order supersedes the stale one — no double charge or double enroll).
- **Admin analytics:** `/admin/analytics` shows revenue (today/month), students, active users, new registrations, course sales, top courses, refunds and pending payments. Admins can also browse all payments at `/admin/payments`.

> After pulling these changes, run the migration to add the new tables/columns (coupons, coupon_redemptions, payment discount/refund fields, `REFUNDED` status):
> ```bash
> cd backend && npm run prisma:migrate -- --name coupons_analytics && npm run db:seed
> ```

### Webhook (important — enrolls the student even if the browser closes)

Enrollment must not depend only on the browser calling `/verify`. Configure a Razorpay webhook so payments always enroll:

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. **URL:** `https://YOUR_BACKEND/api/v1/payments/webhook` (use an ngrok/tunnel URL while testing locally).
3. **Active events:** `payment.captured` (and optionally `order.paid`).
4. Set a **secret** and put the same value in `backend/.env`:

   ```
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

The endpoint verifies the raw-body HMAC signature, marks the payment `PAID`, and enrolls the buyer — idempotently (safe to receive the same event twice). It's mounted with a raw body parser **before** JSON parsing, and is unauthenticated by design (Razorpay-signed).

### Test the payment (Razorpay test mode)

Use any course that has a fee (the seed's CDS/NDA courses do).

> ⚠️ **Use UPI or Netbanking to test, not a card.** New Razorpay accounts have International Payments **disabled**, and Razorpay classifies the common test cards (e.g. `4111 1111 1111 1111`) as *international*, so they fail with "International cards are not supported." UPI/Netbanking don't go through card BIN classification and always work in test mode.

- **UPI (recommended):** choose UPI → `success@razorpay` (success) or `failure@razorpay` (failure)
- **Netbanking:** pick any bank → click **Success**

No real money moves in test mode. To test **card** payments you must enable International Payments on the Razorpay account (Dashboard → Account & Settings → Payment Methods / International; requires KYC) — not needed just to validate the enrolment flow.

No real money moves in test mode. On success you'll be enrolled and redirected to your Training Missions.

## Learning system (module-based LMS)

Each course is built from ordered **modules**, and students progress sequentially — a module unlocks only when the previous one is fully complete (video watched **and** notes read **and** quiz passed, ≥ pass mark).

- **Admin** manages modules per course at `/admin/courses/<id>/modules`: add/edit/reorder/delete modules, each with a YouTube URL or embed, rich-text reading notes, and an MCQ quiz (4 options, single correct, configurable pass mark). Question builder supports add/edit/delete.
- **Students** learn at `/dashboard/learn/<courseId>`: a module sidebar with 🔒 locked / 🟡 in-progress / ✅ completed states, the embedded video, the notes, and the quiz. Quizzes are **graded on the backend** — correct answers are never sent to the browser — and passing auto-unlocks the next module. A course progress bar and "Continue Learning" button track where they left off.
- Security: enrollment is required, module order is enforced server-side (direct URL access to a locked module is rejected), and all progress is stored per student.

## Cadet Command Center (defence-themed dashboard)

The student dashboard is a defence-themed **Cadet Command Center**. Terminology across student-facing screens is reskinned: Student → **Cadet**, Faculty → **Commander**, Courses → **Training Missions**, Modules → **Operations**. It surfaces seven live widgets from `GET /students/command-center`:

- 🎯 **Mission Progress** — overall completion ring + per-mission bars
- 📚 **Current Operation** — resume point with a one-click Resume button
- 🏅 **Cadet Rank** — rank tiers (Recruit → Major) based on operations completed, with progress to next
- 🔥 **Study Streak** — consecutive active days (current + longest)
- 📈 **Weekly Performance** — operations done, assessments taken, avg score + a 7-day activity chart
- 📅 **Today's Briefing** — live classes scheduled today with Join links
- 📢 **Command Announcements** — admin-posted announcements (managed at `/admin/announcements`, pinnable)

## Notifications, live classes & activity

- **Notifications** — created automatically on enrollment and module completion; a bell in the dashboard topbar shows the unread count with a dropdown to read / mark-all-read (`/students/notifications`).
- **Live classes** — admins schedule them at `/admin/live-classes` (title, date/time, meeting link, optional course); students see **Upcoming Classes** on their dashboard with a Join button.
- **Recent Activity** — the student dashboard lists recently accessed modules.
- **PDF notes** — each module can carry a PDF attachment (upload in the admin module form); students get a "Download PDF notes" button.
- **Course search** — the public `/courses` page has a search box (title/description/category) alongside the category filter.
- **Module navigation** — Previous / Next buttons inside the learning view (Next respects unlock state).

## How users log in

A single sign-in page (`/login`) serves everyone. After email + password, a 6-digit OTP is emailed (2FA); on verification the user is routed by role:

- **Students / Faculty** → `/dashboard` (overview, my courses, profile, change password)
- **Admin / Super Admin** → `/admin` (overview stats + full CRUD for courses, categories, faculty, gallery, results, contact messages, users)

The super admin is created by the backend seed (`SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` in `backend/.env`). New public sign-ups get the `STUDENT` role.

## Structure

```
BDA/
├── frontend/     # Next.js 15 app (App Router, TypeScript, Tailwind) — see frontend/README.md
├── backend/      # Node + Express + PostgreSQL + Prisma API — see backend/README.md
└── homepage.md   # Original full-project specification
```

## Backend — quick start

```bash
cd backend
npm install
cp .env.example .env         # set DATABASE_URL, JWT secrets, SMTP
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
npm run dev                  # http://localhost:5000/api/v1
```

See **[backend/README.md](./backend/README.md)** for the full API reference, auth/2FA flow and architecture.

## Frontend — quick start

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev        # http://localhost:3000
```

See **[frontend/README.md](./frontend/README.md)** for full documentation (folder structure, SEO system, theming, and how to add new pages / connect the backend).

## What's built so far

The homepage matches the provided design and is fully componentized:

- **Header** — sticky, responsive, mobile menu, dark-mode toggle, Call Now / Enroll Now CTAs
- **Hero** — "Molding the Brave Hearts" with optimized background image
- **Stats** — animated count-up numbers
- **About** — with chat-bubble accents
- **Exam Categories** — interactive filter pills + cards
- **Featured Courses** — batch cards
- **Hall of Fame** — Swiper carousel of achievers
- **Study Resources** — resource cards
- **Facilities** — icon grid
- **Footer** — links, social, embedded map

A scalable **SEO system** (`frontend/lib/seo.ts`) drives metadata, Open Graph, Twitter cards, JSON-LD structured data, `robots.txt` and `sitemap.xml` — so every future page (Courses, Results, Faculty, Gallery, Contact, blog) stays SEO-consistent with a single `buildMetadata()` call.

## Roadmap (from `homepage.md`)

1. Backend scaffold: Express + TypeScript, Prisma + PostgreSQL, repository/service layers
2. Auth: JWT + refresh tokens, Email OTP 2FA, role-based access (Student / Faculty / Admin / Super Admin)
3. Inner pages: Courses, Results, Faculty, Gallery, Contact
4. Student & Admin dashboards with full CRUD
5. File uploads (local → S3-ready), Winston logging, security hardening
```
# bda
