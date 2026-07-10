import type { Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { moduleService } from '@/services/module.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { HttpStatus } from '@/constants';
import { ApiError } from '@/utils/ApiError';
import {
  moduleCreateSchema,
  moduleUpdateSchema,
  reorderSchema,
  quizConfigSchema,
  questionSchema,
  questionUpdateSchema,
} from '@/validations/module.validation';

function parse<T>(schema: ZodSchema<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', r.error.flatten().fieldErrors);
  return r.data;
}

export const moduleController = {
  async list(req: Request, res: Response) {
    const data = await moduleService.listByCourse(req.params.courseId);
    return sendSuccess(res, data, 'Modules');
  },

  async create(req: Request, res: Response) {
    const data = parse(moduleCreateSchema, req.body);
    const mod = await moduleService.create(req.params.courseId, data);
    return sendSuccess(res, mod, 'Module created', HttpStatus.CREATED);
  },

  async get(req: Request, res: Response) {
    const data = await moduleService.getById(req.params.id);
    return sendSuccess(res, data, 'Module');
  },

  async update(req: Request, res: Response) {
    const data = parse(moduleUpdateSchema, req.body);
    const mod = await moduleService.update(req.params.id, data);
    return sendSuccess(res, mod, 'Module updated');
  },

  async remove(req: Request, res: Response) {
    const data = await moduleService.remove(req.params.id);
    return sendSuccess(res, data, 'Module deleted');
  },

  async reorder(req: Request, res: Response) {
    const { orderedIds } = parse(reorderSchema, req.body);
    const data = await moduleService.reorder(req.params.courseId, orderedIds);
    return sendSuccess(res, data, 'Modules reordered');
  },

  async upsertQuiz(req: Request, res: Response) {
    const data = parse(quizConfigSchema, req.body);
    const quiz = await moduleService.upsertQuiz(req.params.id, data);
    return sendSuccess(res, quiz, 'Quiz saved');
  },

  async addQuestion(req: Request, res: Response) {
    const data = parse(questionSchema, req.body);
    const q = await moduleService.addQuestion(req.params.id, data);
    return sendSuccess(res, q, 'Question added', HttpStatus.CREATED);
  },

  async updateQuestion(req: Request, res: Response) {
    const data = parse(questionUpdateSchema, req.body);
    const q = await moduleService.updateQuestion(req.params.id, data);
    return sendSuccess(res, q, 'Question updated');
  },

  async removeQuestion(req: Request, res: Response) {
    const data = await moduleService.removeQuestion(req.params.id);
    return sendSuccess(res, data, 'Question deleted');
  },
};
