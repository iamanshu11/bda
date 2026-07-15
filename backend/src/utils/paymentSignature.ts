import crypto from 'crypto';

/**
 * Constant-time HMAC verification of a Razorpay checkout signature.
 * Pure + side-effect-free (no DB, no env) so it can be unit-tested in isolation.
 * Returns true iff HMAC-SHA256(`${orderId}|${paymentId}`, secret) === signature.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}

/** Constant-time verification of a raw webhook body signature. */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}
