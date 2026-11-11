-- 006: admin-managed partner logos and site design settings.
-- Safe to run more than once. Run in Supabase → SQL Editor.

-- ========== partners (clients / agents & distributors logo strips) ==========
create table if not exists public.partners (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('client', 'brand')),
  name_ar text not null,
  name_en text,
  logo_url text not null,
  website text,
  sort int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.partners enable row level security;
drop policy if exists p_partners_public on public.partners;
create policy p_partners_public on public.partners for select using (active or public.is_staff());
drop policy if exists p_partners_staff on public.partners;
create policy p_partners_staff on public.partners for all using (public.is_staff()) with check (public.is_staff());

-- seed with the logos already on the site (only when the table is empty)
insert into public.partners (kind, name_ar, name_en, logo_url, sort)
select * from (values
  ('client', 'الخرافي ناشيونال', 'Kharafi National', '/assets/partners/kharafi-national.webp?v=2', 10),
  ('client', 'سوديك', 'SODIC', '/assets/partners/sodic.webp?v=2', 20),
  ('client', 'اتحاد المقاولين CCC', 'Consolidated Contractors (CCC)', '/assets/partners/ccc.webp?v=2', 30),
  ('client', 'ريدكون للإنشاءات', 'Redcon Construction', '/assets/partners/redcon.webp?v=2', 40),
  ('client', 'الحاذق للإنشاءات', 'El Hazek Construction', '/assets/partners/el-hazek.webp?v=2', 50),
  ('client', 'مافن للتطوير العقاري', 'Maven Developments', '/assets/partners/maven.webp?v=2', 60),
  ('client', 'مباني إدريس', 'Mabany Edris', '/assets/partners/mabany-edris.webp?v=2', 70),
  ('client', 'جدار للإنشاء والتطوير', 'Jidaar Construction & Development', '/assets/partners/jidaar.webp?v=2', 80),
  ('client', 'دار العالمية للإنشاءات', 'Dar Al Alamia Construction', '/assets/partners/dar-al-alamia.webp?v=2', 90),
  ('client', 'الجنيدي للإنشاءات', 'Genedy Construction', '/assets/partners/genedy.webp?v=2', 100),
  ('client', 'الشركة المصرية لإنشاء وصيانة مرافق النقل والمطارات (Smart Roads)', 'Smart Roads', '/assets/partners/smart-roads.webp?v=2', 110),
  ('client', 'شركة شمال الصعيد للمقاولات العامة', 'North Upper Egypt Contracting (E.J.C)', '/assets/partners/ejc-north-upper-egypt.webp?v=2', 120),
  ('brand', 'إيديال ستاندرد', 'Ideal Standard', '/assets/partners/ideal-standard.webp?v=2', 10),
  ('brand', 'سيراميكا كليوباترا', 'Ceramica Cleopatra', '/assets/partners/cleopatra.webp?v=2', 20),
  ('brand', 'جيما للسيراميك والبورسلين', 'Gemma Ceramic & Porcelain', '/assets/partners/gemma.webp?v=2', 30),
  ('brand', 'تشامسان باركيه', 'Çamsan Parkelam', '/assets/partners/camsan.webp?v=2', 40),
  ('brand', 'تيراكليك', 'TerraClick', '/assets/partners/terraclick.webp?v=2', 50),
  ('brand', 'فاريوكليك', 'VarioClic', '/assets/partners/varioclic.webp?v=2', 60),
  ('brand', 'BMIC لصناعات مواد البناء', 'BMIC Building Materials', '/assets/partners/bmic.webp?v=2', 70),
  ('brand', 'أسمنت مصر بني سويف', 'Misr Beni Suef Cement', '/assets/partners/misr-beni-suef-cement.webp?v=2', 80),
  ('brand', 'أسمنت العامرية', 'Amreyah Cement', '/assets/partners/amreyah-cement.webp?v=2', 90)
) as v(kind, name_ar, name_en, logo_url, sort)
where not exists (select 1 from public.partners);

-- ========== site design (one row, edited from /admin/design/) ==========
create table if not exists public.site_design (
  id int primary key default 1 check (id = 1),
  logo_url text,          -- header logo (replaces the K mark + KPLUS word)
  logo_white_url text,    -- footer logo on the dark background
  favicon_url text,       -- browser tab icon
  color_primary text,     -- main colour (default navy #0B2545)
  color_accent text,      -- buttons / highlights (default orange #F29F05)
  hero_title_ar text, hero_text_ar text,
  hero_title_en text, hero_text_en text,
  hero_img_1 text, hero_img_2 text, hero_img_3 text, hero_img_4 text,
  show_partners boolean not null default true,
  show_offers boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.site_design (id) values (1) on conflict (id) do nothing;
alter table public.site_design enable row level security;
drop policy if exists p_design_public on public.site_design;
create policy p_design_public on public.site_design for select using (true);
drop policy if exists p_design_admin on public.site_design;
create policy p_design_admin on public.site_design for update using (public.is_admin()) with check (public.is_admin());
drop trigger if exists design_touch on public.site_design;
create trigger design_touch before update on public.site_design for each row execute function public.touch_updated_at();
