import type { Lang } from "@/lib/content";
import { BRANDS, CLIENTS, type Partner } from "@/lib/partners";

// Infinite logo marquee in pure CSS (no client JS). The list is rendered twice so the
// loop is seamless; the copy is hidden from screen readers. Pauses on hover/focus and
// becomes a static wrapped grid for visitors who prefer reduced motion.
function Row({ items, lang, reverse }: { items: Partner[]; lang: Lang; reverse?: boolean }) {
  const logos = (copy: boolean) =>
    items.map(([slug, ar, en, w, h]) => (
      <li className={"mq-item" + (copy ? " mq-dup" : "")} key={(copy ? "d-" : "") + slug} aria-hidden={copy || undefined}>
        <img src={`/assets/partners/${slug}.webp`} alt={copy ? "" : lang === "ar" ? ar : en} title={lang === "ar" ? ar : en}
          width={w} height={h} loading="lazy" decoding="async" />
      </li>
    ));
  return (
    <div className={"marquee" + (reverse ? " rev" : "")} dir="ltr" style={{ ["--dur" as string]: `${items.length * 4.5}s` }}>
      <ul className="mq-track">{logos(false)}{logos(true)}</ul>
    </div>
  );
}

export default function Partners({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  return (
    <section className="partners" aria-label={ar ? "شركاء النجاح والوكالات" : "Clients and brands"}>
      <div className="wrap ptitle">
        <h2>{ar ? "شركاء النجاح" : "Partners in Success"}</h2>
        <p>{ar ? "شركات مقاولات ومطورين عقاريين بنوردلهم مواد البناء في مشروعاتهم." : "Contractors and developers we supply on their projects."}</p>
      </div>
      <Row items={CLIENTS} lang={lang} />
      <div className="wrap ptitle">
        <h2>{ar ? "وكلاء وموزعون" : "Agents & Distributors"}</h2>
        <p>{ar ? "براندات ومصانع بنوزّع منتجاتها للمشروعات في مصر." : "Brands and manufacturers whose products we distribute to projects in Egypt."}</p>
      </div>
      <Row items={BRANDS} lang={lang} reverse />
    </section>
  );
}
