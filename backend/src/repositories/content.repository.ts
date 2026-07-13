import { prisma } from '@/config/prisma';

/** Read-side data access for public catalog/content endpoints. */
export const contentRepository = {
  // Courses
  listCourses(params: { skip: number; take: number; categorySlug?: string }) {
    const where = {
      isPublished: true,
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
    };
    return prisma.$transaction([
      prisma.course.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.course.count({ where }),
    ]);
  },
  getCourseBySlug(slug: string) {
    return prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        category: true,
        faculties: true,
        faqs: true,
        demoVideos: true,
        // Free preview operations (no quiz answers exposed).
        modules: {
          where: { isPreview: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            moduleNumber: true,
            title: true,
            description: true,
            youtubeUrl: true,
            youtubeIframe: true,
            notes: true,
            estimatedDuration: true,
            quiz: {
              select: {
                passingMarks: true,
                questions: {
                  orderBy: { order: 'asc' },
                  select: { id: true, question: true, optionA: true, optionB: true, optionC: true, optionD: true },
                },
              },
            },
          },
        },
      },
    });
  },

  listApprovedReviews(courseId: string) {
    return prisma.courseReview.findMany({
      where: { courseId, isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Categories
  listCategories() {
    return prisma.courseCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  },

  // Faculty
  listFaculty() {
    return prisma.faculty.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  },
  getFacultyBySlug(slug: string) {
    return prisma.faculty.findUnique({ where: { slug }, include: { courses: true } });
  },

  // Gallery
  listGallery() {
    return prisma.galleryItem.findMany({ orderBy: { order: 'asc' } });
  },

  // Results & Hall of Fame
  listResults() {
    return prisma.result.findMany({ orderBy: [{ year: 'desc' }, { order: 'asc' }] });
  },
  listHallOfFame() {
    return prisma.hallOfFame.findMany({ orderBy: { order: 'asc' } });
  },

  // Testimonials
  listTestimonials() {
    return prisma.testimonial.findMany({ where: { isApproved: true }, orderBy: { createdAt: 'desc' } });
  },

  // Contact
  createContactMessage(data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) {
    return prisma.contactMessage.create({ data });
  },
};
