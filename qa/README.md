# BDA — Live QA scripts

Run these against your running servers (`backend :5000`, `frontend :3000`). Paste
the output back to me and I'll interpret the results and fix anything that fails.

Set custom URLs any time with `API=` / `WEB=` env vars (defaults shown).

## 1. Security headers + CORS + RBAC (B1, A5, B2, D4)

```bash
bash qa/check-headers.sh
```

Checks: nosniff / Referrer-Policy / Permissions-Policy / correlation id on the API;
frontend security headers; CORS rejects unknown origins; admin & student routes
return 401 without a token; `/health` is 200.
Note: CSP + HSTS are intentionally **production-only** — to see them, run the
backend with `NODE_ENV=production` and the frontend via `npm run build && npm start`.

## 2. Rate limiting / API abuse (C4)

```bash
N=150 bash qa/rate-limit-test.sh
```

Fires 150 rapid login attempts; expects a batch of `429`s and no crash.

## 3. Exam / load stress test (D3) — needs k6

```bash
brew install k6           # once
k6 run qa/exam-stress.js               # baseline, ~100 VUs, public endpoints
k6 run -e VUS=500 qa/exam-stress.js    # ramp to 500 concurrent
```

To drive the real authed exam flow, pass a student JWT + a published test id:

```bash
k6 run -e VUS=300 -e TOKEN='<student-access-jwt>' -e TEST_ID='<testId>' qa/exam-stress.js
```

Watch the summary: `http_req_failed` should stay `<1%` and `p(95)` under the
threshold. Watch backend CPU/memory and Postgres connections while it runs.

## 4. Performance + accessibility (D2, D9) — Lighthouse

```bash
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility --view
# key authed pages too (after logging in, copy the URL):
npx lighthouse http://localhost:3000/dashboard --only-categories=accessibility --view
```

Target: Accessibility ≥ 90, Performance tuned to your infra. Report the scores
and any failed audits.

## 5. Unit + integration tests (already green in the repo)

```bash
cd backend && npm test        # 42 passing (signatures, exam rules, uploads, RBAC)
```

## 6. DB-backed integration tests (allow-paths) — optional next step

The current RBAC integration tests assert deny paths (no DB needed). To test the
*allow* paths (a real login, enroll, start-exam, submit), point a disposable test
Postgres at `DATABASE_URL`, run `npm run prisma:migrate`, seed, and I can write a
Supertest suite that drives the full happy path. Tell me if you want this and
whether you can provide a throwaway test database.

---

### Before running: apply the audit-log migration (D5)

```bash
cd backend && npm run prisma:migrate   # creates the audit_logs table
npx prisma generate
```
Until this runs, admin actions won't be logged (the code is safe — it no-ops).
