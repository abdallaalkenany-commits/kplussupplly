import type { Lang } from "@/lib/content";
import { getPartners } from "@/lib/db";
import { BRANDS, CLIENTS, type Partner } from "@/lib/partners";

// /assets/ is cached for a year, so bump this whenever a built-in logo file is replaced
const LOGO_VERSION = 2;

type Logo = { key: string; src: string; ar: string; en: string; w?: number; h?: number };

const builtIn = (list: Partner[]): Logo[] =>
  list.map(([slug, ar, en, w, h]) => ({ key: slug, src: `/assets/partners/${slug}.webp?v=${LOGO_VERSION}`, ar, en, w, h }));

// Infinite logo marquee in pure CSS (no client JS). The list is rendered twice so the
// loop is seamless; the copy is hidden from screen readers. Pauses on hover/focus and
// becomes a static wrapped grid for visitors who prefer reduced motion.
function Row({ items, lang, reverse }: { items: Logo[]; lang: Lang; reverse?: boolean }) {
  const logos = (copy: boolean) =>
    items.map((p) => {
      const name = lang === "ar" ? p.ar : p.en || p.ar;
      return (
        <li className={"mq-item" + (copy ? " mq-dup" : "")} key={(copy ? "d-" : "") + p.key} aria-hidden={copy || undefined}>
          <img src={p.src} alt={copy ? "" : name} title={name} width={p.w} height={p.h} loading="lazy" decoding="async" />
        </li>
      );
    });
  return (
    <div className={"marquee" + (reverse ? " rev" : "")} dir="ltr" style={{ ["--dur" as string]: `${Math.max(items.length, 6) * 4.5}s` }}>
      <ul className="mq-track">{logos(false)}{logos(true)}</ul>
    </div>
  );
}

export default async function Partners({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  // admin-managed list when the partners table has rows; otherwise the built-in logos
  const db = await getPartners();
  const toLogo = (kind: "client" | "brand") =>
    (db || []).filter((p) => p.kind === kind).map((p) => ({ key: String(p.id), src: p.logo_url, ar: p.name_ar, en: p.name_en || p.name_ar }));
  const clients = db ? toLogo("client") : builtIn(CLIENTS);
  const brands = db ? toLogo("brand") : builtIn(BRANDS);
  if (!clients.length && !brands.length) return null;
  return (
    <section className="partners" aria-label={ar ? "شركاء النجاح والوكالات" : "Clients and brands"}>
      {clients.length > 0 && <>
        <div className="wrap ptitle">
          <h2>{ar ? "شركاء النجاح" : "Partners in Success"}</h2>
          <p>{ar ? "شركات مقاولات ومطورين عقاريين بنوردلهم مواد البناء في مشروعاتهم." : "Contractors and developers we supply on their projects."}</p>
        </div>
        <Row items={clients} lang={lang} />
      </>}
      {brands.length > 0 && <>
        <div className="wrap ptitle">
          <h2>{ar ? "وكلاء وموزعون" : "Agents & Distributors"}</h2>
          <p>{ar ? "براندات ومصانع بنوزّع منتجاتها للمشروعات في مصر." : "Brands and manufacturers whose products we distribute to projects in Egypt."}</p>
        </div>
        <Row items={brands} lang={lang} reverse />
      </>}
    </section>
  );
}
