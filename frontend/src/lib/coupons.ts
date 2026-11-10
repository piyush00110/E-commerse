export type CouponType = 'percent' | 'fixed';

export interface CouponDefinition {
  code: string;
  type: CouponType;
  value: number;
  description: string;
  /** Minimum cart subtotal required to use the coupon. */
  minPurchase: number;
  /** Optional cap for percentage coupons. */
  maxDiscount?: number;
}

/**
 * Single source of truth for promo codes.
 *
 * Both the checkout UI and order creation use this list, so a code that shows
 * as valid in the UI is exactly the code the order total is computed with.
 */
export const AVAILABLE_COUPONS: CouponDefinition[] = [
  {
    code: 'SAVE10',
    type: 'percent',
    value: 10,
    description: 'Save 10% on your order',
    minPurchase: 20,
    maxDiscount: 25,
  },
  {
    code: 'WELCOME5',
    type: 'fixed',
    value: 5,
    description: '$5 off your purchase',
    minPurchase: 15,
  },
  {
    code: 'FIRST20',
    type: 'percent',
    value: 20,
    description: '20% off your first order',
    minPurchase: 40,
    maxDiscount: 40,
  },
  {
    code: 'FLAT50',
    type: 'fixed',
    value: 50,
    description: '$50 off orders over $300',
    minPurchase: 300,
  },
];

const STORAGE_KEY = 'clippedCoupons';

export function normalizeCouponCode(code: string | null | undefined): string {
  return (code || '').trim().toUpperCase();
}

export function findCoupon(code: string | null | undefined): CouponDefinition | null {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return AVAILABLE_COUPONS.find((c) => c.code === normalized) || null;
}

export interface CouponResult {
  coupon: CouponDefinition | null;
  discount: number;
  error: string;
}

/** Validate a code against a cart subtotal and return the dollar discount. */
export function calculateCouponDiscount(
  code: string | null | undefined,
  subtotal: number,
): CouponResult {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { coupon: null, discount: 0, error: '' };

  const coupon = findCoupon(normalized);
  if (!coupon) {
    return { coupon: null, discount: 0, error: 'Invalid coupon code' };
  }

  const amount = Math.max(0, Number(subtotal) || 0);
  if (amount < coupon.minPurchase) {
    return {
      coupon,
      discount: 0,
      error: `This coupon needs a minimum order of $${coupon.minPurchase.toFixed(2)}`,
    };
  }

  let discount =
    coupon.type === 'percent' ? (amount * coupon.value) / 100 : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(Math.max(0, discount), amount);

  return {
    coupon,
    discount: Math.round(discount * 100) / 100,
    error: '',
  };
}

/* ── Clipped-coupon storage (codes only) ─────────────────────────────────── */

export function getClippedCouponCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    // Support the old format that stored full objects.
    return raw
      .map((entry) => (typeof entry === 'string' ? entry : entry?.code))
      .filter((code): code is string => typeof code === 'string')
      .map(normalizeCouponCode);
  } catch {
    return [];
  }
}

export function saveClippedCouponCodes(codes: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes.map(normalizeCouponCode)));
  } catch {
    /* storage unavailable */
  }
}

export function clipCoupon(code: string): string[] {
  const normalized = normalizeCouponCode(code);
  const codes = getClippedCouponCodes();
  if (normalized && !codes.includes(normalized)) {
    const next = [...codes, normalized];
    saveClippedCouponCodes(next);
    return next;
  }
  return codes;
}

export function unclipCoupon(code: string): string[] {
  const normalized = normalizeCouponCode(code);
  const next = getClippedCouponCodes().filter((c) => c !== normalized);
  saveClippedCouponCodes(next);
  return next;
}

/** Backwards-compatible helper: clipped codes resolved to definitions. */
export function getAppliedCoupons(): CouponDefinition[] {
  return getClippedCouponCodes()
    .map((code) => findCoupon(code))
    .filter((coupon): coupon is CouponDefinition => Boolean(coupon));
}
