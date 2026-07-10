import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { notificationService } from '@/services/notification.service';
import { gamificationService } from '@/services/gamification.service';
import type { CorrectOption } from '@prisma/client';
import type { GamificationReward } from '@/services/gamification.service';

type ModuleStatus = 'locked' | 'in_progress' | 'completed';

async function assertEnrolled(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course.');
}

function isProgressComplete(p?: { videoCompleted: boolean; notesCompleted: boolean; quizPassed: boolean }) {
  return Boolean(p && p.videoCompleted && p.notesCompleted && p.quizPassed);
}

/**
 * Student learning flow. All unlock + grading logic runs here on the server;
 * clients never receive correct answers and cannot bypass module order.
 */
export const learningService = {
  /** Course learning view: modules with lock/progress status + overall %. */
  async getCourseLearn(userId: string, courseId: string) {
    await assertEnrolled(userId, courseId);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true },
    });
    if (!course) throw ApiError.notFound('Course not found');

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: { id: true, moduleNumber: true, title: true, description: true, estimatedDuration: true },
    });

    const progress = await prisma.studentModuleProgress.findMany({
      where: { userId, moduleId: { in: modules.map((m) => m.id) } },
    });
    const progressByModule = new Map(progress.map((p) => [p.moduleId, p]));

    let prevCompleted = true; // first module always unlocked
    let resumeModuleId: string | null = null;
    let completedCount = 0;

    const items = modules.map((m) => {
      const p = progressByModule.get(m.id);
      const complete = isProgressComplete(p);
      if (complete) completedCount += 1;
      const unlocked = prevCompleted;
      let status: ModuleStatus = 'locked';
      if (complete) status = 'completed';
      else if (unlocked) status = 'in_progress';

      if (unlocked && !complete && !resumeModuleId) resumeModuleId = m.id;
      prevCompleted = complete; // next module unlocks only if this one is complete

      return {
        id: m.id,
        moduleNumber: m.moduleNumber,
        title: m.title,
        description: m.description,
        estimatedDuration: m.estimatedDuration,
        status,
        unlocked,
        video: Boolean(p?.videoCompleted),
        notes: Boolean(p?.notesCompleted),
        quizPassed: Boolean(p?.quizPassed),
        quizScore: p?.quizScore ?? null,
      };
    });

    const total = modules.length;
    return {
      course,
      totalModules: total,
      completedModules: completedCount,
      lockedModules: items.filter((i) => i.status === 'locked').length,
      percentage: total ? Math.round((completedCount / total) * 100) : 0,
      resumeModuleId: resumeModuleId ?? (items[0]?.id ?? null),
      modules: items,
    };
  },

  /** Verify a module is enrolled + unlocked, returning module + course. */
  async ensureModuleAccess(userId: string, moduleId: string) {
    const mod = await prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!mod) throw ApiError.notFound('Module not found');
    await assertEnrolled(userId, mod.courseId);

    const modules = await prisma.courseModule.findMany({
      where: { courseId: mod.courseId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    const index = modules.findIndex((m) => m.id === moduleId);
    if (index > 0) {
      const prevId = modules[index - 1].id;
      const prev = await prisma.studentModuleProgress.findUnique({
        where: { userId_moduleId: { userId, moduleId: prevId } },
      });
      if (!isProgressComplete(prev ?? undefined)) {
        throw ApiError.forbidden('Complete the previous module to unlock this one.');
      }
    }
    return mod;
  },

  /** Module detail for the student — quiz questions WITHOUT correct answers. */
  async getModule(userId: string, moduleId: string) {
    await this.ensureModuleAccess(userId, moduleId);
    const mod = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!mod) throw ApiError.notFound('Module not found');

    const progress = await prisma.studentModuleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: { lastViewedAt: new Date() },
      create: { userId, moduleId, lastViewedAt: new Date() },
    });

    const quiz = mod.quiz
      ? {
          id: mod.quiz.id,
          passingMarks: mod.quiz.passingMarks,
          totalQuestions: mod.quiz.questions.length,
          attemptLimit: mod.quiz.attemptLimit,
          questions: mod.quiz.questions.map((q) => ({
            id: q.id,
            question: q.question,
            options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
          })),
        }
      : null;

    return {
      id: mod.id,
      courseId: mod.courseId,
      course: mod.course,
      moduleNumber: mod.moduleNumber,
      title: mod.title,
      description: mod.description,
      youtubeUrl: mod.youtubeUrl,
      youtubeIframe: mod.youtubeIframe,
      notes: mod.notes,
      attachmentUrl: mod.attachmentUrl,
      estimatedDuration: mod.estimatedDuration,
      quiz,
      progress: {
        videoCompleted: progress.videoCompleted,
        notesCompleted: progress.notesCompleted,
        quizAttempted: progress.quizAttempted,
        quizScore: progress.quizScore,
        quizPassed: progress.quizPassed,
        completed: progress.completed,
      },
    };
  },

  async markVideo(userId: string, moduleId: string) {
    await this.ensureModuleAccess(userId, moduleId);
    const { progress, gamification } = await this.updateProgress(userId, moduleId, { videoCompleted: true });
    return { progress, gamification };
  },

  async markNotes(userId: string, moduleId: string) {
    await this.ensureModuleAccess(userId, moduleId);
    const { progress, gamification } = await this.updateProgress(userId, moduleId, { notesCompleted: true });
    return { progress, gamification };
  },

  /** Grade a quiz submission server-side and update progress. */
  async submitQuiz(userId: string, moduleId: string, answers: { questionId: string; selected: CorrectOption }[]) {
    await this.ensureModuleAccess(userId, moduleId);
    const quiz = await prisma.moduleQuiz.findUnique({
      where: { moduleId },
      include: { questions: true },
    });
    if (!quiz || quiz.questions.length === 0) throw ApiError.badRequest('This module has no quiz.');

    const answerMap = new Map(answers.map((a) => [a.questionId, a.selected]));
    let correctCount = 0;
    const review = quiz.questions.map((q) => {
      const selected = answerMap.get(q.id) ?? null;
      const isCorrect = selected === q.correctOption;
      if (isCorrect) correctCount += 1;
      return {
        questionId: q.id,
        selected,
        correctOption: q.correctOption,
        isCorrect,
        explanation: q.explanation ?? null,
      };
    });

    const passed = correctCount >= quiz.passingMarks;
    const { gamification } = await this.updateProgress(userId, moduleId, {
      quizAttempted: true,
      quizScore: correctCount,
      quizPassed: passed,
    });

    return {
      score: correctCount,
      total: quiz.questions.length,
      passingMarks: quiz.passingMarks,
      passed,
      review,
      gamification,
    };
  },

  /** Recompute completion (video && notes && quizPassed) and persist. */
  async updateProgress(userId: string, moduleId: string, patch: Record<string, unknown>) {
    const before = await prisma.studentModuleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
    const beforeState = {
      videoCompleted: before?.videoCompleted ?? false,
      notesCompleted: before?.notesCompleted ?? false,
      quizPassed: before?.quizPassed ?? false,
      completed: before?.completed ?? false,
    };

    const current = await prisma.studentModuleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: patch,
      create: { userId, moduleId, ...patch },
    });
    const completed = current.videoCompleted && current.notesCompleted && current.quizPassed;

    let updated = current;
    if (completed !== current.completed) {
      updated = await prisma.studentModuleProgress.update({
        where: { userId_moduleId: { userId, moduleId } },
        data: { completed, completedAt: completed ? new Date() : null },
      });
      if (completed) {
        const mod = await prisma.courseModule.findUnique({
          where: { id: moduleId },
          select: { title: true, courseId: true, course: { select: { title: true } } },
        });
        if (mod) {
          notificationService.emit(
            userId,
            'Module completed 🎉',
            `You completed "${mod.title}" in ${mod.course.title}. The next module is unlocked.`,
          );
        }
      }
    }

    const mod = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      select: { title: true, courseId: true },
    });

    let gamification: GamificationReward = {
      xpEarned: 0,
      totalXp: 0,
      level: { name: 'Recruit', tier: 1, min: 0, next: 100, icon: 'shield', progressToNext: 0 },
      levelUp: false,
      newAchievements: [],
    };
    if (mod) {
      gamification = await gamificationService.onProgressChange(
        userId,
        beforeState,
        {
          videoCompleted: updated.videoCompleted,
          notesCompleted: updated.notesCompleted,
          quizPassed: updated.quizPassed,
          completed: updated.completed,
        },
        moduleId,
        mod.title,
        mod.courseId,
      );
    }

    return { progress: updated, gamification };
  },
};
