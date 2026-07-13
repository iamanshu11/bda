# Feature Prompt — Paid Written Tests (Standalone MCQ Mock Tests)

## Goal
Add a new product type to the BDA platform: **Written Tests** — standalone, paid MCQ mock tests that are separate from courses. An **admin** creates a test, adds MCQ questions with correct answers, sets a **price (default ₹299, fully configurable per test)** and a **validity window** (available from → to). A **student** pays the price to enrol, then attempts the test within its window. Correct answers stay hidden from students until an admin-controlled **reveal time**. Admins can create unlimited tests.

> Build this to match the existing codebase: Next.js 15 frontend + Node/Express/TypeScript + PostgreSQL/Prisma backend. **Reuse** the existing Razorpay payment flow (`payment.service.ts` — order → verify → webhook), the generic admin CRUD (`ResourceManager` + `admin.routes.ts` registry), the server-side quiz-grading pattern (`learning.service.ts` / `moduleQuiz`), and the standard `{ success, message, data }` response envelope. Keep the Route → Controller → Service → Prisma layering. Run `npm run type-check` in both apps before every merge.

---

## 1. Data model (Prisma)

```prisma
enum TestStatus {
  DRAFT        // admin still building it — not visible to students
  PUBLISHED    // visible + purchasable when inside the validity window
  ARCHIVED
}

enum TestAttemptStatus {
  IN_PROGRESS
  SUBMITTED
  EXPIRED      // window/time ran out before submit
}

model WrittenTest {
  id             String   @id @default(uuid())
  title          String
  slug           String   @unique
  description    String?
  instructions   String?  @db.Text
  price          Int      @default(299)   // in rupees; admin-configurable per test
  durationMins   Int?                      // time limit once started (null = no limit)
  totalQuestions Int      @default(0)      // denormalised for display
  passingMarks   Int?                      // optional
  negativeMark   Float    @default(0)      // per wrong answer, e.g. 0.25 (0 = none)
  shuffle        Boolean  @default(true)
  availableFrom  DateTime
  availableTo    DateTime
  answersRevealAt DateTime?                // when correct answers become visible to students
  status         TestStatus @default(DRAFT)
  questions      WrittenTestQuestion[]
  enrollments    WrittenTestEnrollment[]
  attempts       WrittenTestAttempt[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([status])
  @@index([availableFrom, availableTo])
  @@map("written_tests")
}

model WrittenTestQuestion {
  id            String        @id @default(uuid())
  testId        String
  test          WrittenTest   @relation(fields: [testId], references: [id], onDelete: Cascade)
  question      String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption CorrectOption // A|B|C|D — NEVER sent to students before reveal
  explanation   String?
  marks         Int           @default(1)
  order         Int           @default(0)
  createdAt     DateTime      @default(now())

  @@index([testId])
  @@map("written_test_questions")
}

model WrittenTestEnrollment {
  id         String      @id @default(uuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  testId     String
  test       WrittenTest @relation(fields: [testId], references: [id], onDelete: Cascade)
  paymentId  String?     // links to the Payment row (null for free/admin-granted)
  createdAt  DateTime    @default(now())

  @@unique([userId, testId])
  @@index([testId])
  @@map("written_test_enrollments")
}

model WrittenTestAttempt {
  id          String            @id @default(uuid())
  userId      String
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  testId      String
  test        WrittenTest       @relation(fields: [testId], references: [id], onDelete: Cascade)
  status      TestAttemptStatus @default(IN_PROGRESS)
  startedAt   DateTime          @default(now())
  submittedAt DateTime?
  score       Float?
  totalMarks  Int?
  correct     Int?
  wrong       Int?
  answers     Json?             // [{ questionId, selected }]
  createdAt   DateTime          @default(now())

  @@unique([userId, testId])   // one attempt per student per test (make configurable later)
  @@index([testId])
  @@map("written_test_attempts")
}
```

- Reuse the existing `CorrectOption` enum (`A|B|C|D`) and extend the `Payment` model so a payment can reference a test (add optional `testId String?` + relation, alongside the existing `courseId`, OR make the payment target polymorphic with a `kind` field — pick one and document it).
- Add the reverse relations (`writtenTests` etc.) on `User`.

---

## 2. Admin capabilities

Admin panel screen at **`/admin/written-tests`** (reuse `ResourceManager`):

**Test CRUD** — create / edit / delete / publish. Fields: title, description, instructions, **price (₹, default 299)**, durationMins, passingMarks, negativeMark, shuffle, **availableFrom**, **availableTo**, **answersRevealAt**, status.

**Question builder** (per test, like the existing module `QuizManager`): add / edit / delete / reorder MCQ questions, each with 4 options, the **correct option**, marks, and an optional explanation. `totalQuestions` auto-updates.

**Admin APIs** (guarded `ADMIN`/`SUPER_ADMIN`):
- `GET/POST/PATCH/DELETE /admin/written-tests[/:id]`
- `POST /admin/written-tests/:id/questions`, `PATCH /admin/test-questions/:id`, `DELETE /admin/test-questions/:id`, `POST /admin/written-tests/:id/questions/reorder`
- `GET /admin/written-tests/:id/results` — leaderboard/attempts for a test (scores, ranks).

