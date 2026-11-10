'use client';

/**
 * Browser helpers for the Razorpay Checkout.
 *
 * Flow:
 *   1. POST /api/payments/razorpay/order  -> server creates a Razorpay order
 *   2. Open Razorpay Checkout             -> customer pays
 *   3. POST /api/payments/razorpay/verify -> signature + amount verification
 */

import { supabase } from './supabase';

const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentDetails extends RazorpayPaymentResult {
  provider: 'razorpay';
  status: string;
  method: string | null;
  amount: number;
  currency: string;
  verified_at: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    step?: string;
    payment_id?: string;
    order_id?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export class RazorpayCheckoutError extends Error {
  code: string;
  constructor(message: string, code = 'RAZORPAY_ERROR') {
    super(message);
    this.name = 'RazorpayCheckoutError';
    this.code = code;
  }
}

export interface RazorpayConfigStatus {
  configured: boolean;
  /** True when the server can securely record the payment on the order. */
  orderSync: boolean;
  /** True only when checkout can both charge and record the payment. */
  ready: boolean;
  keyId: string | null;
  currency: string;
  exchangeRate: number;
  webhookConfigured: boolean;
}

export interface CreatedPaymentOrder {
  id: string;
  orderId: string;
  amount: number;
  chargeAmount: number;
  storeAmount: number;
  currency: string;
  keyId: string;
  receipt?: string;
  amountVerified: boolean;
  exchangeRate: number;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  orderUpdated: boolean;
  payment: RazorpayPaymentDetails;
  error?: string;
}

async function getAccessToken(): Promise<string | undefined> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch {
    /* fall through to the cached token */
  }
  try {
    const raw = typeof window === 'undefined' ? null : localStorage.getItem('user');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed?.token || undefined;
  } catch {
    return undefined;
  }
}

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  try {
    return (await response.json()) as T & { error?: string };
  } catch {
    return {} as T & { error?: string };
  }
}

/** Public payment configuration for the checkout UI. */
export async function getRazorpayStatus(): Promise<RazorpayConfigStatus> {
  const response = await fetch('/api/payments/razorpay/config', { cache: 'no-store' });
  const data = await readJson<RazorpayConfigStatus>(response);
  if (!response.ok) {
    throw new RazorpayCheckoutError(data.error || 'Could not load payment settings', 'CONFIG_FAILED');
  }
  const configured = Boolean(data.configured);
  const orderSync = Boolean(data.orderSync);
  return {
    configured,
    orderSync,
    ready: Boolean(data.ready) && configured && orderSync,
    keyId: data.keyId || null,
    currency: data.currency || 'USD',
    exchangeRate: Number(data.exchangeRate) || 0,
    webhookConfigured: Boolean(data.webhookConfigured),
  };
}

let checkoutScriptPromise: Promise<void> | null = null;

/** Loads Razorpay's checkout script once and caches the promise. */
export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new RazorpayCheckoutError('Razorpay can only be loaded in the browser', 'SSR'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT_URL}"]`);
    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new RazorpayCheckoutError('Could not load Razorpay Checkout', 'SCRIPT_FAILED')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScriptPromise = null;
      reject(new RazorpayCheckoutError('Could not load Razorpay Checkout. Check your connection and try again.', 'SCRIPT_FAILED'));
    };
    document.body.appendChild(script);
  });

  return checkoutScriptPromise;
}

interface OpenCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  retry?: { enabled?: boolean; max_count?: number };
}

/** Opens Razorpay Checkout and resolves with the signed payment result. */
export function openRazorpayCheckout(options: OpenCheckoutOptions): Promise<RazorpayPaymentResult> {
  return loadRazorpayCheckout().then(
    () =>
      new Promise<RazorpayPaymentResult>((resolve, reject) => {
        const RazorpayConstructor = window.Razorpay;
        if (!RazorpayConstructor) {
          reject(new RazorpayCheckoutError('Razorpay Checkout is unavailable', 'SCRIPT_FAILED'));
          return;
        }

        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

        const instance = new RazorpayConstructor({
          ...options,
          handler: (response: RazorpayPaymentResult) => finish(() => resolve(response)),
          modal: {
            confirm_close: true,
            escape: false,
            ondismiss: () =>
              finish(() => reject(new RazorpayCheckoutError('Payment was cancelled. Your order is saved as pending.', 'DISMISSED'))),
          },
        });

        instance.on('payment.failed', (response: RazorpayFailureResponse) => {
          const message =
            response?.error?.description ||
            response?.error?.reason ||
            'Payment failed. Please try again with a different method.';
          finish(() => reject(new RazorpayCheckoutError(message, response?.error?.code || 'FAILED')));
        });

        instance.open();
      }),
  );
}

async function createPaymentOrder(
  input: { orderId: string; amount: number; currency?: string },
  token?: string,
): Promise<CreatedPaymentOrder> {
  const response = await fetch('/api/payments/razorpay/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const data = await readJson<CreatedPaymentOrder>(response);
  if (!response.ok) {
    throw new RazorpayCheckoutError(data.error || 'Could not start the payment', 'ORDER_FAILED');
  }
  return data;
}

async function verifyPayment(
  input: RazorpayPaymentResult & { orderId: string },
  token?: string,
): Promise<VerifyPaymentResponse> {
  const response = await fetch('/api/payments/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const data = await readJson<VerifyPaymentResponse>(response);
  if (!response.ok || !data.verified) {
    throw new RazorpayCheckoutError(data.error || 'Payment verification failed', 'VERIFY_FAILED');
  }
  return data;
}

export interface PayOrderOptions {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  customer?: { name?: string; email?: string; contact?: string };
  companyName?: string;
}

export interface PayOrderResult {
  payment: RazorpayPaymentResult;
  details: RazorpayPaymentDetails;
  orderUpdated: boolean;
}

/**
 * End-to-end payment for an existing store order.
 * Throws RazorpayCheckoutError on dismiss/failure/verification errors.
 */
export async function payOrderWithRazorpay(options: PayOrderOptions): Promise<PayOrderResult> {
  const token = await getAccessToken();
  await loadRazorpayCheckout();

  const paymentOrder = await createPaymentOrder(
    { orderId: options.orderId, amount: options.amount, currency: options.currency },
    token,
  );

  const payment = await openRazorpayCheckout({
    key: paymentOrder.keyId,
    amount: paymentOrder.amount,
    currency: paymentOrder.currency,
    order_id: paymentOrder.id,
    name: options.companyName || 'ShopSmart',
    description: options.description || `Order #${options.orderId.slice(-8).toUpperCase()}`,
    prefill: options.customer,
    notes: { orderId: options.orderId },
    theme: { color: '#6366f1' },
    retry: { enabled: true, max_count: 3 },
  });

  const verification = await verifyPayment({ ...payment, orderId: options.orderId }, token);

  return {
    payment,
    details: verification.payment,
    orderUpdated: verification.orderUpdated,
  };
}
