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
