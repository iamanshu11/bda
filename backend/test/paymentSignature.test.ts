import crypto from 'crypto';
import { describe, it, expect } from 'vitest';
import { verifyRazorpaySignature, verifyWebhookSignature } from '@/utils/paymentSignature';

const SECRET = 'test_secret_key';

function sign(orderId: string, paymentId: string, secret = SECRET) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('verifyRazorpaySignature (C2)', () => {
  it('accepts a correctly signed order/payment pair', () => {
    const sig = sign('order_123', 'pay_123');
    expect(verifyRazorpaySignature('order_123', 'pay_123', sig, SECRET)).toBe(true);
  });

  it('rejects a tampered payment id', () => {
    const sig = sign('order_123', 'pay_123');
    expect(verifyRazorpaySignature('order_123', 'pay_999', sig, SECRET)).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const sig = sign('order_123', 'pay_123', 'attacker_secret');
    expect(verifyRazorpaySignature('order_123', 'pay_123', sig, SECRET)).toBe(false);
  });

  it('rejects missing / empty signatures', () => {
    expect(verifyRazorpaySignature('o', 'p', undefined, SECRET)).toBe(false);
    expect(verifyRazorpaySignature('o', 'p', '', SECRET)).toBe(false);
  });

  it('rejects when the secret is empty (misconfig fails closed)', () => {
    const sig = sign('order_123', 'pay_123');
    expect(verifyRazorpaySignature('order_123', 'pay_123', sig, '')).toBe(false);
  });

  it('does not throw on unequal-length signatures (timingSafeEqual guard)', () => {
    expect(() => verifyRazorpaySignature('o', 'p', 'short', SECRET)).not.toThrow();
    expect(verifyRazorpaySignature('o', 'p', 'short', SECRET)).toBe(false);
  });
});

describe('verifyWebhookSignature (C2)', () => {
  it('accepts a correctly signed raw body', () => {
    const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    const sig = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
    expect(verifyWebhookSignature(body, sig, SECRET)).toBe(true);
  });

  it('rejects a modified body', () => {
    const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    const sig = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
    const tampered = Buffer.from(JSON.stringify({ event: 'order.paid' }));
    expect(verifyWebhookSignature(tampered, sig, SECRET)).toBe(false);
  });
});
