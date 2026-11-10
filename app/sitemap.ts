import type { MetadataRoute } from "next";
import { CATEGORIES, CONTENT_UPDATED, D, upath } from "@/lib/content";
import { GUIDES } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(CONTENT_UPDATED);
  const slugs: [string, number][] = [["", 1], ["offers", 0.8], ["calculator", 0.7], ["contact", 0.7], ["suppliers", 0.6], ["about", 0.5],
    ...CATEGORIES.map((c) => [c.slug, c.parent ? 0.8 : 0.9] as [string, number])];
  const bilingual = slugs.flatMap(([s, p]) => (["ar", "en"] as const).map((lang) => ({
    url: D + upath(lang, s), lastModified: updated, priority: lang === "ar" ? p : Math.round((p - 0.1) * 10) / 10,
    alternates: { languages: { "ar-EG": D + upath("ar", s), "en-EG": D + upath("en", s), "x-default": D + upath("ar", s) } },
  })));
  const guides = [
    { url: D + "/guides/", lastModified: updated, priority: 0.6 },
    ...GUIDES.map((g) => ({ url: D + `/guides/${g.slug}/`, lastModified: new Date(g.updated), priority: 0.6 })),
  ];
  return [...bilingual, ...guides];
}
