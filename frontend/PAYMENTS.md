# Razorpay payments

Checkout uses **Razorpay** for online payments (cards, UPI, net-banking,
wallets, EMI) and keeps **Cash on Delivery** as an offline option.

## How it works

1. `POST /api/payments/razorpay/order` creates a Razorpay order.
   - The amount is always re-read from the `orders` table (with the
     service-role key, or the signed-in user's session). If the server cannot
     verify the order, it refuses to create a payment, so the browser cannot
     change the charged amount.
   - Only the public `key_id` is returned to the client.
2. Razorpay Checkout opens in the browser (`checkout.razorpay.com`).
3. `POST /api/payments/razorpay/verify` verifies the HMAC signature, confirms
   the payment with Razorpay and marks the store order as paid.
4. `POST /api/payments/razorpay/webhook` reconciles `payment.captured` /
   `order.paid` events server-to-server. It is idempotent and does not depend
   on the browser returning to the site.

If a customer closes the Razorpay modal, the order is saved as **pending** and
the order detail page shows a **Pay Now** button to retry.

## Environment variables

Add these to `frontend/.env.local` (and to your hosting provider):

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
RAZORPAY_CURRENCY=USD
# Only needed when charging INR for a USD-priced catalogue.
RAZORPAY_USD_TO_INR=

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it with a
`NEXT_PUBLIC_` prefix.

Online payments are **disabled until this key is set**, because only the
payment server is allowed to mark an order as paid. The checkout shows a clear
warning instead of taking a payment it cannot record. Cash on Delivery keeps
working without it.

## Razorpay dashboard setup

1. Create an account and complete KYC.
2. Copy the **Key ID** and **Key Secret** from *Account & Settings → API Keys*.
3. Enable the payment methods you want (cards, UPI, net-banking, wallets, EMI).
4. For non-Indian accounts, enable **international payments** and set
   `RAZORPAY_CURRENCY=USD`. For Indian accounts, set `RAZORPAY_CURRENCY=INR`
   (prices in the catalogue are currently displayed in USD) and set
   `RAZORPAY_USD_TO_INR` to your conversion rate (for example `83`). The
   checkout shows the approximate INR amount before opening Razorpay.
5. Add a webhook pointing to:

   ```
   https://your-domain.com/api/payments/razorpay/webhook
   ```

   Subscribe to `payment.captured` and `order.paid`, then copy the signing
   secret into `RAZORPAY_WEBHOOK_SECRET`.

## Testing

Use Razorpay test keys (`rzp_test_...`) and test cards/UPI IDs from the
Razorpay docs. Test mode never moves real money.

## Database notes

The verify route writes `is_paid`, `paid_at`, `status` and `payment_result` on
the order using the service-role key. If your `orders` table does not have
`payment_result`, the update falls back to the other columns automatically.

A database trigger (`public.guard_order_payment_fields`) blocks clients from
changing `is_paid`, `paid_at`, `payment_result`, `total_price`,
`payment_method` or `user_id`. Only the service role and admins can change
those fields, so a customer can never mark their own order as paid. Normal
status/delivery updates are unaffected.

If you re-create the database from scratch, re-apply the trigger:

```sql
create or replace function public.guard_order_payment_fields()
returns trigger language plpgsql set search_path = public as $$
declare v_role text;
begin
  if new.is_paid is not distinct from old.is_paid
     and new.paid_at is not distinct from old.paid_at
     and new.payment_result is not distinct from old.payment_result
     and new.total_price is not distinct from old.total_price
     and new.payment_method is not distinct from old.payment_method
     and new.user_id is not distinct from old.user_id then
    return new;
  end if;
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  v_role := public.get_user_role(auth.uid());
  if v_role = 'admin' then return new; end if;
  raise exception 'Payment details can only be updated by the payment server'
    using errcode = '42501';
end;
$$;

create trigger guard_order_payment_fields
  before update on public.orders
  for each row execute function public.guard_order_payment_fields();
```
