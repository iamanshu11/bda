import { Router } from 'express';
import { prisma } from '@/config/prisma';
import { CrudService, type PrismaDelegate } from '@/services/crud.service';
import { makeCrudController, type CrudControllerOptions } from '@/controllers/crud.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { RoleName } from '@/constants';
import { slugify } from '@/helpers/slug';
import { dashboardController } from '@/controllers/dashboard.controller';
import * as S from '@/validations/resource.schemas';

/**
 * Admin API: full CRUD for every managed resource, generated from a registry
 * so there is zero duplicated handler code. All routes require ADMIN or
 * SUPER_ADMIN. Read-only actions can be added per resource via `actions`.
 */

type Action = 'list' | 'get' | 'create' | 'update' | 'remove';

interface ResourceConfig {
  path: string;
  model: PrismaDelegate;
  options: CrudControllerOptions & {
    searchFields?: string[];
    include?: Record<string, unknown>;
    defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  };
  /** Restrict which actions are exposed (default: all). */
  actions?: Action[];
}

/** Ensure a slug exists, derived from title/name when omitted. */
const withSlug = (data: Record<string, unknown>) => {
  if (!data.slug && (data.title || data.name)) {
    data.slug = slugify(String(data.title ?? data.name));
  }
  return data;
};

const resources: ResourceConfig[] = [
  {
    path: 'courses',
    model: prisma.course as unknown as PrismaDelegate,
    options: {
      label: 'Course',
      createSchema: S.courseSchema,
      updateSchema: S.courseSchema.partial(),
      searchFields: ['title', 'slug'],
      include: { category: true },
      filterableFields: ['isPublished', 'categoryId'],
      transform: withSlug,
    },
  },
  {
    path: 'categories',
    model: prisma.courseCategory as unknown as PrismaDelegate,
    options: {
      label: 'Category',
      createSchema: S.categorySchema,
      updateSchema: S.categorySchema.partial(),
      searchFields: ['name', 'slug'],
      defaultOrderBy: { order: 'asc' },
      transform: withSlug,
    },
  },
  {
    path: 'faculty',
    model: prisma.faculty as unknown as PrismaDelegate,
    options: {
      label: 'Faculty',
      createSchema: S.facultySchema,
      updateSchema: S.facultySchema.partial(),
      searchFields: ['name', 'designation'],
      defaultOrderBy: { order: 'asc' },
      transform: withSlug,
    },
  },
  {
    path: 'gallery',
    model: prisma.galleryItem as unknown as PrismaDelegate,
    options: {
      label: 'Gallery item',
      createSchema: S.gallerySchema,
      updateSchema: S.gallerySchema.partial(),
      searchFields: ['title', 'category'],
      defaultOrderBy: { order: 'asc' },
    },
  },
  {
    path: 'results',
    model: prisma.result as unknown as PrismaDelegate,
    options: {
      label: 'Result',
      createSchema: S.resultSchema,
      updateSchema: S.resultSchema.partial(),
      searchFields: ['studentName', 'exam', 'rank'],
    },
  },
  {
    path: 'hall-of-fame',
    model: prisma.hallOfFame as unknown as PrismaDelegate,
    options: {
      label: 'Hall of Fame entry',
      createSchema: S.hallOfFameSchema,
      updateSchema: S.hallOfFameSchema.partial(),
      searchFields: ['name', 'exam'],
      defaultOrderBy: { order: 'asc' },
    },
  },
  {
    path: 'testimonials',
    model: prisma.testimonial as unknown as PrismaDelegate,
    options: {
      label: 'Testimonial',
      createSchema: S.testimonialSchema,
      updateSchema: S.testimonialSchema.partial(),
      searchFields: ['authorName', 'content'],
      filterableFields: ['isApproved'],
    },
  },
  {
    path: 'blogs',
    model: prisma.blog as unknown as PrismaDelegate,
    options: {
      label: 'Blog',
      createSchema: S.blogSchema,
      updateSchema: S.blogSchema.partial(),
      searchFields: ['title', 'slug'],
      filterableFields: ['isPublished'],
      transform: withSlug,
    },
  },
  {
    path: 'study-materials',
    model: prisma.studyMaterial as unknown as PrismaDelegate,
    options: {
      label: 'Study material',
      createSchema: S.studyMaterialSchema,
      updateSchema: S.studyMaterialSchema.partial(),
      searchFields: ['title', 'category'],
    },
  },
  {
    path: 'faqs',
    model: prisma.faq as unknown as PrismaDelegate,
    options: {
      label: 'FAQ',
      createSchema: S.faqSchema,
      updateSchema: S.faqSchema.partial(),
      searchFields: ['question'],
      defaultOrderBy: { order: 'asc' },
    },
  },
  {
    path: 'users',
    model: prisma.user as unknown as PrismaDelegate,
    options: {
      label: 'User',
      updateSchema: S.userUpdateSchema,
      searchFields: ['name', 'email'],
      include: { role: true },
      filterableFields: ['isActive'],
    },
    actions: ['list', 'get', 'update'], // no create/delete of users here
  },
  {
    path: 'contact-messages',
    model: prisma.contactMessage as unknown as PrismaDelegate,
    options: {
      label: 'Contact message',
      updateSchema: S.contactUpdateSchema,
      searchFields: ['name', 'email', 'subject'],
      filterableFields: ['status'],
    },
    actions: ['list', 'get', 'update', 'remove'],
  },
  {
    path: 'enrollments',
    model: prisma.enrollment as unknown as PrismaDelegate,
    options: {
      label: 'Enrollment',
      updateSchema: S.enrollmentUpdateSchema,
      include: { user: true, course: true },
      filterableFields: ['status'],
    },
    actions: ['list', 'get', 'update', 'remove'],
  },
  {
    path: 'live-classes',
    model: prisma.liveClass as unknown as PrismaDelegate,
    options: {
      label: 'Live class',
      createSchema: S.liveClassSchema,
      updateSchema: S.liveClassSchema.partial(),
      searchFields: ['title'],
      defaultOrderBy: { scheduledAt: 'asc' },
      include: { course: { select: { title: true } } },
    },
  },
  {
    path: 'announcements',
    model: prisma.announcement as unknown as PrismaDelegate,
    options: {
      label: 'Announcement',
      createSchema: S.announcementSchema,
      updateSchema: S.announcementSchema.partial(),
      searchFields: ['title', 'body'],
      defaultOrderBy: { createdAt: 'desc' },
      filterableFields: ['isPublished'],
    },
  },
  {
    path: 'coupons',
    model: prisma.coupon as unknown as PrismaDelegate,
    options: {
      label: 'Coupon',
      createSchema: S.couponSchema,
      updateSchema: S.couponSchema.partial(),
      searchFields: ['code'],
      defaultOrderBy: { createdAt: 'desc' },
      filterableFields: ['status'],
      include: { course: { select: { title: true } } },
    },
  },
  {
    path: 'payments',
    model: prisma.payment as unknown as PrismaDelegate,
    options: {
      label: 'Payment',
      searchFields: ['razorpayOrderId', 'razorpayPaymentId'],
      defaultOrderBy: { createdAt: 'desc' },
      filterableFields: ['status'],
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    },
    actions: ['list', 'get'],
  },
  {
    path: 'reviews',
    model: prisma.courseReview as unknown as PrismaDelegate,
    options: {
      label: 'Review',
      updateSchema: S.reviewUpdateSchema,
      searchFields: ['title', 'body'],
      defaultOrderBy: { createdAt: 'desc' },
      filterableFields: ['isApproved'],
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    },
    actions: ['list', 'get', 'update', 'remove'],
  },
  {
    path: 'written-tests',
    model: prisma.writtenTest as unknown as PrismaDelegate,
    options: {
      label: 'Written test',
      createSchema: S.writtenTestSchema,
      updateSchema: S.writtenTestSchema.partial(),
      searchFields: ['title', 'slug'],
      filterableFields: ['status'],
      defaultOrderBy: { createdAt: 'desc' },
      transform: async (data: Record<string, unknown>, id?: string) => {
        withSlug(data);
        if (data.status === 'PUBLISHED' && id) {
          const { writtenTestService } = await import('@/services/writtenTest.service');
          await writtenTestService.publishCheck(id);
        }
        return data;
      },
    },
  },
];

