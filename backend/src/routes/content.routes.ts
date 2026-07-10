import { Router } from 'express';
import { contentController } from '@/controllers/content.controller';
import { contactValidation } from '@/validations/contact.validation';
import { validate } from '@/middleware/validate';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Public, read-only content routes consumed by the frontend pages
 * (Courses, Faculty, Gallery, Results) + the public Contact form.
 */

export const coursesRoutes = Router();
coursesRoutes.get('/', asyncHandler(contentController.listCourses));
coursesRoutes.get('/:slug', asyncHandler(contentController.getCourse));

export const categoriesRoutes = Router();
categoriesRoutes.get('/', asyncHandler(contentController.listCategories));

export const facultyRoutes = Router();
facultyRoutes.get('/', asyncHandler(contentController.listFaculty));
facultyRoutes.get('/:slug', asyncHandler(contentController.getFaculty));

export const galleryRoutes = Router();
galleryRoutes.get('/', asyncHandler(contentController.listGallery));

export const resultsRoutes = Router();
resultsRoutes.get('/', asyncHandler(contentController.listResults));

export const testimonialsRoutes = Router();
testimonialsRoutes.get('/', asyncHandler(contentController.listTestimonials));

export const contactRoutes = Router();
contactRoutes.post('/', validate(contactValidation.submit), asyncHandler(contentController.submitContact));
