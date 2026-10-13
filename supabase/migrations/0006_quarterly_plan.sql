-- Allow the new 3-month ("quarterly") plan in purchases.plan_interval.
-- RUN THIS BEFORE DEPLOYING the quarterly plan. (The server also refuses to take a quarterly
-- payment until this has been applied, so nobody can be charged for a plan we cannot record.)
alter table public.purchases drop constraint if exists purchases_plan_interval_check;
alter table public.purchases
  add constraint purchases_plan_interval_check
  check (plan_interval in ('monthly', 'quarterly', 'annual'));
