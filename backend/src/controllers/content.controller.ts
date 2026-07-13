import type { Request, Response } from 'express';
import { contentRepository } from '@/repositories/content.repository';
import { reviewService } from '@/services/review.service';
import { emailService } from '@/services/email.service';
import { emailTemplates } from '@/emails/templates';
import { sendSuccess, buildPaginationMeta } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';
import { getPagination } from '@/helpers/pagination';

export const contentController = {
  async listCourses(req: Request, res: Response) {
    const { page, limit, skip, take } = getPagination(req);
    const categorySlug = req.query.category as string | undefined;
    const [courses, total] = await contentRepository.listCourses({ skip, take, categorySlug });
    return sendSuccess(res, courses, 'Courses fetched.', HttpStatus.OK, buildPaginationMeta(page, limit, total));
  },

  async getCourse(req: Request, res: Response) {
    const course = await contentRepository.getCourseBySlug(req.params.slug);
    if (!course) throw ApiError.notFound('Course not found.');
    // Expose preview operations under a clear key + attach the rating summary.
    const { modules, ...rest } = course as typeof course & { modules: unknown[] };
    const ratings = await reviewService.publicForCourse(course.id);
    return sendSuccess(
      res,
      { ...rest, previewModules: modules, rating: { average: ratings.average, count: ratings.count } },
      'Course fetched.',
    );
  },

  async courseReviews(req: Request, res: Response) {
    const course = await contentRepository.getCourseBySlug(req.params.slug);
    if (!course) throw ApiError.notFound('Course not found.');
    const data = await reviewService.publicForCourse(course.id);
    return sendSuccess(res, data, 'Reviews fetched.');
  },

  async listCategories(_req: Request, res: Response) {
    const data = await contentRepository.listCategories();
    return sendSuccess(res, data, 'Categories fetched.');
  },

  async listFaculty(_req: Request, res: Response) {
    const data = await contentRepository.listFaculty();
    return sendSuccess(res, data, 'Faculty fetched.');
  },

  async getFaculty(req: Request, res: Response) {
    const faculty = await contentRepository.getFacultyBySlug(req.params.slug);
    if (!faculty) throw ApiError.notFound('Faculty member not found.');
    return sendSuccess(res, faculty, 'Faculty fetched.');
  },

  async listGallery(_req: Request, res: Response) {
    const data = await contentRepository.listGallery();
    return sendSuccess(res, data, 'Gallery fetched.');
  },

  async listResults(_req: Request, res: Response) {
    const [results, hallOfFame] = await Promise.all([
      contentRepository.listResults(),
      contentRepository.listHallOfFame(),
    ]);
    return sendSuccess(res, { results, hallOfFame }, 'Results fetched.');
  },

  async listTestimonials(_req: Request, res: Response) {
    const data = await contentRepository.listTestimonials();
    return sendSuccess(res, data, 'Testimonials fetched.');
  },

  async submitContact(req: Request, res: Response) {
    const message = await contentRepository.createContactMessage(req.body);
    // Fire-and-forget acknowledgement email
    void emailService
      .send(message.email, 'We received your message — Bokaro Defence Academy', emailTemplates.contactResponse(message.name, message.message))
      .catch(() => undefined);
    return sendSuccess(res, { id: message.id }, 'Your message has been received.', HttpStatus.CREATED);
  },
};
