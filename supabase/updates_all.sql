-- K Plus: all dashboard updates (WhatsApp clicks + leads/customer codes + company/type/map). Safe to run more than once.
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
-- K Plus: every website request = lead (عميل محتمل); when a deal is won it becomes a coded customer (KP-0001...).
alter table public.customers add column if not exists stage text not null default 'lead';
alter table public.customers add column if not exists code text;
alter table public.customers add column if not exists converted_at timestamptz;
do $$ begin
  alter table public.customers add constraint customers_stage_chk check (stage in ('lead','customer'));
exception when duplicate_object then null; end $$;
create unique index if not exists customers_code_key on public.customers (code) where code is not null;
alter table public.quote_requests add column if not exists source text default 'form';
do $$ begin
  alter table public.quote_requests add constraint quote_source_chk check (source is null or source in ('form','whatsapp','phone','visit','other'));
exception when duplicate_object then null; end $$;

create sequence if not exists public.customer_code_seq;

-- give a code the moment a customer becomes 'customer'
create or replace function public.assign_customer_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.stage = 'customer' and new.code is null then
    new.code := 'KP-' || lpad(nextval('public.customer_code_seq')::text, 4, '0');
    new.converted_at := coalesce(new.converted_at, now());
  end if;
  return new;
end $$;
drop trigger if exists customers_code on public.customers;
create trigger customers_code before insert or update on public.customers for each row execute function public.assign_customer_code();

-- a won deal converts the lead into a customer automatically
create or replace function public.convert_on_won() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'won' and new.customer_id is not null and (tg_op = 'INSERT' or old.status is distinct from 'won') then
    update public.customers set stage = 'customer' where id = new.customer_id and stage <> 'customer';
  end if;
  return new;
end $$;
drop trigger if exists quote_convert_won on public.quote_requests;
create trigger quote_convert_won after insert or update of status on public.quote_requests for each row execute function public.convert_on_won();

-- customers that already have a won deal become customers now
update public.customers c set stage = 'customer'
where stage = 'lead' and exists (select 1 from public.quote_requests q where q.customer_id = c.id and q.status = 'won');

grant usage, select on all sequences in schema public to anon, authenticated;
-- K Plus: quote form gets optional company, customer type and map location; carried to the customer record.
alter table public.quote_requests add column if not exists customer_type text;
alter table public.quote_requests add column if not exists map_url text;
do $$ begin
  alter table public.quote_requests add constraint quote_ctype_chk check (customer_type is null or customer_type in ('developer','contractor','supplier','factory','concrete_plant'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.quote_requests add constraint quote_map_chk check (map_url is null or char_length(map_url) <= 500);
exception when duplicate_object then null; end $$;

alter table public.customers add column if not exists map_url text;
alter table public.customers drop constraint if exists customers_type_check;
do $$ begin
  alter table public.customers add constraint customers_type_check check (type in ('contractor','developer','supplier','factory','concrete_plant','individual','company','other'));
exception when duplicate_object then null; end $$;

-- link each request to a customer by phone; new info fills the customer's empty fields
create or replace function public.link_quote_customer() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select id into cid from public.customers where phone = new.phone limit 1;
  if cid is null then
    insert into public.customers (user_id, name, phone, email, company, governorate, type, map_url)
    values (new.user_id, new.name, new.phone, new.email, new.company, new.location,
            coalesce(new.customer_type, 'contractor'), new.map_url) returning id into cid;
  else
    update public.customers set
      company = coalesce(company, new.company),
      governorate = coalesce(governorate, new.location),
      map_url = coalesce(new.map_url, map_url),
      type = case when new.customer_type is not null and type in ('contractor','other') then new.customer_type else type end,
      user_id = coalesce(user_id, new.user_id)
    where id = cid;
  end if;
  new.customer_id := cid;
  return new;
end $$;
