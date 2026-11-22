-- K Plus: record what the visitor did after tapping a WhatsApp button
-- (closed the pop-up, opened WhatsApp without details, opened it and left a number...).
-- Shown in /admin/whatsapp/ as "اللي حصل بعد الضغطة". Safe to run more than once.
alter table public.wa_clicks add column if not exists click_id uuid;
alter table public.wa_clicks add column if not exists outcome text;
alter table public.wa_clicks drop constraint if exists wa_clicks_outcome_chk;
alter table public.wa_clicks add constraint wa_clicks_outcome_chk
  check (outcome is null or outcome in ('closed', 'direct', 'lead', 'known', 'form'));
create unique index if not exists wa_clicks_click_id_idx on public.wa_clicks (click_id) where click_id is not null;

-- Visitors can't update wa_clicks directly. This function only fills an empty outcome
-- for the click the browser just made (matched by its random click_id, within 2 hours).
create or replace function public.wa_set_outcome(p_click uuid, p_outcome text)
returns void language sql security definer set search_path = public as $$
  update public.wa_clicks set outcome = p_outcome
  where click_id = p_click and outcome is null
    and p_outcome in ('closed', 'direct', 'lead', 'known')
    and created_at > now() - interval '2 hours';
$$;
revoke all on function public.wa_set_outcome(uuid, text) from public;
grant execute on function public.wa_set_outcome(uuid, text) to anon, authenticated;
