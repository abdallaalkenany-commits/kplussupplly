-- K Plus: log every WhatsApp button click on the website so it shows in the dashboard.
create table if not exists public.wa_clicks (
  id bigint generated always as identity primary key,
  source text check (source is null or char_length(source) <= 40),
  message text check (message is null or char_length(message) <= 1000),
  page text check (page is null or char_length(page) <= 300),
  lang text check (lang is null or char_length(lang) <= 5),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists wa_clicks_created_idx on public.wa_clicks (created_at desc);
alter table public.wa_clicks enable row level security;
drop policy if exists p_wa_insert on public.wa_clicks;
create policy p_wa_insert on public.wa_clicks for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
drop policy if exists p_wa_sel on public.wa_clicks;
create policy p_wa_sel on public.wa_clicks for select using (public.is_staff());
drop policy if exists p_wa_del on public.wa_clicks;
create policy p_wa_del on public.wa_clicks for delete using (public.is_admin());
grant select, insert, delete on public.wa_clicks to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