Auto-generate `slug` from title. Setting `status = PUBLISHED` requires `availableFrom < availableTo` and at least one question.

---

## 3. Student flow

1. **Browse** published tests at `/tests` (and `/tests/[slug]` detail): title, description, price, question count, duration, and the availability window. Only `PUBLISHED` tests inside (or before) their window are shown; show a "starts on …" / "closed" state otherwise.
2. **Pay to enrol** — reuse the Razorpay flow. `POST /students/tests/:id/order` → Razorpay order for `test.price` → checkout → verify (and webhook) → create `WrittenTestEnrollment`. Coupons (existing `coupon.service`) may apply. Block enrolment outside the window and if already enrolled.
3. **Attempt** at `/dashboard/tests/[id]/attempt` — only if enrolled **and** now within `availableFrom…availableTo`. Start creates a `WrittenTestAttempt` (`IN_PROGRESS`), records `startedAt`; enforce `durationMins` client-side (timer) **and** server-side (reject/auto-expire late submits). Questions are served **without `correctOption`** (shuffled if enabled).
4. **Submit** — `POST /students/tests/:id/submit { answers }`. **Grade on the server** (marks per question, minus `negativeMark` per wrong), store score/correct/wrong, set `SUBMITTED`.
5. **Result** — show score, marks, pass/fail. **Correct answers + explanations are only returned when `now >= answersRevealAt`** (or immediately if `answersRevealAt` is null). Before reveal, show "answers will be released on …".

**Student APIs** (authenticated):
- `GET /students/tests` (enrolled + available), `GET /students/tests/:id` (enrolment + window state)
- `POST /students/tests/:id/order`, `POST /students/tests/:id/submit`
- `GET /students/tests/:id/result` (respects the reveal time)

---

## 4. Answer-reveal rule (important)
The `correctOption` and `explanation` must **never** be sent to a student before `answersRevealAt`. Enforce this in the service layer:
- Attempt/question fetch: strip correct answers.
- Result fetch: include correct answers **only if** `answersRevealAt == null || now >= answersRevealAt`.
This lets the admin "share the answers at that time only" by setting `answersRevealAt` (e.g. after the window closes).

---

