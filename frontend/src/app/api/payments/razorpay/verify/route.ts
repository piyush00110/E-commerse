import { NextResponse } from 'next/server';
import {
  fetchRazorpayPayment,
  fetchServerOrder,
  getChargeAmount,
  getRazorpayConfig,
  markOrderPaid,
  RazorpayApiError,
  RazorpayConfigError,
  toMinorUnits,
  verifyPaymentSignature,
} from '@/lib/razorpayServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/razorpay/verify
 * Verifies the checkout signature, confirms the payment with Razorpay and
 * (when a service-role key is configured) marks the store order as paid.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const razorpayOrderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
    const razorpayPaymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
    const razorpaySignature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ verified: false, error: 'Missing payment details' }, { status: 400 });
    }

    if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return NextResponse.json({ verified: false, error: 'Payment signature verification failed' }, { status: 400 });
    }

    const config = getRazorpayConfig();
    let payment;
    try {
      payment = await fetchRazorpayPayment(razorpayPaymentId);
    } catch (error) {
      const message = error instanceof RazorpayApiError ? error.message : 'Could not confirm the payment with Razorpay';
      return NextResponse.json({ verified: false, error: message }, { status: 502 });
    }

    if (payment.order_id !== razorpayOrderId) {
      return NextResponse.json({ verified: false, error: 'Payment does not belong to this order' }, { status: 400 });
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json(
        { verified: false, error: `Payment is ${payment.status}. Please complete the payment.` },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const userToken = authHeader.replace(/^Bearer\s+/i, '').trim() || undefined;
    const serverOrder = orderId ? await fetchServerOrder(orderId, userToken) : null;

    if (serverOrder && Number.isFinite(Number(serverOrder.total_price))) {
      const expected = toMinorUnits(
        getChargeAmount(Number(serverOrder.total_price), payment.currency || config.currency),
        payment.currency || config.currency,
      );
      if (Number(payment.amount) !== expected) {
        return NextResponse.json(
          { verified: false, error: 'Paid amount does not match the order total' },
          { status: 400 },
        );
      }
    }

    const paymentResult = {
      provider: 'razorpay',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      status: payment.status,
      method: payment.method || null,
      amount: payment.amount,
      currency: payment.currency,
      verified_at: new Date().toISOString(),
    };

    const orderUpdated = orderId ? await markOrderPaid(orderId, paymentResult) : false;

    return NextResponse.json({
      verified: true,
      orderUpdated,
      payment: paymentResult,
    });
  } catch (error) {
    if (error instanceof RazorpayConfigError) {
      return NextResponse.json({ verified: false, error: error.message, code: error.code }, { status: 503 });
    }
    return NextResponse.json({ verified: false, error: 'Payment verification failed' }, { status: 500 });
  }
}
