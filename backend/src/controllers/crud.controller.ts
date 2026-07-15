import type { Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { CrudService } from '@/services/crud.service';
import { sendSuccess, buildPaginationMeta } from '@/utils/ApiResponse';
import { HttpStatus } from '@/constants';
import { ApiError } from '@/utils/ApiError';
import { getPagination } from '@/helpers/pagination';
import { auditService } from '@/services/audit.service';
import type { AuthenticatedRequest } from '@/interfaces';

/** Pull actor context from the request for audit logging. */
function actor(req: Request) {
  const u = (req as AuthenticatedRequest).user;
  return { actorId: u?.userId ?? null, actorRole: u?.role ?? null, ip: req.ip ?? null };
}
const idOf = (v: unknown): string | null =>
  v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : null;

export interface CrudControllerOptions {
  label: string;
  /** Zod schema validating the create payload. */
  createSchema?: ZodSchema;
  /** Zod schema validating the update payload (usually partial). */
  updateSchema?: ZodSchema;
  filterableFields?: string[];
  /** Optional hook to enrich data before create/update (e.g. generate slug). */
  transform?: (
    data: Record<string, unknown>,
    id?: string,
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

/**
 * Builds Express handlers (list/get/create/update/remove) for a CrudService.
 * Keeps controllers DRY — one line per admin resource.
 */
export function makeCrudController(service: CrudService, opts: CrudControllerOptions) {
  const validate = (schema: ZodSchema | undefined, body: unknown) => {
    if (!schema) return body as Record<string, unknown>;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten().fieldErrors);
    }
    return parsed.data as Record<string, unknown>;
  };

  return {
    list: async (req: Request, res: Response) => {
      const { page, limit, skip, take } = getPagination(req);
      const filters: Record<string, string> = {};
      for (const key of opts.filterableFields ?? []) {
        const v = req.query[key];
        if (typeof v === 'string') filters[key] = v;
      }
      const { items, total } = await service.list({
        skip,
        take,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        filters,
      });
      return sendSuccess(res, items, `${opts.label} list`, HttpStatus.OK, buildPaginationMeta(page, limit, total));
    },

    get: async (req: Request, res: Response) => {
      const item = await service.getById(req.params.id);
      return sendSuccess(res, item, `${opts.label} detail`);
    },

    create: async (req: Request, res: Response) => {
      let data = validate(opts.createSchema, req.body);
      if (opts.transform) data = await opts.transform(data);
      const created = await service.create(data);
      void auditService.record({
        ...actor(req),
        action: 'CREATE',
        targetType: opts.label,
        targetId: idOf(created),
        summary: `Created ${opts.label}`,
      });
      return sendSuccess(res, created, `${opts.label} created`, HttpStatus.CREATED);
    },

    update: async (req: Request, res: Response) => {
      let data = validate(opts.updateSchema, req.body);
      if (opts.transform) data = await opts.transform(data, req.params.id);
      const updated = await service.update(req.params.id, data);
      void auditService.record({
        ...actor(req),
        action: 'UPDATE',
        targetType: opts.label,
        targetId: req.params.id,
        summary: `Updated ${opts.label}`,
        metadata: { fields: Object.keys(data) },
      });
      return sendSuccess(res, updated, `${opts.label} updated`);
    },

    remove: async (req: Request, res: Response) => {
      const result = await service.remove(req.params.id);
      void auditService.record({
        ...actor(req),
        action: 'DELETE',
        targetType: opts.label,
        targetId: req.params.id,
        summary: `Deleted ${opts.label}`,
      });
      return sendSuccess(res, result, `${opts.label} deleted`);
    },
  };
}
