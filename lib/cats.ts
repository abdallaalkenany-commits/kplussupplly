// Website sections = built-in categories (lib/data.json) + sections added in /admin/categories/,
// minus anything hidden there. Cached per request so every component sees the same list.
import { cache } from "react";
import { CATEGORIES, ICONS, type Category, type Lang } from "./content";
import { getCategoryRows, type DbCategoryRow } from "./db";

export type CatView = { all: Category[]; top: Category[]; menu: Category[] };
export type SiteCats = { ar: CatView; en: CatView; by: (slug: string, lang?: Lang) => Category | undefined; custom: Set<string> };

const DEFAULT_ICON = Object.keys(ICONS)[0];

// Blocks are separated by a blank line; a block whose first line starts with "#" uses it as the heading.
export function parseBody(text?: string | null): [string, string][] {
  if (!text?.trim()) return [];
  return text.replace(/\r/g, "").split(/\n\s*\n/).map((block): [string, string] => {
    const lines = block.trim().split("\n");
    if (/^#/.test(lines[0])) return [lines[0].replace(/^#+\s*/, "").trim(), lines.slice(1).join(" ").trim()];
    return ["", lines.join(" ").trim()];
  }).filter(([h, p]) => h || p);
}

function fromRow(r: DbCategoryRow): Category {
  const block = (l: Lang) => {
    const nav = (l === "ar" ? r.nav_ar : r.nav_en) || r.nav_ar || r.slug;
    const pick = (k: "h1" | "title" | "desc" | "lead" | "body") => (r[`${k}_${l}` as keyof DbCategoryRow] as string | null) || (r[`${k}_ar` as keyof DbCategoryRow] as string | null);
    const lead = pick("lead") || "";
    return {
      nav, h1: pick("h1") || nav, lead,
      title: pick("title") || `${nav} | ${l === "ar" ? "كي بلس" : "K Plus"}`,
      desc: pick("desc") || lead.slice(0, 160),
      body: parseBody(pick("body")), products: [], faq: [],
    };
  };
  return { slug: r.slug, icon: r.icon && ICONS[r.icon] ? r.icon : DEFAULT_ICON, parent: r.parent || null, menu: r.menu !== false, ar: block("ar"), en: block("en") };
}

export const getSiteCats = cache(async (): Promise<SiteCats> => {
  const rows = await getCategoryRows();
  const hidden = new Set(rows.filter((r) => r.hidden).map((r) => r.slug));
  const customRows = rows.filter((r) => r.custom && r.nav_ar).sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
  const custom = new Set(customRows.map((r) => r.slug));
  const enOk = new Set(CATEGORIES.map((c) => c.slug).concat(customRows.filter((r) => r.nav_en).map((r) => r.slug)));
  const list = [...CATEGORIES.filter((c) => !custom.has(c.slug)), ...customRows.map(fromRow)];
  // a section is visible only if it and its parent are not hidden
  const visible = list.filter((c) => !hidden.has(c.slug) && !(c.parent && hidden.has(c.parent)));
  const view = (l: Lang): CatView => {
    const all = l === "ar" ? visible : visible.filter((c) => enOk.has(c.slug));
    const top = all.filter((c) => c.parent === null);
    return { all, top, menu: top.filter((c) => c.menu !== false) };
  };
  const ar = view("ar"), en = view("en");
  return { ar, en, custom, by: (slug, lang = "ar") => (lang === "ar" ? ar : en).all.find((c) => c.slug === slug) };
});
