-- 010 (2026-11-16): suppliers add their own products (with photos and an optional price) inside the sections
-- K Plus allowed them. The supplier's price is private (supplier_items); the website price = supplier price + markup
-- (app_settings.supplier_markup_pct, default 15%). New/changed products wait for K Plus approval (products.active).
-- Safe to run more than once.

insert into public.app_settings (key, value) values ('supplier_markup_pct', '15') on conflict (key) do nothing;

create table if not exists public.supplier_items (
  product_id bigint primary key references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_price numeric(14,2),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  updated_at timestamptz not null default now()
);
create index if not exists supplier_items_supplier_idx on public.supplier_items (supplier_id);
alter table public.supplier_items enable row level security;
drop policy if exists p_si_staff on public.supplier_items;
create policy p_si_staff on public.supplier_items for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_si_own on public.supplier_items;
create policy p_si_own on public.supplier_items for select using (supplier_id in (select public.my_supplier_ids()));
revoke all on public.supplier_items from anon;
grant select, insert, update, delete on public.supplier_items to authenticated;

-- approved supplier row of the signed-in user (or null)
create or replace function public.my_approved_supplier() returns public.suppliers
language sql stable security definer set search_path = public as $$
  select * from public.suppliers where user_id = auth.uid() and status = 'approved' limit 1;
$$;

create or replace function public.supplier_markup() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select nullif(value, '')::numeric from public.app_settings where key = 'supplier_markup_pct'), 15);
$$;

-- a supplier may use a section if it, or its parent section, is in his categories
create or replace function public.supplier_cat_ok(cats text[], cat text) returns boolean
language sql immutable as $$
  select cat = any(coalesce(cats, '{}')) or (position('/' in cat) > 0 and split_part(cat, '/', 1) = any(coalesce(cats, '{}')));
$$;

-- suppliers can no longer change their sections once K Plus approved them (sections = permissions)
create or replace function public.protect_supplier() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    new.status := old.status; new.rating := old.rating; new.internal_notes := old.internal_notes; new.user_id := old.user_id;
    if old.status = 'approved' then new.categories := old.categories; end if;
  end if;
  return new;
end $$;

create or replace function public.supplier_save_product(
  p_id bigint, p_category text, p_name_ar text, p_name_en text, p_spec_ar text, p_unit_ar text, p_image_url text, p_price numeric
) returns bigint
language plpgsql security definer set search_path = public as $$
declare s public.suppliers%rowtype; pid bigint := p_id; site_price numeric; changed boolean := true; old public.products%rowtype;
begin
  s := public.my_approved_supplier();
  if s.id is null then raise exception 'حسابك لسه مش معتمد من كي بلس'; end if;
  if not public.supplier_cat_ok(s.categories, p_category) then raise exception 'القسم ده مش ضمن الأقسام المسموحة لحسابك'; end if;
  if char_length(coalesce(trim(p_name_ar), '')) < 2 or char_length(p_name_ar) > 200 then raise exception 'اسم المنتج لازم يكون بين 2 و200 حرف'; end if;
  if char_length(coalesce(p_spec_ar, '')) > 1000 or char_length(coalesce(p_name_en, '')) > 200 or char_length(coalesce(p_unit_ar, '')) > 50 then raise exception 'النص طويل زيادة'; end if;
  if p_image_url is not null and p_image_url <> ''
     and p_image_url not like '%/storage/v1/object/public/media/suppliers/' || auth.uid()::text || '/%' then
    raise exception 'الصورة لازم تترفع من صفحتك';
  end if;
  if p_price is not null and (p_price < 0 or p_price > 100000000) then raise exception 'السعر مش صحيح'; end if;
  site_price := case when p_price > 0 then round(p_price * (1 + public.supplier_markup() / 100)) else null end;

  if pid is null then
    insert into public.products (category, name_ar, name_en, spec_ar, unit_ar, image_url, price, show_price, active, sort)
    values (p_category, trim(p_name_ar), nullif(trim(p_name_en), ''), nullif(trim(p_spec_ar), ''), nullif(trim(p_unit_ar), ''),
            nullif(p_image_url, ''), site_price, site_price is not null, false, 500)
    returning id into pid;
    insert into public.supplier_items (product_id, supplier_id, supplier_price, status) values (pid, s.id, nullif(p_price, 0), 'pending');
  else
    if not exists (select 1 from public.supplier_items where product_id = pid and supplier_id = s.id) then raise exception 'المنتج مش بتاعك'; end if;
    select * into old from public.products where id = pid;
    changed := old.category is distinct from p_category or old.name_ar is distinct from trim(p_name_ar)
      or old.name_en is distinct from nullif(trim(p_name_en), '') or old.spec_ar is distinct from nullif(trim(p_spec_ar), '')
      or old.unit_ar is distinct from nullif(trim(p_unit_ar), '') or old.image_url is distinct from nullif(p_image_url, '');
    update public.products set category = p_category, name_ar = trim(p_name_ar), name_en = nullif(trim(p_name_en), ''),
      spec_ar = nullif(trim(p_spec_ar), ''), unit_ar = nullif(trim(p_unit_ar), ''), image_url = nullif(p_image_url, ''),
      price = site_price, show_price = site_price is not null,
      active = case when changed then false else active end
    where id = pid;
    update public.supplier_items set supplier_price = nullif(p_price, 0), updated_at = now(),
      status = case when changed then 'pending' else status end
    where product_id = pid;
  end if;

  if changed then
    perform public.wa_notify('🆕 المورد ' || s.company_name || (case when p_id is null then ' ضاف منتج' else ' عدّل منتج' end)
      || ' محتاج موافقتك: ' || trim(p_name_ar) || E'\nافتح: https://kplussupply.com/admin/products/');
  end if;
  return pid;