const router = Router();

// Guard the entire admin surface
router.use(authenticate, authorize(RoleName.ADMIN, RoleName.SUPER_ADMIN));

// Dashboard overview stats
router.get('/dashboard', asyncHandler(dashboardController.adminOverview));
router.get('/analytics', asyncHandler(dashboardController.adminAnalytics));

// Register CRUD for every resource
for (const res of resources) {
  const service = new CrudService(res.model, {
    searchFields: res.options.searchFields,
    include: res.options.include,
    defaultOrderBy: res.options.defaultOrderBy,
    filterableFields: res.options.filterableFields,
    label: res.options.label,
  });
  const ctrl = makeCrudController(service, res.options);
  const actions = res.actions ?? ['list', 'get', 'create', 'update', 'remove'];
  const base = `/${res.path}`;

  if (actions.includes('list')) router.get(base, asyncHandler(ctrl.list));
  if (actions.includes('get')) router.get(`${base}/:id`, asyncHandler(ctrl.get));
  if (actions.includes('create')) router.post(base, asyncHandler(ctrl.create));
  if (actions.includes('update')) router.patch(`${base}/:id`, asyncHandler(ctrl.update));
  if (actions.includes('remove')) router.delete(`${base}/:id`, asyncHandler(ctrl.remove));
}

// Written-test nested admin routes
import { writtenTestController } from '@/controllers/writtenTest.controller';

router.get('/written-tests/:id/questions', asyncHandler(writtenTestController.listQuestions));
router.post('/written-tests/:id/questions', asyncHandler(writtenTestController.addQuestion));
router.patch('/test-questions/:id', asyncHandler(writtenTestController.updateQuestion));
router.delete('/test-questions/:id', asyncHandler(writtenTestController.deleteQuestion));
router.get('/written-tests/:id/results', asyncHandler(writtenTestController.results));
router.get('/exam-monitoring', asyncHandler(writtenTestController.monitoring));
router.get('/exam-attempts/:id/violations', asyncHandler(writtenTestController.attemptViolations));
router.post('/exam-attempts/:id/force-submit', asyncHandler(writtenTestController.forceSubmit));

export { router as adminRoutes };
