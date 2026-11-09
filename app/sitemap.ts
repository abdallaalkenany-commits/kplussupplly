import type { MetadataRoute } from "next";
import { CATEGORIES, D, upath } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs: [string, number][] = [["", 1], ["offers", 0.8], ["contact", 0.7], ["suppliers", 0.6], ["about", 0.5],
    ...CATEGORIES.map((c) => [c.slug, c.parent ? 0.8 : 0.9] as [string, number])];
  const now = new Date();
  return slugs.flatMap(([s, p]) => (["ar", "en"] as const).map((lang) => ({
    url: D + upath(lang, s), lastModified: now, priority: lang === "ar" ? p : Math.round((p - 0.1) * 10) / 10,
    alternates: { languages: { "ar-EG": D + upath("ar", s), "en-EG": D + upath("en", s), "x-default": D + upath("ar", s) } },
  })));
}
