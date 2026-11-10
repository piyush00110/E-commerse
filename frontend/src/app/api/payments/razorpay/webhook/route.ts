import { NextResponse } from 'next/server';
import {
  getRazorpayConfig,
  markOrderPaid,
  RazorpayConfigError,
  verifyWebhookSignature,
} from '@/lib/razorpayServer';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number; currency?: string; method?: string; notes?: Record<string, string> } };
    order?: { entity?: { id?: string; notes?: Record<string, string>; status?: string; amount?: number; currency?: string } };
  };
}

/**
 * POST /api/payments/razorpay/webhook
 * Server-to-server confirmation. Configure this URL in the Razorpay dashboard
 * with the events `payment.captured` and `order.paid`.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  try {
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ received: false, error: 'Invalid webhook signature' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof RazorpayConfigError) {
      return NextResponse.json({ received: false, error: error.message }, { status: 503 });
    }
    return NextResponse.json({ received: false, error: 'Webhook verification failed' }, { status: 500 });
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ received: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrder = event.payload?.order?.entity;
  const orderId =
    payment?.notes?.orderId ||
    payment?.notes?.order_id ||
    razorpayOrder?.notes?.orderId ||
    razorpayOrder?.notes?.order_id ||
    '';

  const isPaidEvent = event.event === 'payment.captured' || event.event === 'order.paid';
  const isCaptured = payment ? payment.status === 'captured' || payment.status === 'authorized' : true;

  if (orderId && isPaidEvent && isCaptured) {
    const paymentResult = {
      provider: 'razorpay',
      source: 'webhook',
      event: event.event,
      razorpay_order_id: payment?.order_id || razorpayOrder?.id || null,
      razorpay_payment_id: payment?.id || null,
      status: payment?.status || razorpayOrder?.status || 'captured',
      method: payment?.method || null,
      amount: payment?.amount ?? razorpayOrder?.amount ?? null,
      currency: payment?.currency || razorpayOrder?.currency || getRazorpayConfig().currency,
      verified_at: new Date().toISOString(),
    };
    const updated = await markOrderPaid(orderId, paymentResult);
    if (!updated) {
      // Acknowledge so Razorpay does not retry forever; the verify endpoint
      // still records the payment from the client return path.
      return NextResponse.json({ received: true, orderUpdated: false });
    }
  }

  return NextResponse.json({ received: true });
}
