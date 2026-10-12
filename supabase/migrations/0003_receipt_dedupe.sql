-- Remembers the last payment we emailed a receipt for, so the checkout-verify path and the
-- Razorpay webhook (which both see the same payment) never send the customer two emails.
alter table public.subscriptions
  add column if not exists last_receipt_payment_id text;
