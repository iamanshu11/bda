import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import { authenticate, authorize, requirePermission } from '@/middleware/auth';
import { signAccessToken } from '@/helpers/jwt';
import { RoleName } from '@/constants';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/interfaces';

const res = {} as Response;
const mkReq = (headers: Record<string, string> = {}) =>
  ({ headers } as unknown as AuthenticatedRequest);

describe('authenticate (B2)', () => {
  it('rejects a request with no Authorization header', () => {
    const next = vi.fn();
    expect(() => authenticate(mkReq(), res, next)).toThrow(ApiError);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed Authorization header', () => {
    const next = vi.fn();
    expect(() => authenticate(mkReq({ authorization: 'Token abc' }), res, next)).toThrow(ApiError);
  });

  it('rejects an invalid/garbage bearer token', () => {
    const next = vi.fn();
    expect(() =>
      authenticate(mkReq({ authorization: 'Bearer not.a.jwt' }), res, next),
    ).toThrow(ApiError);
  });

  it('accepts a valid token and attaches the user', () => {
    const token = signAccessToken({ userId: 'u1', role: RoleName.STUDENT, permissions: [] });
    const req = mkReq({ authorization: `Bearer ${token}` });
    const next = vi.fn();
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.userId).toBe('u1');
    expect(req.user?.role).toBe(RoleName.STUDENT);
  });
});

describe('authorize (B2 — RBAC)', () => {
  const call = (role: RoleName, allowed: RoleName[]) => {
    const req = { user: { userId: 'u1', role, permissions: [] } } as AuthenticatedRequest;
    const next = vi.fn();
    const run = () => authorize(...allowed)(req, res, next);
    return { run, next };
  };

  it('allows a role that is in the allowlist', () => {
    const { run, next } = call(RoleName.ADMIN, [RoleName.ADMIN, RoleName.SUPER_ADMIN]);
    run();
    expect(next).toHaveBeenCalledOnce();
  });

  it('denies a STUDENT hitting an admin-only guard', () => {
    const { run, next } = call(RoleName.STUDENT, [RoleName.ADMIN, RoleName.SUPER_ADMIN]);
    expect(run).toThrow(ApiError);
    expect(next).not.toHaveBeenCalled();
  });

  it('denies a FACULTY hitting a SUPER_ADMIN-only guard', () => {
    const { run, next } = call(RoleName.FACULTY, [RoleName.SUPER_ADMIN]);
    expect(run).toThrow(ApiError);
    expect(next).not.toHaveBeenCalled();
  });

  it('throws unauthorized when there is no user on the request', () => {
    const next = vi.fn();
    const req = {} as AuthenticatedRequest;
    expect(() => authorize(RoleName.ADMIN)(req, res, next)).toThrow(ApiError);
  });
});

describe('requirePermission (B2)', () => {
  const mk = (permissions: string[]) =>
    ({ user: { userId: 'u1', role: RoleName.ADMIN, permissions } } as AuthenticatedRequest);

  it('allows when the exact permission is present', () => {
    const next = vi.fn();
    requirePermission('course:write')(mk(['course:write']), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('allows a wildcard permission holder', () => {
    const next = vi.fn();
    requirePermission('anything:at:all')(mk(['*']), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('denies when the permission is missing', () => {
    const next = vi.fn();
    expect(() => requirePermission('course:write')(mk(['course:read']), res, next)).toThrow(ApiError);
    expect(next).not.toHaveBeenCalled();
  });
});
