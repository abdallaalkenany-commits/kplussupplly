"use client";
// Every website section for browser forms (supplier sign-up, admin supplier permissions, supplier products):
// the built-in sections from lib/data.json plus the ones added in /admin/categories/, minus hidden ones.
// Sub-sections come right after their parent and are labelled "parent ← child".
import { useEffect, useState } from "react";
import { sb, sbConfigured } from "@/lib/supabase/client";
import { CATEGORIES, type Lang } from "@/lib/content";

export type SectionOpt = { slug: string; parent: string | null; label: string; name: string };

type Row = { slug: string; parent: string | null; custom: boolean | null; hidden: boolean | null; nav_ar: string | null; nav_en: string | null; sort: number | null };

function build(rows: Row[], lang: Lang): SectionOpt[] {
  const hidden = new Set(rows.filter((r) => r.hidden).map((r) => r.slug));
  const custom = rows.filter((r) => r.custom && r.nav_ar).sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100));
  const customSet = new Set(custom.map((r) => r.slug));
  const all = [
    ...CATEGORIES.filter((c) => !customSet.has(c.slug)).map((c) => ({ slug: c.slug, parent: c.parent, name: c[lang].nav })),
    ...custom.map((r) => ({ slug: r.slug, parent: r.parent || null, name: (lang === "en" && r.nav_en) || r.nav_ar || r.slug })),
  ].filter((c) => !hidden.has(c.slug) && !(c.parent && hidden.has(c.parent)));
  const out: SectionOpt[] = [];
  const top = all.filter((c) => !c.parent);
  top.forEach((t) => {
    out.push({ ...t, label: t.name });
    all.filter((c) => c.parent === t.slug).forEach((ch) => out.push({ ...ch, label: `${t.name} ← ${ch.name}` }));
  });
  // children whose parent is not listed (should not happen) still appear
  all.filter((c) => c.parent && !top.some((t) => t.slug === c.parent)).forEach((c) => out.push({ ...c, label: c.name }));
  return out;
}

export function useSections(lang: Lang = "ar"): SectionOpt[] {
  const [opts, setOpts] = useState<SectionOpt[]>(() => build([], lang));
  useEffect(() => {
    if (!sbConfigured) return;
    sb().from("categories").select("slug,parent,custom,hidden,nav_ar,nav_en,sort").then(({ data, error }: { data: Row[] | null; error: unknown }) => {
      if (!error && data) setOpts(build(data, lang));
    });
  }, [lang]);
  return opts;
}

/** A supplier may use a section when it, or its parent section, is one of his allowed sections. */
export const sectionAllowed = (cats: string[] | null | undefined, slug: string) =>
  (cats || []).includes(slug) || (slug.includes("/") && (cats || []).includes(slug.split("/")[0]));
