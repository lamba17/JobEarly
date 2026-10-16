-- One-time Pro purchases (a 1-month or 1-year pass paid through Razorpay Orders).
-- Written ONLY by the server (service-role key) once Razorpay confirms a captured payment.
-- Pro access = the user's latest period_end is in the future. Buying again while Pro stacks
-- the new period on top of the remaining time.
--
-- Replaces the subscription-based flow: public.subscriptions is no longer read by the app.

create table if not exists public.purchases (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  razorpay_order_id   text not null,
  razorpay_payment_id text not null unique,   -- makes webhook + checkout-verify idempotent
  plan_interval       text not null check (plan_interval in ('monthly', 'annual')),
  amount_paise        integer not null,
  payment_method      text,
  paid_at             timestamptz not null default now(),
  period_end          timestamptz not null,
  created_at          timestamptz not null default now()
);

create index if not exists purchases_user_period_idx on public.purchases (user_id, period_end desc);

alter table public.purchases enable row level security;

drop policy if exists "Users can read their own purchases" on public.purchases;
create policy "Users can read their own purchases"
  on public.purchases for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No insert/update/delete policies on purpose: a client must never be able to grant itself Pro.