## 5. Security & rules
- Grading is **100% server-side**; the client never receives answers pre-reveal and cannot self-score.
- Enforce enrolment + validity window + time limit on the server (don't trust the client timer).
- One attempt per student per test (config flag to allow more later).
- Payment verification via the existing HMAC signature + webhook (idempotent enrolment).
- Only enrolled students can open a test; direct-URL access to an unpurchased/expired test is rejected.

---

## 6. Reuse map (do NOT rebuild these)
- **Payments:** `backend/src/services/payment.service.ts` (order/verify/webhook), `frontend/lib/razorpay.ts`, `frontend/components/enroll/CourseSelector.tsx` (pattern for coupon + checkout).
- **Admin CRUD:** `ResourceManager` + resource registry in `backend/src/routes/admin.routes.ts` + zod schemas in `resource.schemas.ts`.
- **Quiz grading + question builder:** `learning.service.ts`, `module.service.ts`, `components/admin/QuizManager.tsx`, `components/learn/QuizTaker.tsx`.
- **Coupons / analytics:** `coupon.service.ts`; add test revenue to `/admin/analytics`.

---

## 7. Acceptance criteria
- Admin can create a written test with a **configurable price** (defaults to ₹299), a **valid-from/valid-to window**, add MCQs with correct answers, and publish it.
- A student can **pay ₹<price>** (Razorpay test mode), gets enrolled, and can attempt the test **only within the window**.
- Submitting grades on the server (with negative marking if set); the student sees their score immediately.
- **Correct answers appear only at/after `answersRevealAt`** — never before, even via the API directly.
- Admin can create **multiple** tests, each with independent price/window/questions, and view per-test results.
- `npm run type-check` and `npm run build` pass in both apps; new tables ship as a committed Prisma migration + seed with one sample test.

---

## 8. Nice-to-haves (phase 2)
- Per-test leaderboard + percentile (reuse the mock-ranking approach).
- Multiple attempts with a configurable limit; question randomisation from a larger bank.
- Downloadable score card / certificate for the test.
- Bundle discounts / test series (buy N tests together).


# Feature Prompt — Secure Exam Mode & Anti-Cheating System

## Goal

Implement a **Secure Exam Mode** for all Written Tests to reduce cheating and maintain exam integrity. While a student is attempting a written examination, the system should continuously monitor suspicious activities such as leaving the exam window, switching browser tabs, minimizing the browser, refreshing the page, opening developer tools, multiple logins, and network interruptions.

The system should automatically warn students, maintain a cheating log, notify administrators in real time, and automatically submit the examination if the configured cheating limit is exceeded.

---

# 1. Secure Exam Session

When a student clicks **Start Test**, the system enters **Secure Exam Mode**.

During the exam:

* Full-screen mode is automatically requested.
* Navigation outside the exam is restricted.
* Browser back navigation is disabled.
* Page refresh is blocked.
* Right-click is disabled.
* Text selection is disabled.
* Copy/Cut/Paste shortcuts are disabled.
* Print shortcuts are disabled.
* Developer shortcuts are blocked where possible.
* Exam timer starts immediately.
* The exam session is recorded in the database.

---

# 2. Cheating Detection Rules

The platform should detect the following events.

## Window Minimized

If the student minimizes the browser:

* Count as **1 cheating attempt**
* Save timestamp
* Display warning

Example:

> Warning: You minimized the examination window. This has been recorded as Cheating Attempt 1 of 3.

---

## Browser Tab Change

If the student switches to another browser tab:

* Count as cheating
* Save timestamp
* Notify admin dashboard

---

## Browser Window Change

If another application gains focus:

Examples:

* VS Code
* WhatsApp
* Telegram
* Calculator
* Chrome DevTools
* Another Browser

Count as cheating.

---

## Full Screen Exit

If the student exits full-screen mode:

* Warning displayed
* Count cheating attempt

Automatically request full-screen again.

---

## Page Refresh

If the student refreshes the page:

* Resume exam
* Count cheating
* Record event

---

## Browser Back Button

Attempting to leave the exam using Back should:

* Prevent navigation
* Display warning

---

## Multiple Tabs

Only one exam tab should be allowed.

If another exam tab is opened:

* Previous session invalidated
* Notify administrator

---

## Multiple Devices

If the same account logs in from another device:

* End previous session
* Notify administrator
* Log IP address
* Log device information

---

## Developer Tools Detection

Detect common developer tool usage where possible.

Examples:

* F12
* Ctrl + Shift + I
* Ctrl + Shift + J
* Ctrl + U

Display warning and log the attempt.

---

## Clipboard Protection

Disable:

* Copy
* Paste
* Cut

Keyboard shortcuts:

* Ctrl + C
* Ctrl + V
* Ctrl + X

---

## Right Click

Disable the browser context menu.

---

## Keyboard Shortcuts

Disable where practical:

* Alt + Tab (cannot be fully blocked by browsers)
* Ctrl + Tab
* Ctrl + W
* Ctrl + R
* Ctrl + Shift + T

Log detectable attempts.

---

## Internet Disconnect

If internet connection is lost:

* Save answers locally
* Continue timer
* Automatically sync when connection returns

If offline exceeds the configured threshold, automatically submit the exam.

---

# 3. Cheating Counter

Each violation increments the cheating counter.

Example:

Cheating Attempt 1 / 3

Cheating Attempt 2 / 3

Cheating Attempt 3 / 3

When the limit reaches **3**:

* Immediately auto-submit the examination
* Lock further editing
* Calculate results
* Redirect to the result page
* Notify administrators

The maximum cheating count should be configurable by administrators.

---

# 4. Admin Notifications

Administrators should receive live notifications whenever cheating occurs.

Notification example:

Student: Rahul Kumar

Test: NDA Mock Test 01

Violation: Browser Tab Changed

Attempt: 2/3

Time: 10:24:16 AM

IP Address

Browser

Device

---

# 5. Cheating Log

Create an `ExamViolation` model.

Suggested fields:

* id
* attemptId
* studentId
* violationType
* timestamp
* browser
* operatingSystem
* IP address
* device
* userAgent

Every violation must be permanently stored.

---

# 6. Admin Dashboard

Create a dedicated "Exam Monitoring" page.

Display:

* Live students taking exams
* Time remaining
* Current question
* Cheating count
* Network status
* Browser
* Device
* IP address

Allow filtering by:

* Test
* Student
* Status
* Cheating count

---

# 7. Auto Submission

Automatically submit the examination when:

* Time expires
* Cheating limit exceeded
* Administrator forces submission
* Browser remains closed beyond the allowed timeout

Auto submission should always save the latest answers before grading.

---

# 8. Security Rules

The server must never trust the client.

All critical validation should occur on the backend:

* Exam duration
* Start time
* Submission time
* Cheating count
* Attempt status
* Enrollment
* Payment status
* Result calculation

Even if JavaScript is modified or browser requests are manipulated, the server must reject invalid submissions.

---

# 9. Important Browser Limitation

Modern browsers cannot completely prevent or detect every form of cheating.

Actions such as:

* Alt + Tab
* Opening another monitor
* Using another phone
* Taking screenshots
* Using external devices

cannot be reliably blocked using standard web technologies.

The Secure Exam Mode should therefore implement the strongest browser-based protections available while acknowledging these limitations.

---

# Acceptance Criteria

* Full-screen secure exam mode implemented.
* Browser/tab switching is detected.
* Window minimize is detected.
* Full-screen exit is detected.
* Refresh attempts are logged.
* Developer tool attempts are logged where possible.
* Right-click and clipboard actions are disabled.
* Every violation increments the cheating counter.
* Configurable maximum cheating attempts (default: 3).
* Exceeding the limit automatically submits the exam.
* Administrators receive real-time notifications.
* Every violation is permanently recorded.
* The exam remains secure after page refresh or temporary network interruption.
* All grading, timing, enrollment, and security validation are enforced server-side.
