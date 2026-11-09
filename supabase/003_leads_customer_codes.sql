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
