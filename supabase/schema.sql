-- KPLUS CRM schema for Supabase. Run once in: Supabase > SQL Editor > New query > Run.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

-- ========== profiles & roles ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  company text,
  role text not null default 'customer' check (role in ('admin','sales','customer','supplier')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','sales'));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- new sign-ups become customer or supplier only (never staff)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'account_type', 'customer');
begin
  if r not in ('customer','supplier') then r := 'customer'; end if;
  insert into public.profiles (id, email, full_name, phone, company, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone',
          new.raw_user_meta_data->>'company', r)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- users may edit their own name/phone/company but never their role
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'only admins can change roles';
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_role();

-- ========== customers ==========
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  company text,
  governorate text,
  type text default 'contractor' check (type in ('contractor','developer','individual','company','other')),
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists customers_phone_key on public.customers (phone) where phone is not null;

-- ========== quote requests (leads) ==========
create table if not exists public.quote_requests (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 6 and 30),
  email text check (email is null or char_length(email) <= 200),
  company text check (company is null or char_length(company) <= 200),
  product text check (product is null or char_length(product) <= 200),
  quantity text check (quantity is null or char_length(quantity) <= 200),
  location text check (location is null or char_length(location) <= 200),
  notes text check (notes is null or char_length(notes) <= 2000),
  lang text default 'ar',
  page text,
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost')),
  quoted_amount numeric(14,2),
  assigned_to uuid references public.profiles(id) on delete set null,
  follow_up_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quote_requests_status_idx on public.quote_requests (status, created_at desc);

-- link each request to a customer by phone (create the customer if new)
create or replace function public.link_quote_customer() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select id into cid from public.customers where phone = new.phone limit 1;
  if cid is null then
    insert into public.customers (user_id, name, phone, email, company, governorate)
    values (new.user_id, new.name, new.phone, new.email, new.company, new.location) returning id into cid;
  end if;
  new.customer_id := cid;
  return new;
end $$;
drop trigger if exists quote_link_customer on public.quote_requests;
create trigger quote_link_customer before insert on public.quote_requests for each row execute function public.link_quote_customer();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists quote_touch on public.quote_requests;
create trigger quote_touch before update on public.quote_requests for each row execute function public.touch_updated_at();

-- ========== activity log (notes, calls, follow-ups) ==========
create table if not exists public.activities (
  id bigint generated always as identity primary key,
  quote_id bigint references public.quote_requests(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  supplier_id uuid,
  author uuid references public.profiles(id) on delete set null default auth.uid(),
  kind text not null default 'note' check (kind in ('note','call','whatsapp','email','visit','status')),
  body text not null check (char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

-- ========== suppliers ==========
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  governorate text,
  categories text[] default '{}',
  products text,
  cr_number text,
  tax_number text,
  website text,
  files jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rating smallint check (rating between 1 and 5),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists suppliers_touch on public.suppliers;
create trigger suppliers_touch before update on public.suppliers for each row execute function public.touch_updated_at();

-- suppliers can edit their own profile but not status/rating/internal notes
create or replace function public.protect_supplier() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    new.status := old.status; new.rating := old.rating; new.internal_notes := old.internal_notes; new.user_id := old.user_id;
  end if;
  return new;
end $$;
drop trigger if exists suppliers_protect on public.suppliers;
create trigger suppliers_protect before update on public.suppliers for each row execute function public.protect_supplier();

-- ========== products (shown on the website) ==========
create table if not exists public.products (
  id bigint generated always as identity primary key,
  category text not null,
  name_ar text not null,
  name_en text,
  spec_ar text,
  spec_en text,
  unit_ar text,
  unit_en text,
  price numeric(14,2),
  show_price boolean not null default false,
  image_url text,
  active boolean not null default true,
  sort int not null default 100,
  updated_at timestamptz not null default now()
);
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

-- ========== row level security ==========
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.quote_requests enable row level security;
alter table public.activities enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;

drop policy if exists p_profiles_sel on public.profiles;
create policy p_profiles_sel on public.profiles for select using (id = auth.uid() or public.is_staff());
drop policy if exists p_profiles_upd on public.profiles;
create policy p_profiles_upd on public.profiles for update using (id = auth.uid() or public.is_admin());

drop policy if exists p_customers_staff on public.customers;
create policy p_customers_staff on public.customers for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_customers_own on public.customers;
create policy p_customers_own on public.customers for select using (user_id = auth.uid());

drop policy if exists p_quotes_insert on public.quote_requests;
create policy p_quotes_insert on public.quote_requests for insert to anon, authenticated
  with check (status = 'new' and quoted_amount is null and assigned_to is null and (user_id is null or user_id = auth.uid()));
drop policy if exists p_quotes_sel on public.quote_requests;
create policy p_quotes_sel on public.quote_requests for select using (public.is_staff() or user_id = auth.uid());
drop policy if exists p_quotes_upd on public.quote_requests;
create policy p_quotes_upd on public.quote_requests for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_quotes_del on public.quote_requests;
create policy p_quotes_del on public.quote_requests for delete using (public.is_admin());

drop policy if exists p_act_staff on public.activities;
create policy p_act_staff on public.activities for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists p_sup_insert on public.suppliers;
create policy p_sup_insert on public.suppliers for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
drop policy if exists p_sup_sel on public.suppliers;
create policy p_sup_sel on public.suppliers for select using (public.is_staff() or user_id = auth.uid());
drop policy if exists p_sup_upd on public.suppliers;
create policy p_sup_upd on public.suppliers for update using (public.is_staff() or user_id = auth.uid());
drop policy if exists p_sup_del on public.suppliers;
create policy p_sup_del on public.suppliers for delete using (public.is_admin());

drop policy if exists p_prod_public on public.products;
create policy p_prod_public on public.products for select using (active or public.is_staff());
drop policy if exists p_prod_staff on public.products;
create policy p_prod_staff on public.products for all using (public.is_staff()) with check (public.is_staff());

-- ========== supplier documents (private storage) ==========
insert into storage.buckets (id, name, public) values ('supplier-docs', 'supplier-docs', false)
  on conflict (id) do nothing;
drop policy if exists p_docs_insert on storage.objects;
create policy p_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'supplier-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists p_docs_sel on storage.objects;
create policy p_docs_sel on storage.objects for select to authenticated
  using (bucket_id = 'supplier-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
drop policy if exists p_docs_del on storage.objects;
create policy p_docs_del on storage.objects for delete to authenticated
  using (bucket_id = 'supplier-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));


-- ========== categories (icon/image override per website section) ==========
create table if not exists public.categories (
  slug text primary key,
  image_url text,
  icon_url text,
  updated_at timestamptz not null default now()
);

-- ========== offers & discounts ==========
create table if not exists public.offers (
  id bigint generated always as identity primary key,
  title_ar text not null,
  title_en text,
  body_ar text,
  body_en text,
  category text,
  discount_label text,          -- e.g. "خصم 10%" or "-500 ج/طن"
  old_price numeric(14,2),
  new_price numeric(14,2),
  unit_ar text,
  unit_en text,
  image_url text,
  starts_on date default current_date,
  ends_on date,
  active boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
alter table public.offers enable row level security;
drop policy if exists p_cat_public on public.categories;
create policy p_cat_public on public.categories for select using (true);
drop policy if exists p_cat_staff on public.categories;
create policy p_cat_staff on public.categories for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_off_public on public.offers;
create policy p_off_public on public.offers for select using ((active and (ends_on is null or ends_on >= current_date)) or public.is_staff());
drop policy if exists p_off_staff on public.offers;
create policy p_off_staff on public.offers for all using (public.is_staff()) with check (public.is_staff());

-- public images (products, offers, icons): anyone can view, only staff can upload
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists p_media_staff on storage.objects;
create policy p_media_staff on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.is_staff()) with check (bucket_id = 'media' and public.is_staff());

-- ========== dashboard numbers ==========
create or replace view public.quote_stats with (security_invoker = true) as
  select status, count(*)::int as n, coalesce(sum(quoted_amount),0) as amount,
         count(*) filter (where created_at > now() - interval '30 days')::int as n30
  from public.quote_requests group by status;

-- After you sign up on /account with your own email, make yourself admin (run once):
-- update public.profiles set role = 'admin' where email = 'YOUR-EMAIL@example.com';

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

-- K Plus: automatic WhatsApp alert to the sales phone for every new request (via CallMeBot).
-- Phone + API key are entered from the dashboard (المستخدمين والصلاحيات > تنبيهات واتساب).
create extension if not exists pg_net;

create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists p_settings_admin on public.app_settings;
create policy p_settings_admin on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.app_settings to authenticated;
revoke all on public.app_settings from anon;

create or replace function public.wa_notify(msg text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare ph text; k text;
begin
  select value into ph from public.app_settings where key = 'callmebot_phone';
  select value into k from public.app_settings where key = 'callmebot_apikey';
  if coalesce(ph, '') = '' or coalesce(k, '') = '' then return; end if;
  perform net.http_get(
    url := 'https://api.callmebot.com/whatsapp.php',
    params := jsonb_build_object('phone', ph, 'apikey', k, 'text', left(msg, 1500))
  );
exception when others then
  raise warning 'wa_notify failed: %', sqlerrm;  -- never block saving a request
end $$;
revoke execute on function public.wa_notify(text) from public, anon, authenticated;

create or replace function public.notify_new_quote() returns trigger
language plpgsql security definer set search_path = public as $$
declare site text; ctype text;
begin
  select coalesce(nullif(value, ''), 'https://kplussupply.netlify.app') into site from public.app_settings where key = 'site_url';
  site := coalesce(site, 'https://kplussupply.netlify.app');
  ctype := case new.customer_type when 'developer' then 'مطور عقاري' when 'contractor' then 'مقاول' when 'supplier' then 'مورد'
                                  when 'factory' then 'مصنع' when 'concrete_plant' then 'محطة خرسانة' else null end;
  perform public.wa_notify(concat_ws(E'\n',
    '🔔 طلب جديد #' || new.id || case when new.source = 'whatsapp' then ' (من زرار واتساب)' else ' (من فورم الموقع)' end,
    'الاسم: ' || new.name,
    'الموبايل: ' || new.phone,
    'الشركة: ' || new.company,
    'النشاط: ' || ctype,
    'المنتج: ' || new.product,
    'الكمية: ' || new.quantity,
    'الموقع: ' || new.location,
    'اللوكيشن: ' || new.map_url,
    'ملاحظات: ' || left(new.notes, 300),
    'افتح الطلب: ' || site || '/admin/quotes/?id=' || new.id));
  return new;
exception when others then
  raise warning 'notify_new_quote failed: %', sqlerrm;
  return new;
end $$;
revoke execute on function public.notify_new_quote() from public, anon, authenticated;
drop trigger if exists quote_notify on public.quote_requests;
create trigger quote_notify after insert on public.quote_requests for each row execute function public.notify_new_quote();

-- admin-only test button
create or replace function public.wa_notify_test() returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  perform public.wa_notify('✅ تجربة تنبيهات كي بلس: الرسايل هتوصلك هنا مع كل طلب جديد.');
  return 'sent';
end $$;
revoke execute on function public.wa_notify_test() from public, anon;
grant execute on function public.wa_notify_test() to authenticated;

-- ========== API grants ==========
-- Newer Supabase projects may not expose new tables to the API automatically.
-- These grants are the standard Supabase defaults; Row Level Security above still decides what each user can do.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
-- keep the WhatsApp alert internals private (the blanket grant above would otherwise expose them)
revoke execute on function public.wa_notify(text) from public, anon, authenticated;
revoke execute on function public.notify_new_quote() from public, anon, authenticated;
revoke execute on function public.wa_notify_test() from public, anon;
