import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Deny-path RBAC never reaches the DB, but importing the app instantiates a
// Prisma client whose native query engine may be absent in CI. Mock the client
// so these tests are deterministic on any platform.
vi.mock('@/config/prisma', () => {
  const handler: ProxyHandler<() => Promise<null>> = {
    get: () => new Proxy(() => Promise.resolve(null), handler),
    apply: () => Promise.resolve(null),
  };
  return { prisma: new Proxy(() => Promise.resolve(null), handler) };
});

import { createApp } from '@/app';
import { signAccessToken } from '@/helpers/jwt';
import { RoleName } from '@/constants';

/**
 * HTTP-boundary RBAC checks (B2). These assert the DENY paths only — 401/403
 * are decided by middleware BEFORE any controller/DB call, so they run without
 * a live database. "Allow" paths need a seeded DB and live in DB integration
 * tests (run against a disposable Postgres in CI).
 */
const app = createApp();
const P = '/api/v1';

describe('RBAC at the HTTP boundary (B2)', () => {
  it('GET /health is public', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects admin routes with no token (401)', async () => {
    const res = await request(app).get(`${P}/admin/courses`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects admin routes for a STUDENT token (403)', async () => {
    const token = signAccessToken({ userId: 'stu1', role: RoleName.STUDENT, permissions: [] });
    const res = await request(app)
      .get(`${P}/admin/users`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('rejects admin routes for a FACULTY token (403)', async () => {
    const token = signAccessToken({ userId: 'fac1', role: RoleName.FACULTY, permissions: [] });
    const res = await request(app)
      .get(`${P}/admin/payments`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('rejects a garbage bearer token (401)', async () => {
    const res = await request(app)
      .get(`${P}/admin/courses`)
      .set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects student-protected routes with no token (401)', async () => {
    const res = await request(app).get(`${P}/students/tests`);
    expect(res.status).toBe(401);
  });

  it('sets a correlation id header on responses (D4)', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});
