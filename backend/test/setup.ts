// Provide the minimum env so importing modules that pull in `@/config/env`
// (which validates at load time) never crashes the test process. These are
// throwaway values — the pure-logic tests never touch a real DB or gateway.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/bda_test?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-000';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-000';
process.env.RAZORPAY_KEY_SECRET ??= 'test_secret_key';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'test_webhook_secret';
