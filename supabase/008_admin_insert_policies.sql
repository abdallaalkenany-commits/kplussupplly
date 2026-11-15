-- 008: let admin/sales staff add rows from the dashboard (fixes
-- "new row violates row-level security policy for table suppliers").
-- Safe to run more than once.

-- suppliers: staff can add any supplier (self sign-up policy stays as is)
drop policy if exists p_sup_staff_insert on public.suppliers;
create policy p_sup_staff_insert on public.suppliers for insert to authenticated
  with check (public.is_staff());

-- quote requests: staff can add a request manually with any status/assignee
drop policy if exists p_quotes_staff_insert on public.quote_requests;
create policy p_quotes_staff_insert on public.quote_requests for insert to authenticated
  with check (public.is_staff());

-- supplier documents: staff can upload files into any supplier's folder
drop policy if exists p_docs_staff_insert on storage.objects;
create policy p_docs_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'supplier-docs' and public.is_staff());

select 'ok: staff can now add suppliers and quotes from the dashboard' as result;
