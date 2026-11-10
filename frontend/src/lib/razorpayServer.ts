import crypto from 'node:crypto';

/**
 * Server-only helpers for Razorpay.
 *
 * Secrets never leave the server: the browser only receives the public
 * `key_id`, while the `key_secret` is used here to create orders, verify
 * signatures and confirm payments with Razorpay's API.
 */

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

/** Currencies where Razorpay expects the amount without a decimal part. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export class RazorpayConfigError extends Error {
  code = 'RAZORPAY_NOT_CONFIGURED';
  constructor(message = 'Razorpay is not configured') {
    super(message);
    this.name = 'RazorpayConfigError';
  }
}

export class RazorpayApiError extends Error {
  status: number;
  code = 'RAZORPAY_API_ERROR';
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'RazorpayApiError';
    this.status = status;
  }
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  currency: string;
  /** Optional USD→INR rate used when the account charges in INR. */
  exchangeRate: number;
  configured: boolean;
}

export function getRazorpayConfig(): RazorpayConfig {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  const currency = (process.env.RAZORPAY_CURRENCY || 'USD').trim().toUpperCase();
  const parsedRate = Number(process.env.RAZORPAY_USD_TO_INR);
  const exchangeRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 0;
  return {
    keyId,
    keySecret,
    webhookSecret,
    currency,
    exchangeRate,
    configured: Boolean(keyId && keySecret),
  };
}

/**
 * Converts the catalogue amount (USD) into the currency Razorpay will charge.
 * Only INR needs conversion; other currencies are charged one-to-one.
 */
export function getChargeAmount(amount: number, currency: string): number {
  const { currency: configuredCurrency, exchangeRate } = getRazorpayConfig();
  const target = (currency || configuredCurrency).toUpperCase();
  if (target === 'INR' && exchangeRate > 0) {
    return Math.round(amount * exchangeRate * 100) / 100;
  }
  return amount;
}

interface SupabaseServerConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
  adminConfigured: boolean;
}

export function getSupabaseServerConfig(): SupabaseServerConfig {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, anonKey, serviceKey, adminConfigured: Boolean(url && serviceKey) };
}

export interface ServerOrder {
  id: string;
  total_price: number | string;
  is_paid?: boolean;
  user_id?: string;
  payment_method?: string;
}

/**
 * Reads an order server-side so the payable amount can be trusted.
 * Uses the service-role key when available, otherwise falls back to the
 * caller's Supabase access token (RLS still protects the row).
 */
export async function fetchServerOrder(orderId: string, userToken?: string): Promise<ServerOrder | null> {
  const { url, anonKey, serviceKey, adminConfigured } = getSupabaseServerConfig();
  const apiKey = adminConfigured ? serviceKey : anonKey;
  if (!url || !apiKey) return null;

  const authToken = adminConfigured ? serviceKey : (userToken || anonKey);
  if (!authToken) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=id,total_price,is_paid,user_id,payment_method&limit=1`,
      {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as ServerOrder[];
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

/** Marks an order as paid. Returns false when no admin key is configured. */
export async function markOrderPaid(orderId: string, paymentResult: unknown): Promise<boolean> {
  const { url, serviceKey, adminConfigured } = getSupabaseServerConfig();
  if (!adminConfigured) return false;

  const base = {
    is_paid: true,
    paid_at: new Date().toISOString(),
    status: 'processing',
    updated_at: new Date().toISOString(),
  };

  const headers: Record<string, string> = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  const patch = (body: Record<string, unknown>) =>
    fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

  try {
    let res = await patch({ ...base, payment_result: paymentResult });
    if (res.ok) return true;

    // Older databases may not have the payment_result column yet.
    const text = await res.text();
    if (/payment_result|PGRST204|column .* does not exist/i.test(text)) {
      res = await patch(base);
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

export function toMinorUnits(amount: number, currency: string): number {
  const multiplier = ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100;
  return Math.round(amount * multiplier);
}

function basicAuth(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { keyId, keySecret } = getRazorpayConfig();
  if (!keyId || !keySecret) throw new RazorpayConfigError();

  let res: Response;
  try {
    res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: basicAuth(keyId, keySecret),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
  } catch {
    throw new RazorpayApiError('Could not reach Razorpay. Please try again.', 502);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data as { error?: { description?: string } } | null)?.error?.description ||
      (typeof data === 'object' && data !== null && 'error' in data ? String((data as { error: unknown }).error) : '') ||
      'Razorpay request failed';
    throw new RazorpayApiError(message, res.status);
  }

  return data as T;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
}

export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  return razorpayRequest<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: toMinorUnits(input.amount, input.currency),
      currency: input.currency,
      receipt: input.receipt.slice(0, 40),
      notes: input.notes || {},
      payment_capture: 1,
    }),
  });
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  method?: string;
  captured?: boolean;
  email?: string;
  contact?: string;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  return razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/** Verifies the checkout signature returned by Razorpay's handler. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = getRazorpayConfig();
  if (!keySecret) throw new RazorpayConfigError();
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return timingSafeEqual(expected, signature);
}

/** Verifies the `X-Razorpay-Signature` header for webhooks. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const { webhookSecret } = getRazorpayConfig();
  if (!webhookSecret) throw new RazorpayConfigError('Razorpay webhook secret is not configured');
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return timingSafeEqual(expected, signature);
}
