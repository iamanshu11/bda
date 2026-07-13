import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import type { CorrectOption } from '@prisma/client';

/** Admin-side management of course modules, quizzes and questions. */
export const moduleService = {
  async listByCourse(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found');
    return prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { quiz: { include: { _count: { select: { questions: true } } } } },
    });
  },

  async create(
    courseId: string,
    data: {
      title: string;
      description?: string;
      moduleNumber?: number;
      youtubeUrl?: string;
      youtubeIframe?: string;
      notes?: string;
      attachmentUrl?: string;
      estimatedDuration?: string;
      isPreview?: boolean;
    },
  ) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found');

    const last = await prisma.courseModule.findFirst({
      where: { courseId },
      orderBy: { moduleNumber: 'desc' },
    });
    const moduleNumber = data.moduleNumber ?? (last ? last.moduleNumber + 1 : 1);

    return prisma.courseModule.create({
      data: { ...data, moduleNumber, order: moduleNumber, courseId },
    });
  },

  async getById(id: string) {
    const mod = await prisma.courseModule.findUnique({
      where: { id },
      include: {
        quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
        course: { select: { id: true, title: true } },
      },
    });
    if (!mod) throw ApiError.notFound('Module not found');
    return mod;
  },

  async update(id: string, data: Record<string, unknown>) {
    await this.getById(id);
    return prisma.courseModule.update({ where: { id }, data });
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.courseModule.delete({ where: { id } });
    return { id };
  },

  async reorder(courseId: string, orderedIds: string[]) {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.courseModule.update({ where: { id }, data: { order: index + 1, moduleNumber: index + 1 } }),
      ),
    );
    return this.listByCourse(courseId);
  },

  // ---- Quiz config ----
  async upsertQuiz(
    moduleId: string,
    data: {
      passingMarks?: number;
      totalQuestions?: number;
      shuffleQuestions?: boolean;
      shuffleOptions?: boolean;
      attemptLimit?: number | null;
    },
  ) {
    await this.getById(moduleId);
    return prisma.moduleQuiz.upsert({
      where: { moduleId },
      update: data,
      create: { moduleId, ...data },
    });
  },

  async ensureQuiz(moduleId: string) {
    const mod = await prisma.courseModule.findUnique({ where: { id: moduleId }, include: { quiz: true } });
    if (!mod) throw ApiError.notFound('Module not found');
    if (mod.quiz) return mod.quiz;
    return prisma.moduleQuiz.create({ data: { moduleId } });
  },

  // ---- Questions ----
  async addQuestion(
    moduleId: string,
    data: {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: CorrectOption;
      explanation?: string;
    },
  ) {
    const quiz = await this.ensureQuiz(moduleId);
    const count = await prisma.moduleQuestion.count({ where: { quizId: quiz.id } });
    return prisma.moduleQuestion.create({ data: { ...data, quizId: quiz.id, order: count + 1 } });
  },

  async updateQuestion(id: string, data: Record<string, unknown>) {
    const q = await prisma.moduleQuestion.findUnique({ where: { id } });
    if (!q) throw ApiError.notFound('Question not found');
    return prisma.moduleQuestion.update({ where: { id }, data });
  },

  async removeQuestion(id: string) {
    const q = await prisma.moduleQuestion.findUnique({ where: { id } });
    if (!q) throw ApiError.notFound('Question not found');
    await prisma.moduleQuestion.delete({ where: { id } });
    return { id };
  },
};
