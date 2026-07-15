import rateLimit, { type Store } from 'express-rate-limit';
import { env } from '@/config/env';
import { HttpStatus } from '@/constants';
import { logger } from '@/logger';

const jsonMessage = (message: string) => ({ success: false, message, data: null });

/**
 * Optional shared store for rate limiting.
 *
 * By default the limiter uses express-rate-limit's in-memory store, which is
 * fine for a single instance but resets on restart and is not shared across
 * replicas. When REDIS_URL is set AND the optional deps are installed
 * (`npm i ioredis rate-limit-redis`), we transparently switch to a Redis store
 * so limits hold across restarts and multiple instances.
 *
 * The require is done at runtime and guarded so the build/app never breaks when
 * the optional packages are absent.
 */
function buildRedisStore(): Store | undefined {
  if (!env.REDIS_URL) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const req = eval('require') as NodeRequire;
    const RedisStore = req('rate-limit-redis').default ?? req('rate-limit-redis');
    const IORedis = req('ioredis').default ?? req('ioredis');
    const client = new IORedis(env.REDIS_URL);
    logger.info('Rate limiter: using Redis store');
    return new RedisStore({
      sendCommand: (...args: string[]) => client.call(...args),
    }) as Store;
  } catch (err) {
    logger.warn(
      'REDIS_URL is set but rate-limit-redis/ioredis are not installed — falling back to in-memory store. Run `npm i ioredis rate-limit-redis` to enable the shared store.',
      err,
    );
    return undefined;
  }
}

const sharedStore = buildRedisStore();

/** Global limiter applied to all API routes. */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  message: jsonMessage('Too many requests, please try again later.'),
  ...(sharedStore ? { store: sharedStore } : {}),
});

/** Stricter limiter for auth endpoints (login, OTP, password reset). */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  message: jsonMessage('Too many attempts, please slow down.'),
  ...(sharedStore ? { store: sharedStore } : {}),
});
