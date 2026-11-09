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
