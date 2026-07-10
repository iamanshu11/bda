import type { NextFunction, Request, Response } from 'express';
import { validationResult, type ValidationChain } from 'express-validator';
import type { ZodSchema } from 'zod';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';

/**
 * Run express-validator chains, then reject with a 422 if any failed.
 * @example router.post('/', validate(signupRules), controller.signup)
 */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (!result.isEmpty()) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', result.array());
    }
    next();
  };
}

/**
 * Alternative Zod-based body validator. Parses & replaces req.body with the
 * typed result. Use where a shared Zod schema (also used on the frontend) fits.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten().fieldErrors);
    }
    req.body = parsed.data;
    next();
  };
}
