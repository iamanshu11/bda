import { prisma } from '@/config/prisma';

/** Per-user notifications. Created on key events (enroll, module complete…). */
export const notificationService = {
  create(userId: string, title: string, body: string) {
    return prisma.notification.create({ data: { userId, title, body } });
  },

  /** Fire-and-forget helper (never blocks the main flow). */
  emit(userId: string, title: string, body: string) {
    void this.create(userId, title, body).catch(() => undefined);
  },

  list(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markRead(userId: string, id: string) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
    return { id };
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { success: true };
  },
};
