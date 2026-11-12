import type { MetadataRoute } from "next";
import { CONTENT_UPDATED, D, PRICES_MIN, upath } from "@/lib/content";
import { GUIDES } from "@/lib/guides";
import { getPricedProducts } from "@/lib/db";
import { getSiteCats } from "@/lib/cats";

// re-check hourly so /prices/ and sections added/hidden in the admin panel are reflected
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updated = new Date(CONTENT_UPDATED);
  const cats = await getSiteCats();
  const enSet = new Set(cats.en.all.map((c) => c.slug));
  const pages: [string, number][] = [["", 1], ["offers", 0.8], ["calculator", 0.7], ["contact", 0.7], ["suppliers", 0.6], ["about", 0.5]];
  const entry = (s: string, p: number, langs: ("ar" | "en")[]) => langs.map((lang) => ({
    url: D + upath(lang, s), lastModified: updated, priority: lang === "ar" ? p : Math.round((p - 0.1) * 10) / 10,
    alternates: { languages: langs.length > 1
      ? { "ar-EG": D + upath("ar", s), "en-EG": D + upath("en", s), "x-default": D + upath("ar", s) }
      : { "ar-EG": D + upath("ar", s), "x-default": D + upath("ar", s) } },
  }));
  const fixed = pages.flatMap(([s, p]) => entry(s, p, ["ar", "en"]));
  // only visible sections; English URL only when the section has English texts
  const sections = cats.ar.all.flatMap((c) => entry(c.slug, c.parent ? 0.8 : 0.9, enSet.has(c.slug) ? ["ar", "en"] : ["ar"]));
  const guides = [
    { url: D + "/guides/", lastModified: updated, priority: 0.6 },
    ...GUIDES.map((g) => ({ url: D + `/guides/${g.slug}/`, lastModified: new Date(g.updated), priority: 0.6 })),
  ];
  const priced = await getPricedProducts();
  const prices = priced.length >= PRICES_MIN
    ? [{ url: D + "/prices/", lastModified: new Date(priced.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), "")), priority: 0.9 }]
    : [];
  return [...fixed, ...sections, ...prices, ...guides];
}
