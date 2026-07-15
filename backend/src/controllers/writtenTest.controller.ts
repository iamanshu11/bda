import type { Response } from 'express';
import { z } from 'zod';
import { writtenTestService } from '@/services/writtenTest.service';
import { paymentService } from '@/services/payment.service';
import { auditService } from '@/services/audit.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';
import type { AuthenticatedRequest } from '@/interfaces';

const answerSchema = z.object({
  questionId: z.string().min(1),
  selected: z.enum(['A', 'B', 'C', 'D']).nullable(),
});

const questionSchema = z.object({
  question: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().optional(),
  marks: z.coerce.number().positive().optional(),
  order: z.coerce.number().int().optional(),
});

const meta = (req: AuthenticatedRequest) => ({
  ip: req.ip,
  userAgent: req.get('user-agent') ?? undefined,
});

export const writtenTestController = {
  // Public
  async listPublic(_req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.listPublic();
    return sendSuccess(res, data, 'Written tests');
  },

  async getPublic(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.getPublicBySlug(req.params.slug);
    return sendSuccess(res, data, 'Written test');
  },

  // Student
  async listMine(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.listForStudent(req.user!.userId);
    return sendSuccess(res, data, 'My tests');
  },

  async getMine(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.getForStudent(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Test detail');
  },

  async createOrder(req: AuthenticatedRequest, res: Response) {
    const data = await paymentService.createTestOrder(req.user!.userId, req.params.id, req.body?.couponCode);
    return sendSuccess(res, data, data.free ? 'Enrolled (free test)' : 'Order created', HttpStatus.CREATED);
  },

  async start(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.startAttempt(req.user!.userId, req.params.id, meta(req));
    return sendSuccess(res, data, data.resumed ? 'Attempt resumed' : 'Attempt started');
  },

  async heartbeat(req: AuthenticatedRequest, res: Response) {
    const parsed = z
      .object({
        sessionToken: z.string().min(1),
        currentQuestionIndex: z.number().int().optional(),
        answers: z.array(answerSchema).optional(),
        online: z.boolean().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest('Invalid heartbeat payload');
    const data = await writtenTestService.heartbeat(req.user!.userId, req.params.id, parsed.data);
    return sendSuccess(res, data, 'Heartbeat');
  },

  async saveAnswers(req: AuthenticatedRequest, res: Response) {
    const parsed = z
      .object({ sessionToken: z.string().min(1), answers: z.array(answerSchema) })
      .safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest('Invalid answers payload');
    const data = await writtenTestService.saveAnswers(
      req.user!.userId,
      req.params.id,
      parsed.data.sessionToken,
      parsed.data.answers,
    );
    return sendSuccess(res, data, 'Answers saved');
  },

  async violation(req: AuthenticatedRequest, res: Response) {
    const parsed = z
      .object({
        sessionToken: z.string().min(1),
        type: z.enum([
          'WINDOW_MINIMIZED',
          'TAB_HIDDEN',
          'WINDOW_BLUR',
          'FULLSCREEN_EXIT',
          'PAGE_REFRESH',
          'DEVTOOLS',
          'CLIPBOARD',
          'RIGHT_CLICK',
          'SHORTCUT',
          'MULTI_TAB',
          'MULTI_DEVICE',
          'OFFLINE',
        ]),
        browser: z.string().optional(),
        os: z.string().optional(),
        device: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest('Invalid violation payload');
    const data = await writtenTestService.recordViolation(
      req.user!.userId,
      req.params.id,
      parsed.data,
      meta(req),
    );
    return sendSuccess(res, data, data.autoSubmitted ? 'Exam auto-submitted' : 'Violation recorded');
  },

  async submit(req: AuthenticatedRequest, res: Response) {
    const parsed = z
      .object({
        sessionToken: z.string().min(1),
        answers: z.array(answerSchema),
        autoSubmitReason: z.string().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest('Invalid submit payload');
    const data = await writtenTestService.submit(req.user!.userId, req.params.id, parsed.data);
    return sendSuccess(res, data, 'Submitted');
  },

  async result(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.getResult(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Result');
  },

  // Admin
  async listQuestions(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.listQuestions(req.params.id);
    return sendSuccess(res, data, 'Questions');
  },

  async addQuestion(req: AuthenticatedRequest, res: Response) {
    const parsed = questionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten());
    }
    const data = await writtenTestService.addQuestion(req.params.id, parsed.data);
    return sendSuccess(res, data, 'Question added', HttpStatus.CREATED);
  },

  async updateQuestion(req: AuthenticatedRequest, res: Response) {
    const parsed = questionSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten());
    }
    const data = await writtenTestService.updateQuestion(req.params.id, parsed.data);
    return sendSuccess(res, data, 'Question updated');
  },

  async deleteQuestion(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.deleteQuestion(req.params.id);
    return sendSuccess(res, data, 'Question deleted');
  },

  async results(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.results(req.params.id);
    return sendSuccess(res, data, 'Results');
  },

  async monitoring(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.examMonitoring({
      testId: typeof req.query.testId === 'string' ? req.query.testId : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      minCheats: req.query.minCheats ? Number(req.query.minCheats) : undefined,
    });
    return sendSuccess(res, data, 'Exam monitoring');
  },

  async attemptViolations(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.attemptViolations(req.params.id);
    return sendSuccess(res, data, 'Violations');
  },

  async forceSubmit(req: AuthenticatedRequest, res: Response) {
    const data = await writtenTestService.forceSubmit(req.params.id);
    void auditService.record({
      actorId: req.user?.userId ?? null,
      actorRole: req.user?.role ?? null,
      ip: req.ip ?? null,
      action: 'FORCE_SUBMIT',
      targetType: 'WrittenTestAttempt',
      targetId: req.params.id,
      summary: 'Admin force-submitted an exam attempt',
    });
    return sendSuccess(res, data, 'Force submitted');
  },
};
