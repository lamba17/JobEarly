-- Record which currency each purchase was paid in (India pays in INR, everyone else in USD).
-- amount_paise already stores the smallest unit of that currency (paise or cents).
-- RUN THIS BEFORE DEPLOYING USD payments. (The server also refuses a USD order until this has been applied,
-- so nobody can be charged in a currency we cannot record.)
alter table public.purchases add column if not exists currency text not null default 'INR';
alter table public.purchases drop constraint if exists purchases_currency_check;
alter table public.purchases add constraint purchases_currency_check check (currency in ('INR', 'USD'));
