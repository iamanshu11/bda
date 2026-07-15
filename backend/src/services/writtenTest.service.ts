import crypto from 'crypto';
import type { CorrectOption, ExamViolationType, Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { slugify } from '@/helpers/slug';
import { notificationService } from '@/services/notification.service';
import { RoleName } from '@/constants';
import {
  type AnswerRow,
  durationExpired,
  endsAt,
  gradeAnswers,
  isGenuineTakeover,
} from '@/utils/examRules';

// Re-export pure helpers so existing importers keep working.
export { durationExpired, endsAt, gradeAnswers, isGenuineTakeover };

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripQuestion(q: {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
  order: number;
  explanation?: string | null;
  correctOption?: CorrectOption;
}) {
  return {
    id: q.id,
    question: q.question,
    options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
    marks: q.marks,
    order: q.order,
  };
}

function answersRevealed(test: { answersRevealAt: Date | null }) {
  if (!test.answersRevealAt) return true;
  return new Date() >= test.answersRevealAt;
}

function inWindow(test: { availableFrom: Date; availableTo: Date }) {
  const now = new Date();
  return now >= test.availableFrom && now <= test.availableTo;
}

async function syncQuestionCount(testId: string) {
  const total = await prisma.writtenTestQuestion.count({ where: { testId } });
  await prisma.writtenTest.update({ where: { id: testId }, data: { totalQuestions: total } });
}

async function notifyAdmins(title: string, body: string) {
  const admins = await prisma.user.findMany({
    where: { role: { name: { in: [RoleName.ADMIN, RoleName.SUPER_ADMIN] } }, isActive: true },
    select: { id: true },
  });
  for (const a of admins) notificationService.emit(a.id, title, body);
}

async function finalizeAttempt(
  attemptId: string,
  opts: {
    answers?: AnswerRow[];
    autoSubmitted?: boolean;
    autoSubmitReason?: string | null;
    expire?: boolean;
  },
) {
  const attempt = await prisma.writtenTestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { include: { questions: true } },
    },
  });
  if (!attempt) throw ApiError.notFound('Attempt not found.');
  if (attempt.status !== 'IN_PROGRESS') {
    return attempt;
  }

  const saved = (opts.answers ?? (attempt.answers as AnswerRow[] | null) ?? []) as AnswerRow[];
  const graded = gradeAnswers(attempt.test.questions, saved, attempt.test.negativeMark);
  const reveal = answersRevealed(attempt.test);

  const updated = await prisma.writtenTestAttempt.update({
    where: { id: attemptId },
    data: {
      status: opts.expire ? 'EXPIRED' : 'SUBMITTED',
      submittedAt: new Date(),
      answers: saved as Prisma.InputJsonValue,
      score: graded.score,
      totalMarks: graded.totalMarks,
      correct: graded.correct,
      wrong: graded.wrong,
      autoSubmitted: opts.autoSubmitted ?? false,
      autoSubmitReason: opts.autoSubmitReason ?? null,
    },
  });

  return {
    attempt: updated,
    result: {
      score: graded.score,
      totalMarks: graded.totalMarks,
      correct: graded.correct,
      wrong: graded.wrong,
      passed:
        attempt.test.passingMarks == null ? null : graded.score >= attempt.test.passingMarks,
      review: reveal
        ? graded.review.map((r) => {
            const q = attempt.test.questions.find((x) => x.id === r.questionId);
            return { ...r, explanation: q?.explanation ?? null, question: q?.question };
          })
        : null,
      answersRevealAt: attempt.test.answersRevealAt,
      revealed: reveal,
    },
  };
}

