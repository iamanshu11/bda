import { Router } from 'express';
import { authRoutes } from './auth.routes';
import {
  coursesRoutes,
  categoriesRoutes,
  facultyRoutes,
  galleryRoutes,
  resultsRoutes,
  testimonialsRoutes,
  contactRoutes,
} from './content.routes';
import { adminRoutes } from './admin.routes';
import { moduleAdminRoutes } from './module.routes';
import { studentRoutes } from './student.routes';
import { learningRoutes } from './learning.routes';
import { competitiveRoutes } from './competitive.routes';
import { uploadRoutes } from './upload.routes';
import { dashboardRoutes, settingsRoutes } from './protected.routes';
import { publicTestRoutes, studentTestRoutes } from './writtenTest.routes';

/**
 * API v1 router. Mounted at env.API_PREFIX (default /api/v1) in app.ts.
 */
const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Bokaro Defence Academy API v1',
    data: {
      resources: [
        'auth',
        'courses',
        'categories',
        'faculty',
        'gallery',
        'results',
        'testimonials',
        'contact',
        'students',
        'tests',
        'users',
        'admin',
        'dashboard',
        'settings',
      ],
    },
  });
});

router.use('/auth', authRoutes);
router.use('/courses', coursesRoutes);
router.use('/categories', categoriesRoutes);
router.use('/faculty', facultyRoutes);
router.use('/gallery', galleryRoutes);
router.use('/results', resultsRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/contact', contactRoutes);
router.use('/', publicTestRoutes);

router.use('/students', studentRoutes);
router.use('/students', learningRoutes);
router.use('/students', competitiveRoutes);
router.use('/students', studentTestRoutes);
router.use('/admin', adminRoutes);
router.use('/admin', moduleAdminRoutes);
router.use('/uploads', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

export { router };
