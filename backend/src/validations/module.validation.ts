import { z } from 'zod';

const optional = z.string().trim().optional();

export const moduleCreateSchema = z.object({
  title: z.string().min(2),
  description: optional,
  moduleNumber: z.coerce.number().int().positive().optional(),
  youtubeUrl: optional,
  youtubeIframe: optional,
  notes: optional,
  attachmentUrl: optional,
  estimatedDuration: optional,
  isPreview: z.boolean().optional(),
});

export const moduleUpdateSchema = moduleCreateSchema.partial();

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const quizConfigSchema = z.object({
  passingMarks: z.coerce.number().int().min(1).optional(),
  totalQuestions: z.coerce.number().int().min(1).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  attemptLimit: z.coerce.number().int().min(1).nullable().optional(),
});

export const questionSchema = z.object({
  question: z.string().min(2),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: optional,
});

export const questionUpdateSchema = questionSchema.partial();
