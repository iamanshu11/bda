import type { Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { CrudService } from '@/services/crud.service';
import { sendSuccess, buildPaginationMeta } from '@/utils/ApiResponse';
import { HttpStatus } from '@/constants';
import { ApiError } from '@/utils/ApiError';
import { getPagination } from '@/helpers/pagination';

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
      return sendSuccess(res, created, `${opts.label} created`, HttpStatus.CREATED);
    },

    update: async (req: Request, res: Response) => {
      let data = validate(opts.updateSchema, req.body);
      if (opts.transform) data = await opts.transform(data, req.params.id);
      const updated = await service.update(req.params.id, data);
      return sendSuccess(res, updated, `${opts.label} updated`);
    },

    remove: async (req: Request, res: Response) => {
      const result = await service.remove(req.params.id);
      return sendSuccess(res, result, `${opts.label} deleted`);
    },
  };
}
