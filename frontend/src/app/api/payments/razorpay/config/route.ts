import { NextResponse } from 'next/server';
import { getRazorpayConfig, getSupabaseServerConfig } from '@/lib/razorpayServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/razorpay/config
 * Public, safe configuration used by the checkout UI. Only the publishable
 * key id is exposed — never the secret or webhook secret.
 */
export async function GET() {
  const { keyId, currency, configured, webhookSecret, exchangeRate } = getRazorpayConfig();
  const { adminConfigured } = getSupabaseServerConfig();
  return NextResponse.json({
    configured,
    // Online payments are only safe when the server can also record them.
    orderSync: adminConfigured,
    ready: configured && adminConfigured,
    keyId: configured ? keyId : null,
    currency,
    exchangeRate,
    webhookConfigured: Boolean(webhookSecret),
  });
}