export const writtenTestService = {
  // ---------- Public catalog ----------
  async listPublic() {
    const now = new Date();
    const tests = await prisma.writtenTest.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { availableFrom: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        price: true,
        durationMins: true,
        totalQuestions: true,
        marksPerQuestion: true,
        negativeMark: true,
        availableFrom: true,
        availableTo: true,
        answersRevealAt: true,
      },
    });
    return tests.map((t) => ({
      ...t,
      windowState:
        now < t.availableFrom ? 'upcoming' : now > t.availableTo ? 'closed' : 'open',
    }));
  },

  async getPublicBySlug(slug: string) {
    const t = await prisma.writtenTest.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        instructions: true,
        price: true,
        durationMins: true,
        totalQuestions: true,
        marksPerQuestion: true,
        passingMarks: true,
        negativeMark: true,
        availableFrom: true,
        availableTo: true,
        answersRevealAt: true,
        status: true,
        maxCheatingAttempts: true,
      },
    });
    if (!t || t.status !== 'PUBLISHED') throw ApiError.notFound('Test not found.');
    const now = new Date();
    return {
      ...t,
      windowState:
        now < t.availableFrom ? 'upcoming' : now > t.availableTo ? 'closed' : 'open',
    };
  },

  // ---------- Admin questions ----------
  async addQuestion(
    testId: string,
    data: {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: CorrectOption;
      explanation?: string;
      marks?: number;
      order?: number;
    },
  ) {
    const test = await prisma.writtenTest.findUnique({ where: { id: testId } });
    if (!test) throw ApiError.notFound('Test not found.');
    const count = await prisma.writtenTestQuestion.count({ where: { testId } });
    const q = await prisma.writtenTestQuestion.create({
      data: {
        testId,
        question: data.question,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        explanation: data.explanation,
        marks: data.marks ?? test.marksPerQuestion,
        order: data.order ?? count + 1,
      },
    });
    await syncQuestionCount(testId);
    return q;
  },

  async updateQuestion(id: string, data: Record<string, unknown>) {
    const existing = await prisma.writtenTestQuestion.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Question not found.');
    // Protect the answer key: once students have submitted/expired attempts on
    // this test, the correct answer (and marks) may no longer be changed, or
    // their scores would silently diverge. Typo fixes to the question text or
    // explanation remain allowed.
    const changesGrading =
      (data.correctOption !== undefined && data.correctOption !== existing.correctOption) ||
      (data.marks !== undefined && data.marks !== existing.marks);
    if (changesGrading) {
      const attempts = await prisma.writtenTestAttempt.count({
        where: { testId: existing.testId, status: { in: ['SUBMITTED', 'EXPIRED'] } },
      });
      if (attempts > 0) {
        throw ApiError.conflict(
          'Cannot change the answer key or marks after students have attempted this test. Clone the test to make changes.',
        );
      }
    }
    return prisma.writtenTestQuestion.update({ where: { id }, data });
  },

  async deleteQuestion(id: string) {
    const existing = await prisma.writtenTestQuestion.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Question not found.');
    const attempts = await prisma.writtenTestAttempt.count({
      where: { testId: existing.testId, status: { in: ['SUBMITTED', 'EXPIRED'] } },
    });
    if (attempts > 0) {
      throw ApiError.conflict(
        'Cannot delete a question after students have attempted this test. Clone the test to make changes.',
      );
    }
    const q = await prisma.writtenTestQuestion.delete({ where: { id } });
    await syncQuestionCount(q.testId);
    return { deleted: true };
  },

  async listQuestions(testId: string) {
    return prisma.writtenTestQuestion.findMany({
      where: { testId },
      orderBy: { order: 'asc' },
    });
  },

  async publishCheck(testId: string) {
    const test = await prisma.writtenTest.findUnique({
      where: { id: testId },
      include: { _count: { select: { questions: true } } },
    });
    if (!test) throw ApiError.notFound('Test not found.');
    if (test.availableFrom >= test.availableTo) {
      throw ApiError.badRequest('availableFrom must be before availableTo.');
    }
    if (test._count.questions < 1) throw ApiError.badRequest('Add at least one question before publishing.');
    return true;
  },

  async results(testId: string) {
    const attempts = await prisma.writtenTestAttempt.findMany({
      where: { testId, status: { in: ['SUBMITTED', 'EXPIRED'] } },
      orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }],
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return attempts.map((a, i) => ({
      rank: i + 1,
      userId: a.userId,
      name: a.user.name,
      email: a.user.email,
      score: a.score,
      totalMarks: a.totalMarks,
      correct: a.correct,
      wrong: a.wrong,
      cheatingCount: a.cheatingCount,
      autoSubmitted: a.autoSubmitted,
      submittedAt: a.submittedAt,
    }));
  },

  // ---------- Student enrollment helpers ----------
  async enroll(userId: string, testId: string, paymentId?: string | null) {
    return prisma.writtenTestEnrollment.upsert({
      where: { userId_testId: { userId, testId } },
      update: paymentId ? { paymentId } : {},
      create: { userId, testId, paymentId: paymentId ?? null },
    });
  },

  async listForStudent(userId: string) {
    const [enrolled, catalog] = await Promise.all([
      prisma.writtenTestEnrollment.findMany({
        where: { userId },
        include: {
          test: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              durationMins: true,
              totalQuestions: true,
              availableFrom: true,
              availableTo: true,
              status: true,
            },
          },
        },
      }),
      this.listPublic(),
    ]);
    const attempts = await prisma.writtenTestAttempt.findMany({
      where: { userId },
      select: { testId: true, status: true, score: true, cheatingCount: true },
    });
    const attemptByTest = new Map(attempts.map((a) => [a.testId, a]));
    return {
      enrolled: enrolled.map((e) => ({
        ...e.test,
        enrolledAt: e.createdAt,
        attempt: attemptByTest.get(e.testId) ?? null,
      })),
      available: catalog,
    };
  },

  async getForStudent(userId: string, testId: string) {
    const test = await prisma.writtenTest.findUnique({ where: { id: testId } });
    if (!test || test.status !== 'PUBLISHED') throw ApiError.notFound('Test not found.');
    const enrollment = await prisma.writtenTestEnrollment.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    const attempt = await prisma.writtenTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    return {
      test: {
        id: test.id,
        title: test.title,
        slug: test.slug,
        description: test.description,
        instructions: test.instructions,
        price: test.price,
        durationMins: test.durationMins,
        totalQuestions: test.totalQuestions,
        marksPerQuestion: test.marksPerQuestion,
        passingMarks: test.passingMarks,
        negativeMark: test.negativeMark,
        availableFrom: test.availableFrom,
        availableTo: test.availableTo,
        answersRevealAt: test.answersRevealAt,
        maxCheatingAttempts: test.maxCheatingAttempts,
        offlineAutoSubmitMins: test.offlineAutoSubmitMins,
        windowOpen: inWindow(test),
      },
      enrolled: Boolean(enrollment),
      attempt: attempt
        ? {
            id: attempt.id,
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            score: attempt.score,
            cheatingCount: attempt.cheatingCount,
            endsAt: endsAt(attempt, test.durationMins),
          }
        : null,
    };
  },

  // ---------- Secure attempt lifecycle ----------
  async startAttempt(
    userId: string,
    testId: string,
    meta: { ip?: string; userAgent?: string },
  ) {
    const test = await prisma.writtenTest.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!test || test.status !== 'PUBLISHED') throw ApiError.notFound('Test not found.');
    if (!inWindow(test)) throw ApiError.forbidden('This test is outside its availability window.');

    const enrollment = await prisma.writtenTestEnrollment.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    if (!enrollment) throw ApiError.forbidden('You must purchase this test before attempting it.');

    const existing = await prisma.writtenTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
    });

    const sessionToken = crypto.randomBytes(24).toString('hex');

    if (existing) {
      if (existing.status !== 'IN_PROGRESS') {
        throw ApiError.conflict('You have already completed this test.');
      }
      // Resume: rotate session. Only flag MULTI_DEVICE for a GENUINE takeover —
      // i.e. the previous session was recently active (heartbeat within the last
      // ~25s). A rapid re-start (page re-mount, React StrictMode double-invoke,
      // quick refresh) is the same person resuming and must NOT be a violation.
      const lastBeat = existing.lastHeartbeatAt ?? existing.startedAt;
      const genuineTakeover = isGenuineTakeover(new Date(lastBeat), Boolean(existing.sessionToken));
      if (genuineTakeover) {
        await prisma.examViolation.create({
          data: {
            attemptId: existing.id,
            userId,
            testId,
            type: 'MULTI_DEVICE',
            ipAddress: meta.ip,
            userAgent: meta.userAgent,
          },
        });
        await prisma.writtenTestAttempt.update({
          where: { id: existing.id },
          data: { cheatingCount: { increment: 1 } },
        });
        void notifyAdmins(
          'Exam security alert',
          `Student resumed attempt on another device/tab for "${test.title}".`,
        );
      }

      const updated = await prisma.writtenTestAttempt.update({
        where: { id: existing.id },
        data: {
          sessionToken,
          lastHeartbeatAt: new Date(),
          clientIp: meta.ip,
          userAgent: meta.userAgent,
        },
      });

      if (durationExpired(updated, test.durationMins)) {
        await finalizeAttempt(updated.id, {
          expire: true,
          autoSubmitted: true,
          autoSubmitReason: 'TIME_EXPIRED',
        });
        throw ApiError.forbidden('Time expired. Your attempt was auto-submitted.');
      }

      const refreshed = await prisma.writtenTestAttempt.findUniqueOrThrow({ where: { id: updated.id } });
      let questions = test.questions.map(stripQuestion);
      if (test.shuffle) questions = shuffleArray(questions);

      return {
        attemptId: refreshed.id,
        sessionToken,
        startedAt: refreshed.startedAt,
        endsAt: endsAt(refreshed, test.durationMins),
        cheatingCount: refreshed.cheatingCount,
        maxCheatingAttempts: test.maxCheatingAttempts,
        offlineAutoSubmitMins: test.offlineAutoSubmitMins,
        answers: (refreshed.answers as AnswerRow[] | null) ?? [],
        currentQuestionIndex: refreshed.currentQuestionIndex ?? 0,
        questions,
        test: {
          id: test.id,
          title: test.title,
          instructions: test.instructions,
          durationMins: test.durationMins,
          totalQuestions: test.totalQuestions,
          marksPerQuestion: test.marksPerQuestion,
          negativeMark: test.negativeMark,
          passingMarks: test.passingMarks,
        },
        resumed: true,
      };
    }

    const attempt = await prisma.writtenTestAttempt.create({
      data: {
        userId,
        testId,
        sessionToken,
        lastHeartbeatAt: new Date(),
        clientIp: meta.ip,
        userAgent: meta.userAgent,
        answers: [],
      },
    });

    let questions = test.questions.map(stripQuestion);
    if (test.shuffle) questions = shuffleArray(questions);

    return {
      attemptId: attempt.id,
      sessionToken,
      startedAt: attempt.startedAt,
      endsAt: endsAt(attempt, test.durationMins),
      cheatingCount: 0,
      maxCheatingAttempts: test.maxCheatingAttempts,
      offlineAutoSubmitMins: test.offlineAutoSubmitMins,
      answers: [],
      currentQuestionIndex: 0,
      questions,
      test: {
        id: test.id,
        title: test.title,
        instructions: test.instructions,
        durationMins: test.durationMins,
        totalQuestions: test.totalQuestions,
        marksPerQuestion: test.marksPerQuestion,
        negativeMark: test.negativeMark,
        passingMarks: test.passingMarks,
      },
      resumed: false,
    };
  },

  async heartbeat(
    userId: string,
    testId: string,
    input: {
      sessionToken: string;
      currentQuestionIndex?: number;
      answers?: AnswerRow[];
      online?: boolean;
    },
  ) {
    const attempt = await prisma.writtenTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
      include: { test: true },
    });
    if (!attempt || attempt.status !== 'IN_PROGRESS') throw ApiError.badRequest('No active attempt.');
    if (attempt.sessionToken !== input.sessionToken) {
      throw ApiError.forbidden('Session invalidated. Another tab or device took over this exam.');
    }

    if (durationExpired(attempt, attempt.test.durationMins)) {
      const result = await finalizeAttempt(attempt.id, {
        answers: input.answers,
        expire: true,
        autoSubmitted: true,
        autoSubmitReason: 'TIME_EXPIRED',
      });
      return { expired: true, ...result };
    }

    // Offline auto-submit via missed heartbeats
    const offlineMins = attempt.test.offlineAutoSubmitMins ?? 5;
    if (
      attempt.lastHeartbeatAt &&
      offlineMins > 0 &&
      Date.now() - attempt.lastHeartbeatAt.getTime() > offlineMins * 60_000 &&
      input.online === false
    ) {
      const result = await finalizeAttempt(attempt.id, {
        answers: input.answers,
        autoSubmitted: true,
        autoSubmitReason: 'OFFLINE_TIMEOUT',
      });
      return { expired: true, ...result };
    }

    await prisma.writtenTestAttempt.update({
      where: { id: attempt.id },
      data: {
        lastHeartbeatAt: new Date(),
        ...(input.currentQuestionIndex != null
          ? { currentQuestionIndex: input.currentQuestionIndex }
          : {}),
        ...(input.answers ? { answers: input.answers as Prisma.InputJsonValue } : {}),
      },
    });

    return {
      ok: true,
      cheatingCount: attempt.cheatingCount,
      maxCheatingAttempts: attempt.test.maxCheatingAttempts,
      endsAt: endsAt(attempt, attempt.test.durationMins),
    };
  },

  async saveAnswers(userId: string, testId: string, sessionToken: string, answers: AnswerRow[]) {
    const attempt = await prisma.writtenTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    if (!attempt || attempt.status !== 'IN_PROGRESS') throw ApiError.badRequest('No active attempt.');
    if (attempt.sessionToken !== sessionToken) throw ApiError.forbidden('Invalid exam session.');
    await prisma.writtenTestAttempt.update({
      where: { id: attempt.id },
      data: { answers: answers as Prisma.InputJsonValue, lastHeartbeatAt: new Date() },
    });
    return { saved: true };
  },

  async recordViolation(
    userId: string,
    testId: string,
    input: {
      sessionToken: string;
      type: ExamViolationType;
      browser?: string;
      os?: string;
      device?: string;
      metadata?: Record<string, unknown>;
    },
    meta: { ip?: string; userAgent?: string },
  ) {
    const attempt = await prisma.writtenTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
      include: { test: true, user: { select: { name: true } } },
    });
    if (!attempt || attempt.status !== 'IN_PROGRESS') throw ApiError.badRequest('No active attempt.');
    if (attempt.sessionToken !== input.sessionToken) throw ApiError.forbidden('Invalid exam session.');

    await prisma.examViolation.create({
      data: {
        attemptId: attempt.id,
        userId,
        testId,
        type: input.type,
        browser: input.browser,
        os: input.os,
        device: input.device,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    const updated = await prisma.writtenTestAttempt.update({
      where: { id: attempt.id },
      data: { cheatingCount: { increment: 1 } },
    });

    void notifyAdmins(
      'Exam cheating alert',
      `Student: ${attempt.user.name}\nTest: ${attempt.test.title}\nViolation: ${input.type}\nAttempt: ${updated.cheatingCount}/${attempt.test.maxCheatingAttempts}\nIP: ${meta.ip ?? 'n/a'}`,
    );

    if (updated.cheatingCount >= attempt.test.maxCheatingAttempts) {
      const finalized = await finalizeAttempt(attempt.id, {
        autoSubmitted: true,
        autoSubmitReason: 'CHEAT_LIMIT',
      });
      return {
        cheatingCount: updated.cheatingCount,
        maxCheatingAttempts: attempt.test.maxCheatingAttempts,
        autoSubmitted: true,
        ...finalized,
      };
    }

    return {
      cheatingCount: updated.cheatingCount,
      maxCheatingAttempts: attempt.test.maxCheatingAttempts,
      autoSubmitted: false,
      warning: `Warning: This has been recorded as Cheating Attempt ${updated.cheatingCount} of ${attempt.test.maxCheatingAttempts}.`,
    };
  },

  async submit(
    userId: string,
    testId: string,
    input: {
      sessionToken: string;
      answers: AnswerRow[];
      autoSubmitReason?: string;
    },
  ) {
    const attempt = await prisma.writtenTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
      include: { test: true },
    });
    if (!attempt) throw ApiError.notFound('Attempt not found.');
    if (attempt.status !== 'IN_PROGRESS') {
      return this.getResult(userId, testId);
    }
    if (attempt.sessionToken !== input.sessionToken) throw ApiError.forbidden('Invalid exam session.');

    const expired = durationExpired(attempt, attempt.test.durationMins);
    return finalizeAttempt(attempt.id, {
      answers: input.answers,
      expire: expired,
      autoSubmitted: Boolean(input.autoSubmitReason) || expired,
      autoSubmitReason: input.autoSubmitReason ?? (expired ? 'TIME_EXPIRED' : null),
    });
  },

  async getResult(userId: string, testId: string) {
    const attempt = await prisma.writtenTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
      include: { test: { include: { questions: { orderBy: { order: 'asc' } } } } },
    });
    if (!attempt) throw ApiError.notFound('No attempt found.');
    if (attempt.status === 'IN_PROGRESS') throw ApiError.badRequest('Test not submitted yet.');

    const reveal = answersRevealed(attempt.test);
    const answers = (attempt.answers as AnswerRow[] | null) ?? [];
    const graded = gradeAnswers(attempt.test.questions, answers, attempt.test.negativeMark);

    return {
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      correct: attempt.correct,
      wrong: attempt.wrong,
      passed:
        attempt.test.passingMarks == null
          ? null
          : (attempt.score ?? 0) >= attempt.test.passingMarks,
      cheatingCount: attempt.cheatingCount,
      autoSubmitted: attempt.autoSubmitted,
      autoSubmitReason: attempt.autoSubmitReason,
      submittedAt: attempt.submittedAt,
      answersRevealAt: attempt.test.answersRevealAt,
      revealed: reveal,
      review: reveal
        ? graded.review.map((r) => {
            const q = attempt.test.questions.find((x) => x.id === r.questionId);
            return {
              ...r,
              explanation: q?.explanation ?? null,
              question: q?.question,
              options: q
                ? { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }
                : null,
            };
          })
        : null,
    };
  },

  async forceSubmit(attemptId: string) {
    return finalizeAttempt(attemptId, {
      autoSubmitted: true,
      autoSubmitReason: 'ADMIN_FORCE',
    });
  },

  async examMonitoring(filters: {
    testId?: string;
    status?: string;
    minCheats?: number;
  }) {
    const attempts = await prisma.writtenTestAttempt.findMany({
      where: {
        ...(filters.testId ? { testId: filters.testId } : {}),
        ...(filters.status ? { status: filters.status as 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' } : { status: 'IN_PROGRESS' }),
        ...(filters.minCheats != null ? { cheatingCount: { gte: filters.minCheats } } : {}),
      },
      orderBy: { startedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        test: {
          select: {
            id: true,
            title: true,
            durationMins: true,
            maxCheatingAttempts: true,
          },
        },
        violations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      take: 100,
    });

    return attempts.map((a) => ({
      id: a.id,
      status: a.status,
      cheatingCount: a.cheatingCount,
      maxCheatingAttempts: a.test.maxCheatingAttempts,
      currentQuestionIndex: a.currentQuestionIndex,
      lastHeartbeatAt: a.lastHeartbeatAt,
      startedAt: a.startedAt,
      endsAt: endsAt(a, a.test.durationMins),
      clientIp: a.clientIp,
      userAgent: a.userAgent,
      online:
        a.lastHeartbeatAt != null &&
        Date.now() - a.lastHeartbeatAt.getTime() < 30_000,
      user: a.user,
      test: a.test,
      recentViolations: a.violations,
    }));
  },

  async attemptViolations(attemptId: string) {
    return prisma.examViolation.findMany({
      where: { attemptId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Used by admin CRUD transform before publish. */
  async beforePublish(data: Record<string, unknown>, id?: string) {
    if (data.status === 'PUBLISHED' && id) await this.publishCheck(id);
    if (!data.slug && data.title) data.slug = slugify(String(data.title));
    return data;
  },
};
