-- 007: manage website sections from /admin/categories/ (hide built-in sections, add/delete new ones).
-- Safe to run more than once. Only ADDS columns; existing image/icon overrides are kept.
alter table public.categories
  add column if not exists hidden boolean not null default false,  -- hide from menu, footer, cards, sitemap; page returns 404
  add column if not exists custom boolean not null default false,  -- true = section added from the admin panel
  add column if not exists parent text,                            -- parent section slug for sub-sections
  add column if not exists sort int not null default 100,
  add column if not exists menu boolean not null default true,      -- show in the header menu (top-level only)
  add column if not exists icon text,                              -- built-in icon name when no icon_url
  add column if not exists nav_ar text, add column if not exists nav_en text,
  add column if not exists h1_ar text, add column if not exists h1_en text,
  add column if not exists title_ar text, add column if not exists title_en text,
  add column if not exists desc_ar text, add column if not exists desc_en text,
  add column if not exists lead_ar text, add column if not exists lead_en text,
  add column if not exists body_ar text, add column if not exists body_en text;

-- reload the API schema cache so the new columns are usable immediately
notify pgrst, 'reload schema';
