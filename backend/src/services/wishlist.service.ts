import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';

/** Save courses to buy later. */
export const wishlistService = {
  list(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { id: true, title: true, slug: true, shortDesc: true, fees: true, bannerUrl: true, category: { select: { name: true } } },
        },
      },
    });
  },

  async add(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found.');
    return prisma.wishlist.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });
  },

  async remove(userId: string, courseId: string) {
    await prisma.wishlist.deleteMany({ where: { userId, courseId } });
    return { removed: true };
  },
};
