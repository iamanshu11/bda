import type { Response } from 'express';
import { z } from 'zod';
import { studentService } from '@/services/student.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { HttpStatus } from '@/constants';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/interfaces';

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(7).max(15).optional(),
  avatarUrl: z.string().url().optional(),
  state: z.string().min(2).max(50).optional(),
  academyId: z.string().uuid().optional().nullable(),
});

const enrollSchema = z.object({ courseId: z.string().min(1) });

export const studentController = {
  async dashboard(req: AuthenticatedRequest, res: Response) {
    const data = await studentService.dashboard(req.user!.userId);
    return sendSuccess(res, data, 'Student dashboard');
  },

  async myCourses(req: AuthenticatedRequest, res: Response) {
    const data = await studentService.myCourses(req.user!.userId);
    return sendSuccess(res, data, 'My courses');
  },

  async enroll(req: AuthenticatedRequest, res: Response) {
    const parsed = enrollSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest('courseId is required');
    const data = await studentService.enroll(req.user!.userId, parsed.data.courseId);
    return sendSuccess(res, data, 'Enrolled successfully', HttpStatus.CREATED);
  },

  async getProfile(req: AuthenticatedRequest, res: Response) {
    const data = await studentService.getProfile(req.user!.userId);
    return sendSuccess(res, data, 'Profile');
  },

  async listAcademies(_req: AuthenticatedRequest, res: Response) {
    const data = await studentService.listAcademies();
    return sendSuccess(res, data, 'Academies');
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten().fieldErrors);
    }
    const data = await studentService.updateProfile(req.user!.userId, parsed.data);
    return sendSuccess(res, data, 'Profile updated');
  },
};
