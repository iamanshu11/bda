import Razorpay from 'razorpay';
import { env } from './env';

/** True only when both Razorpay keys are configured. */
export const isRazorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

let instance: Razorpay | null = null;

/** Lazy singleton Razorpay client. Throws a clear error if keys are missing. */
export function getRazorpay(): Razorpay {
  if (!isRazorpayConfigured) {
    throw new Error(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.',
    );
  }
  if (!instance) {
    instance = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return instance;
}
