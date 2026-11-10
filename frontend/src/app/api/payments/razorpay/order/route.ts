import { NextResponse } from 'next/server';
import {
  createRazorpayOrder,
  fetchServerOrder,
  getChargeAmount,
  getRazorpayConfig,
  RazorpayApiError,
  RazorpayConfigError,
} from '@/lib/razorpayServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AMOUNT = 500_000;

/**
 * POST /api/payments/razorpay/order
 * Creates a Razorpay order for an existing store order.
 *
 * The amount is re-read from the database whenever server credentials are
 * available, so a tampered client cannot change what is charged.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const config = getRazorpayConfig();
    if (!config.configured) {
      return NextResponse.json(
        {
          error: 'Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
          code: 'RAZORPAY_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const userToken = authHeader.replace(/^Bearer\s+/i, '').trim() || undefined;

    let amount = Number(body.amount);
    let amountVerified = false;
    const serverOrder = await fetchServerOrder(orderId, userToken);
    if (serverOrder && Number.isFinite(Number(serverOrder.total_price))) {
      if (serverOrder.payment_method && serverOrder.payment_method !== 'razorpay') {
        return NextResponse.json(
          { error: 'This order is not set up for online payment' },
          { status: 400 },
        );
      }
      amount = Number(serverOrder.total_price);
      amountVerified = true;
    }

    // Never charge an amount the server could not read from the database.
    if (!amountVerified) {
      return NextResponse.json(
        {
          error: 'Could not verify this order. Please sign in again and retry.',
          code: 'ORDER_NOT_VERIFIED',
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'A valid order amount is required' }, { status: 400 });
    }
    if (amount > MAX_AMOUNT) {
      return NextResponse.json({ error: 'Order amount exceeds the supported limit' }, { status: 400 });
    }

    const requestedCurrency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
    const currency = requestedCurrency || config.currency;
    if (currency === 'INR' && config.exchangeRate <= 0) {
      return NextResponse.json(
        {
          error: 'INR payments need RAZORPAY_USD_TO_INR to convert the USD catalogue price.',
          code: 'RAZORPAY_RATE_MISSING',
        },
        { status: 503 },
      );
    }
    const chargeAmount = getChargeAmount(amount, currency);
    const receipt = orderId.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || `order_${Date.now()}`;

    const razorpayOrder = await createRazorpayOrder({
      amount: chargeAmount,
      currency,
      receipt,
      notes: { orderId },
    });

    return NextResponse.json({
      id: razorpayOrder.id,
      orderId,
      amount: razorpayOrder.amount,
      chargeAmount,
      storeAmount: amount,
      currency: razorpayOrder.currency,
      keyId: config.keyId,
      receipt: razorpayOrder.receipt,
      amountVerified,
      exchangeRate: config.exchangeRate,
    });
  } catch (error) {
    if (error instanceof RazorpayConfigError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 503 });
    }
    if (error instanceof RazorpayApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'Could not create the payment order' }, { status: 500 });
  }
}
