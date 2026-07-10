import { siteConfig } from '@/constants/site';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Load the Razorpay Checkout script once. */
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface CheckoutResult {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface CheckoutParams {
  keyId: string;
  orderId: string;
  amount: number; // paise
  courseTitle: string;
  prefill?: { name?: string; email?: string; contact?: string };
}

/**
 * Open the Razorpay checkout. Resolves with the payment ids on success,
 * rejects if the user dismisses the modal.
 */
export function openRazorpayCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RZP = (window as any).Razorpay;
    if (!RZP) return reject(new Error('Razorpay failed to load'));

    const rzp = new RZP({
      key: params.keyId,
      order_id: params.orderId,
      amount: params.amount,
      currency: 'INR',
      name: siteConfig.name,
      description: params.courseTitle,
      prefill: params.prefill,
      theme: { color: '#153063' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: (response: any) => {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.open();
  });
}
