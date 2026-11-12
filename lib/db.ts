import { createClient } from "@supabase/supabase-js";

// Public read-only data for website pages (products, offers, category media).
// Falls back to the built-in content when Supabase is not connected yet.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const pub = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export type DbProduct = {
  id: number; category: string; name_ar: string; name_en: string | null; spec_ar: string | null; spec_en: string | null;
  unit_ar: string | null; unit_en: string | null; price: number | null; show_price: boolean; image_url: string | null;
};
export type DbOffer = {
  id: number; title_ar: string; title_en: string | null; body_ar: string | null; body_en: string | null; category: string | null;
  discount_label: string | null; old_price: number | null; new_price: number | null; unit_ar: string | null; unit_en: string | null;
  image_url: string | null; ends_on: string | null;
};
export type DbCategory = { slug: string; image_url: string | null; icon_url: string | null };

export async function getProducts(category: string): Promise<DbProduct[] | null> {
  if (!pub) return null;
  const { data, error } = await pub.from("products").select("*").eq("active", true).eq("category", category).order("sort").order("id");
  if (error) return null;
  return data as DbProduct[];
}

export type DbPricedProduct = DbProduct & { updated_at: string };

// Products whose price the team chose to show (admin → products → "اعرض السعر على الموقع").
// Feeds the /prices/ page; the page stays noindex until enough prices are published.
export async function getPricedProducts(): Promise<DbPricedProduct[]> {
  if (!pub) return [];
  const { data, error } = await pub.from("products").select("*").eq("active", true).eq("show_price", true)
    .not("price", "is", null).order("category").order("sort").order("id");
  return error ? [] : (data as DbPricedProduct[]);
}

export type DbCategoryRow = DbCategory & {
  hidden?: boolean; custom?: boolean; parent?: string | null; sort?: number; menu?: boolean; icon?: string | null;
  nav_ar?: string | null; nav_en?: string | null; h1_ar?: string | null; h1_en?: string | null;
  title_ar?: string | null; title_en?: string | null; desc_ar?: string | null; desc_en?: string | null;
  lead_ar?: string | null; lead_en?: string | null; body_ar?: string | null; body_en?: string | null;
};

// All section rows (image/icon overrides, hidden flags and admin-added sections).
export async function getCategoryRows(): Promise<DbCategoryRow[]> {
  if (!pub) return [];
  const { data, error } = await pub.from("categories").select("*");
  return error ? [] : (data as DbCategoryRow[]);
}

export type DbPartner = { id: number; kind: "client" | "brand"; name_ar: string; name_en: string | null; logo_url: string; website: string | null };

// Partner logos managed from /admin/partners/. Null = table missing or empty, so callers use the built-in list.
export async function getPartners(): Promise<DbPartner[] | null> {
  if (!pub) return null;
  const { data, error } = await pub.from("partners").select("id,kind,name_ar,name_en,logo_url,website")
    .eq("active", true).order("sort").order("id");
  return error || !data?.length ? null : (data as DbPartner[]);
}

export type DbDesign = {
  logo_url: string | null; logo_white_url: string | null; favicon_url: string | null;
  color_primary: string | null; color_accent: string | null;
  hero_title_ar: string | null; hero_text_ar: string | null; hero_title_en: string | null; hero_text_en: string | null;
  hero_img_1: string | null; hero_img_2: string | null; hero_img_3: string | null; hero_img_4: string | null;
  show_partners: boolean; show_offers: boolean;
};

// Site design set from /admin/design/. Returns {} when not configured so every field falls back to the built-in design.
export async function getDesign(): Promise<Partial<DbDesign>> {
  if (!pub) return {};
  const { data, error } = await pub.from("site_design").select("*").eq("id", 1).maybeSingle();
  return error || !data ? {} : (data as DbDesign);
}

export async function getOffers(): Promise<DbOffer[]> {
  if (!pub) return [];
  const { data, error } = await pub.from("offers").select("*").order("sort").order("id", { ascending: false });
  return error ? [] : (data as DbOffer[]);
}

export async function getCategoryMedia(): Promise<Record<string, DbCategory>> {
  if (!pub) return {};
  const { data } = await pub.from("categories").select("slug,image_url,icon_url");
  const map: Record<string, DbCategory> = {};
  (data || []).forEach((c: DbCategory) => (map[c.slug] = c));
  return map;
}

export async function saveQuote(row: Record<string, string | null>) {
  if (!pub) return { ok: false, configured: false };
  const { error } = await pub.from("quote_requests").insert(row);
  return { ok: !error, configured: true, error: error?.message };
}
