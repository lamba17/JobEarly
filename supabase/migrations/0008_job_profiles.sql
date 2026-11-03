-- The details the Find Jobs page needs to score listings against a person's resume.
-- One row per user, read and written by that user only (the resume text is personal data).

create table if not exists public.job_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  resume_text  text not null default '',
  target_role  text not null default '',
  city         text not null default '',
  country      text not null default '',   -- two-letter code, e.g. IN, US, GB
  updated_at   timestamptz not null default now(),
  constraint job_profiles_resume_len check (char_length(resume_text) <= 20000)
);

alter table public.job_profiles enable row level security;

drop policy if exists "Users read their own job profile" on public.job_profiles;
create policy "Users read their own job profile"
  on public.job_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own job profile" on public.job_profiles;
create policy "Users create their own job profile"
  on public.job_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own job profile" on public.job_profiles;
create policy "Users update their own job profile"
  on public.job_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own job profile" on public.job_profiles;
create policy "Users delete their own job profile"
  on public.job_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);