end $$;

create or replace function public.supplier_delete_product(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare s public.suppliers%rowtype;
begin
  s := public.my_approved_supplier();
  if s.id is null or not exists (select 1 from public.supplier_items where product_id = p_id and supplier_id = s.id) then
    raise exception 'المنتج مش بتاعك';
  end if;
  delete from public.products where id = p_id;
end $$;

-- what the supplier sees: his own price and the review status (never the website price)
create or replace function public.supplier_my_products()
returns table (id bigint, category text, name_ar text, name_en text, spec_ar text, unit_ar text, image_url text,
               supplier_price numeric, status text, published boolean, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.category, p.name_ar, p.name_en, p.spec_ar, p.unit_ar, p.image_url, si.supplier_price, si.status, p.active, si.updated_at
  from public.supplier_items si join public.products p on p.id = si.product_id
  where si.supplier_id in (select public.my_supplier_ids())
  order by si.updated_at desc;
$$;

-- K Plus approves by ticking "ظاهر على الموقع" in /admin/products/
create or replace function public.supplier_item_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.active is distinct from old.active then
    update public.supplier_items set status = case when new.active then 'approved' else status end, updated_at = now()
    where product_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists products_supplier_status on public.products;
create trigger products_supplier_status after update of active on public.products for each row execute function public.supplier_item_status();

-- product photos: an approved supplier may upload into media/suppliers/<his user id>/
drop policy if exists p_media_supplier_insert on storage.objects;
create policy p_media_supplier_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'suppliers'
              and (storage.foldername(name))[2] = auth.uid()::text
              and exists (select 1 from public.suppliers where user_id = auth.uid() and status = 'approved'));

revoke execute on function public.supplier_save_product(bigint, text, text, text, text, text, text, numeric) from public, anon;
grant execute on function public.supplier_save_product(bigint, text, text, text, text, text, text, numeric) to authenticated;
revoke execute on function public.supplier_delete_product(bigint) from public, anon;
grant execute on function public.supplier_delete_product(bigint) to authenticated;
revoke execute on function public.supplier_my_products() from public, anon;
grant execute on function public.supplier_my_products() to authenticated;
revoke execute on function public.my_approved_supplier() from public, anon;
grant execute on function public.my_approved_supplier() to authenticated;
revoke execute on function public.supplier_markup() from public, anon, authenticated;
revoke execute on function public.supplier_item_status() from public, anon, authenticated;
