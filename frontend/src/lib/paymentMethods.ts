/**
 * Payment methods offered at checkout.
 *
 * Online payments are handled by Razorpay, which covers cards, UPI,
 * net-banking, wallets and EMI in a single PCI-DSS compliant checkout.
 * Cash on Delivery stays available as an offline option.
 */
export interface PaymentMethodOption {
  id: 'razorpay' | 'cod';
  label: string;
  desc: string;
  icon: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'razorpay',
    label: 'Razorpay',
    desc: 'Cards, UPI, NetBanking, Wallets & EMI — secured by Razorpay',
    icon: '\u{1F4B3}',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when you receive your order',
    icon: '\u{1F4B5}',
  },
];

const PAYMENT_LABELS: Record<string, string> = {
  razorpay: 'Razorpay',
  cod: 'Cash on Delivery',
  credit_card: 'Credit / Debit Card',
  paypal: 'PayPal',
  upi: 'UPI',
};

/** Human-friendly label for a stored payment_method value. */
export function paymentMethodLabel(method?: string | null): string {
  if (!method) return 'N/A';
  const key = method.toLowerCase();
  if (PAYMENT_LABELS[key]) return PAYMENT_LABELS[key];
  return method
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** True when the order still needs to be paid online. */
export function isOnlinePaymentPending(order: { isPaid?: boolean; paymentMethod?: string | null }): boolean {
  return !order.isPaid && (order.paymentMethod || '').toLowerCase() === 'razorpay';
}
