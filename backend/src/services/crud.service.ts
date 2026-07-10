import { ApiError } from '@/utils/ApiError';

/**
 * Minimal shape shared by every Prisma model delegate. Lets us build one
 * generic CRUD engine instead of duplicating queries per resource.
 */
export interface PrismaDelegate {
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  delete: (args: Record<string, unknown>) => Promise<unknown>;
  count: (args?: Record<string, unknown>) => Promise<number>;
}

export interface CrudOptions {
  /** Fields searched by the `?search=` query (case-insensitive contains). */
  searchFields?: string[];
  /** Default ordering, e.g. { createdAt: 'desc' }. */
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  /** Relations/fields to include on read. */
  include?: Record<string, unknown>;
  /** Fields that may be filtered exactly via query params. */
  filterableFields?: string[];
  /** Human label for error messages. */
  label?: string;
}

export interface ListParams {
  skip: number;
  take: number;
  search?: string;
  filters?: Record<string, string>;
}

/**
 * Generic CRUD service. Instantiate once per Prisma model.
 * @example const courseService = new CrudService(prisma.course, { searchFields: ['title'] });
 */
export class CrudService {
  constructor(
    private readonly model: PrismaDelegate,
    private readonly options: CrudOptions = {},
  ) {}

  private buildWhere(params: ListParams): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (params.search && this.options.searchFields?.length) {
      where.OR = this.options.searchFields.map((field) => ({
        [field]: { contains: params.search, mode: 'insensitive' },
      }));
    }

    if (params.filters && this.options.filterableFields?.length) {
      for (const key of this.options.filterableFields) {
        const value = params.filters[key];
        if (value !== undefined && value !== '') {
          where[key] = value === 'true' ? true : value === 'false' ? false : value;
        }
      }
    }

    return where;
  }

  async list(params: ListParams) {
    const where = this.buildWhere(params);
    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: this.options.defaultOrderBy ?? { createdAt: 'desc' },
        ...(this.options.include ? { include: this.options.include } : {}),
      }),
      this.model.count({ where }),
    ]);
    return { items, total };
  }

  async getById(id: string) {
    const item = await this.model.findUnique({
      where: { id },
      ...(this.options.include ? { include: this.options.include } : {}),
    });
    if (!item) throw ApiError.notFound(`${this.options.label ?? 'Record'} not found`);
    return item;
  }

  create(data: Record<string, unknown>) {
    return this.model.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.getById(id); // 404 if missing
    return this.model.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.model.delete({ where: { id } });
    return { id };
  }
}
