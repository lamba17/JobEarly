-- Razorpay subscription state, one row per user.
-- Written ONLY by the server (service-role key, which bypasses RLS) from the
-- verify-payment / webhook / cancel endpoints. Clients can read their own row.

create table if not exists public.subscriptions (
  user_id                  uuid primary key references auth.users (id) on delete cascade,
  razorpay_subscription_id text unique not null,
  razorpay_plan_id         text,
  plan_interval            text not null default 'monthly' check (plan_interval in ('monthly', 'annual')),
  status                   text not null default 'created',
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Deliberately no insert/update/delete policies: a client must never be able to
-- grant itself Pro. Only the service-role key (server-side) can write.
