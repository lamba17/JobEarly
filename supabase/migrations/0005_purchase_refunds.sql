-- Cancel-and-refund within 7 days of the first payment (see api/_lib/billing.ts, cancelAndRefund).
-- A refunded purchase no longer grants Pro access.
alter table public.purchases
  add column if not exists refunded_at timestamptz,
  add column if not exists razorpay_refund_id text;
