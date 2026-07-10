/** Application-wide roles. Mirrors the Role table's `name`. */
export enum RoleName {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/** OTP purposes. */
export enum OtpPurpose {
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

/** Standard HTTP status codes used across the API. */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'bda_refresh_token',
} as const;
