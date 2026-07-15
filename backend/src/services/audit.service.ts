import { prisma } from '@/config/prisma';
import { logger } from '@/logger';

export interface AuditEntry {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string; // CREATE | UPDATE | DELETE | FORCE_SUBMIT | ROLE_CHANGE | ...
  targetType: string; // Course | User | WrittenTest | Payment | ...
  targetId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

/**
 * Minimal delegate typing for the AuditLog model so this compiles before
 * `prisma generate` has regenerated the client with the new model. After you
 * run `npm run prisma:migrate` the real generated types take over at runtime.
 */
interface AuditLogDelegate {
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  findMany(args?: Record<string, unknown>): Promise<unknown[]>;
  count(args?: Record<string, unknown>): Promise<number>;
}
const auditLog = (prisma as unknown as { auditLog: AuditLogDelegate }).auditLog;

export const auditService = {
  /**
   * Append an audit entry. Best-effort: never throws, so an audit failure can
   * never break the underlying admin action.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          actorEmail: entry.actorEmail ?? null,
          actorRole: entry.actorRole ?? null,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId ?? null,
          summary: entry.summary ?? null,
          metadata: (entry.metadata ?? undefined) as unknown,
          ip: entry.ip ?? null,
        },
      });
    } catch (err) {
      logger.warn('audit_log_write_failed', err);
    }
  },
};
