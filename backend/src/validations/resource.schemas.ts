import { z } from 'zod';

/**
 * Zod schemas for admin-managed resources. `create` schemas are strict;
 * `update` schemas are the same made partial.
 */

const optionalString = z.string().trim().optional();

export const courseSchema = z.object({
  title: z.string().min(2),
  slug: optionalString,
  badge: optionalString,
  badgeType: z.enum(['FOUNDATION', 'GUARANTEE']).optional(),
  shortDesc: optionalString,
  description: optionalString,
  bannerUrl: optionalString,
  durationWeeks: z.coerce.number().int().positive().optional(),
  fees: z.coerce.number().nonnegative().optional(),
  isPublished: z.boolean().optional(),
  categoryId: optionalString,
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: optionalString,
  description: optionalString,
  iconKey: optionalString,
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const facultySchema = z.object({
  name: z.string().min(2),
  slug: optionalString,
  designation: optionalString,
  bio: optionalString,
  photoUrl: optionalString,
  expertise: z.array(z.string()).optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const gallerySchema = z.object({
  title: optionalString,
  imageUrl: z.string().min(1),
  category: optionalString,
  order: z.coerce.number().int().optional(),
});

export const resultSchema = z.object({
  studentName: z.string().min(2),
  rank: z.string().min(1),
  exam: z.string().min(1),
  year: z.coerce.number().int().optional(),
  photoUrl: optionalString,
  order: z.coerce.number().int().optional(),
});

export const hallOfFameSchema = z.object({
  name: z.string().min(2),
  rank: z.string().min(1),
  exam: z.string().min(1),
  photoUrl: optionalString,
  order: z.coerce.number().int().optional(),
});

export const testimonialSchema = z.object({
  authorName: z.string().min(2),
  role: optionalString,
  content: z.string().min(5),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  photoUrl: optionalString,
  isApproved: z.boolean().optional(),
});

export const blogSchema = z.object({
  title: z.string().min(2),
  slug: optionalString,
  excerpt: optionalString,
  content: z.string().min(10),
  coverUrl: optionalString,
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export const studyMaterialSchema = z.object({
  title: z.string().min(2),
  description: optionalString,
  fileUrl: optionalString,
  category: optionalString,
  isPublished: z.boolean().optional(),
});

export const faqSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
  order: z.coerce.number().int().optional(),
  courseId: optionalString,
});

/** Admins may only update status/role flags on users (not passwords here). */
export const userUpdateSchema = z.object({
  name: optionalString,
  phone: optionalString,
  isActive: z.boolean().optional(),
  roleId: optionalString,
});

export const contactUpdateSchema = z.object({
  status: z.enum(['NEW', 'READ', 'RESPONDED', 'ARCHIVED']),
});

export const enrollmentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
});

export const liveClassSchema = z.object({
  title: z.string().min(2),
  description: optionalString,
  courseId: optionalString,
  scheduledAt: z.coerce.date(),
  durationMins: z.coerce.number().int().positive().optional(),
  meetingUrl: optionalString,
});

export const announcementSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  pinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});
