import { catArt, prodArt } from "@/lib/art";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { C, CATEGORIES, CONTENT_UPDATED, D, GOVS, T, TOP, bySlug, upath, waLink, type Lang } from "@/lib/content";
import { GUIDES, guideBySlug, type Guide } from "@/lib/guides";
import Calculator from "./calculator";
import { getCategoryMedia, getOffers, getProducts } from "@/lib/db";
import { CatCards, Crumbs, Faq, Icon, JsonLd, Shell, money, orgSchema } from "./site";
import QuoteForm from "./quote-form";

const OPTIONS = (lang: Lang) => CATEGORIES.map((c) => c[lang].nav);

function Quote({ lang, preset }: { lang: Lang; preset?: string }) {
  const t = T[lang];
  return <QuoteForm lang={lang} t={{ f_name: t.f_name, f_phone: t.f_phone, f_cat: t.f_cat, f_qty: t.f_qty, f_loc: t.f_loc, f_note: t.f_note, f_send: t.f_send, f_hint: t.f_hint, form_h: t.form_h, wa_msg: t.wa_msg, ok: t.ok, err: t.err, q_send: t.q_send, q_hint: t.q_hint, wa_follow: t.wa_follow, f_company: t.f_company, f_ctype: t.f_ctype, ctypes: t.ctypes, f_map: t.f_map, f_map_btn: t.f_map_btn, f_map_ph: t.f_map_ph, f_map_ok: t.f_map_ok, f_map_err: t.f_map_err, f_prefill: t.f_prefill, f_more: t.f_more }} options={OPTIONS(lang)} preset={preset} wa={C.whatsapp} />;
}

function metaFor(lang: Lang, slug: string, title: string, description: string, noindex = false, arOnly = false): Metadata {
  const url = D + upath(lang, slug);
  const languages: Record<string, string> = arOnly
    ? { "ar-EG": D + upath("ar", slug), "x-default": D + upath("ar", slug) }
    : { "ar-EG": D + upath("ar", slug), "en-EG": D + upath("en", slug), "x-default": D + upath("ar", slug) };
  return {
    title: { absolute: title }, description,
    alternates: { canonical: url, languages },
    openGraph: { type: arOnly && slug.startsWith("guides/") ? "article" : "website", siteName: lang === "ar" ? C.brand_ar : C.brand_en, locale: lang === "ar" ? "ar_EG" : "en_US", title, description, url, images: [D + "/assets/og.png"] },
    twitter: { card: "summary_large_image" },
    robots: noindex ? { index: false } : { index: true, follow: true, "max-image-preview": "large" },
  };
}

export function pageMeta(lang: Lang, parts: string[] = []): Metadata {
  const t = T[lang];
  const slug = parts.join("/");
  if (!slug) return metaFor(lang, "", t.home_title, t.home_desc);
  if (slug === "about") return metaFor(lang, slug, t.about_title, t.about_desc);
  if (slug === "contact") return metaFor(lang, slug, t.contact_title, t.contact_desc);
  if (slug === "offers") return metaFor(lang, slug, t.offers_title, t.offers_desc);
  if (slug === "suppliers") return metaFor(lang, slug, t.suppliers_title, t.suppliers_desc);
  if (slug === "calculator") return metaFor(lang, slug, t.calc_title, t.calc_desc);
  if (lang === "ar" && slug === "guides") return metaFor(lang, slug, t.guides_title, t.guides_desc, false, true);
  if (lang === "ar" && slug.startsWith("guides/")) {
    const g = guideBySlug(parts[1]);
    if (g) return metaFor(lang, slug, g.title, g.desc, false, true);
  }
  const c = bySlug(slug);
  if (!c) return { title: t.nf_title, robots: { index: false } };
  return metaFor(lang, slug, c[lang].title, c[lang].desc);
}

export async function SitePage({ lang, parts = [] }: { lang: Lang; parts?: string[] }) {
  const slug = parts.join("/");
  let body: React.ReactNode;
  if (!slug) body = await Home({ lang });
  else if (slug === "about") body = <About lang={lang} />;
  else if (slug === "contact") body = <Contact lang={lang} />;
  else if (slug === "offers") body = await Offers({ lang });
  else if (slug === "suppliers") body = <Suppliers lang={lang} />;
  else if (slug === "calculator") body = <CalcPage lang={lang} />;
  else if (lang === "ar" && slug === "guides") body = <GuidesIndex />;
  else if (lang === "ar" && slug.startsWith("guides/") && guideBySlug(parts[1])) body = <GuidePage g={guideBySlug(parts[1])!} />;
  else {
    const c = bySlug(slug);
    if (!c) notFound();
    body = await CategoryPage({ lang, slug });
  }
  return <Shell lang={lang} slug={slug}>{body}</Shell>;
}

async function Home({ lang }: { lang: Lang }) {
  const t = T[lang];
  const media = await getCategoryMedia();
  const offers = (await getOffers()).slice(0, 3);
  const brands = ["Ideal Standard", "Cleopatra", "Al-Gawhara", "Obelisk"];
  const faqs = TOP.map((c) => c[lang].faq[0]);
  const site = { "@context": "https://schema.org", "@type": "WebSite", "@id": D + "/#website", url: D + upath(lang), name: lang === "ar" ? C.brand_ar : C.brand_en, inLanguage: lang + "-EG", publisher: { "@id": D + "/#business" } };
  return (
    <>
      <JsonLd data={[orgSchema(lang), site]} />
      <section className="hero"><div className="wrap">
        <h1>{t.hero_h}</h1><p className="lead">{t.hero_p}</p>
        <div className="actions"><a className="btn big" href="#quote">{t.contact}</a><a className="btn wa" href={waLink(t.wa_msg)} rel="noopener">{t.wa}</a></div>
        <ul className="badges"><li>{t.why_items[0][0]}</li><li>{t.why_items[2][0]}</li><li>{t.why_items[3][0]}</li></ul>
        <div className="hero-art" aria-hidden="true">{["cement", "doors", "ceramics", "ideal-standard"].map((s) => <img key={s} src={catArt(s)} alt="" width={800} height={600} />)}</div>
      </div></section>
      <section className="wrap"><h2>{t.cats}</h2><CatCards lang={lang} cats={TOP} media={media} /></section>
      {offers.length > 0 && (
        <section className="wrap"><div className="sechead"><h2>{t.offers}</h2><Link href={upath(lang, "offers")}>{t.browse} {lang === "ar" ? "←" : "→"}</Link></div><OfferGrid lang={lang} offers={offers} /></section>
      )}
      <section className="wrap"><h2>{t.how}</h2><ol className="steps">{t.how_items.map(([n, h, p]: string[]) => <li key={n}><span className="n">{n}</span><h3>{h}</h3><p>{p}</p></li>)}</ol></section>
      <section className="band"><div className="wrap"><h2>{t.why}</h2><div className="whys">{t.why_items.map(([h, p]: string[]) => <div className="why" key={h}><h3>{h}</h3><p>{p}</p></div>)}</div></div></section>
      <section className="wrap brands" aria-label="brands">{brands.map((b) => <span key={b}>{b}</span>)}</section>
      <section className="wrap prose"><h2>{t.areas}</h2><p>{t.areas_txt}</p><ul className="govs">{GOVS[lang].map((g) => <li key={g}>{g}</li>)}</ul></section>
      <section className="wrap"><div className="sechead"><h2>{lang === "ar" ? t.guides : t.calc}</h2><Link href={upath(lang, "calculator")}>{t.calc} {lang === "ar" ? "←" : "→"}</Link></div>
        {lang === "ar" ? <GuideCards guides={GUIDES.slice(0, 3)} /> : <p className="lead">{t.calc_lead} <Link href={upath(lang, "calculator")}>{t.calc}</Link></p>}
      </section>
      <Faq lang={lang} faqs={faqs} />
      <Quote lang={lang} />
    </>
  );
}

function fmtDate(iso: string, lang: Lang) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "Africa/Cairo" });
}

function GuideCards({ guides }: { guides: Guide[] }) {
  return (
    <div className="cards">
      {guides.map((g) => (
        <Link key={g.slug} className="card cat guide" href={`/guides/${g.slug}/`}>
          <h3>{g.h1}</h3>
          <p>{g.lead.slice(0, 120)}…</p>
          <span className="more">{T.ar.read_more} ←</span>
        </Link>
      ))}
    </div>
  );
}

function GuidesIndex() {
  const t = T.ar;
  return (
    <>
      <Crumbs lang="ar" items={[[t.guides, "guides"]]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: t.guides_h, url: D + "/guides/", inLanguage: "ar-EG",
        hasPart: GUIDES.map((g) => ({ "@type": "Article", headline: g.h1, url: D + `/guides/${g.slug}/` })) }} />
      <section className="phero"><div className="wrap"><div><h1>{t.guides_h}</h1><p className="lead">{t.guides_lead}</p>
        <div className="actions"><Link className="btn" href="/calculator/">{t.calc}</Link><a className="btn wa" href={waLink(t.wa_msg)} rel="noopener">{t.wa}</a></div></div></div></section>
      <section className="wrap"><GuideCards guides={GUIDES} /></section>
      <Quote lang="ar" />
    </>
  );
}

function GuidePage({ g }: { g: Guide }) {
  const t = T.ar;
  const url = D + `/guides/${g.slug}/`;
  const cats = g.related.map((s) => bySlug(s)).filter(Boolean) as NonNullable<ReturnType<typeof bySlug>>[];
  const article = {
    "@context": "https://schema.org", "@type": "Article", headline: g.h1, description: g.desc, inLanguage: "ar-EG",
    datePublished: g.published, dateModified: g.updated, mainEntityOfPage: url, image: D + "/assets/og.png",
    author: { "@type": "Organization", name: C.brand_ar, url: D + "/" }, publisher: { "@id": D + "/#business" },
  };
  return (
    <>
      <Crumbs lang="ar" items={[[t.guides, "guides"], [g.h1, "guides/" + g.slug]]} />
      <JsonLd data={article} />
      <article>
        <section className="phero"><div className="wrap"><div><h1>{g.h1}</h1><p className="lead">{g.lead}</p>
          <p className="upd">{t.updated}: <time dateTime={g.updated}>{fmtDate(g.updated, "ar")}</time> · {C.brand_ar}</p></div></div></section>
        <section className="wrap prose guide-body">
          {g.sections.map((sec, i) => (
            <div key={i}>
              <h2>{sec.h}</h2>
              {sec.p.map((p, j) => <p key={j}>{p}</p>)}
              {sec.table && (
                <div className="tbl"><table>
                  <thead><tr>{sec.table.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
                  <tbody>{sec.table.rows.map((r, j) => <tr key={j}>{r.map((cell, k) => (k === 0 ? <th key={k} scope="row">{cell}</th> : <td key={k}>{cell}</td>))}</tr>)}</tbody>
                </table></div>
              )}
            </div>
          ))}
          <p className="cta-line">احسب كمية مشروعك بالظبط من <Link href="/calculator/">حاسبة مواد البناء</Link>، وبعدها اطلب عرض سعر شامل النقل لموقعك.</p>
        </section>
      </article>
      {cats.length > 0 && <section className="wrap"><h2>{t.products}</h2><CatCards lang="ar" cats={cats} /></section>}
      <Faq lang="ar" faqs={g.faq} />
      <Quote lang="ar" preset={cats[0]?.ar.nav} />
      <section className="wrap"><h2>{t.related_guides}</h2><GuideCards guides={GUIDES.filter((x) => x.slug !== g.slug).slice(0, 3)} /></section>
    </>
  );
}

function CalcPage({ lang }: { lang: Lang }) {
  const t = T[lang];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: t.calc_h, url: D + upath(lang, "calculator"), applicationCategory: "UtilitiesApplication", operatingSystem: "Any", inLanguage: lang + "-EG",
    offers: { "@type": "Offer", price: 0, priceCurrency: "EGP" }, publisher: { "@id": D + "/#business" } };
  return (
    <>
      <Crumbs lang={lang} items={[[t.calc, "calculator"]]} />
      <JsonLd data={app} />
      <section className="phero"><div className="wrap"><div><h1>{t.calc_h}</h1><p className="lead">{t.calc_lead}</p></div></div></section>
      <section className="wrap"><Calculator lang={lang} wa={C.whatsapp} /></section>
      {lang === "ar" && <section className="wrap"><h2>{t.related_guides}</h2><GuideCards guides={GUIDES.slice(0, 3)} /></section>}
      <section className="wrap"><h2>{t.cats}</h2><CatCards lang={lang} cats={TOP.slice(0, 4)} /></section>
      <Quote lang={lang} />
    </>
  );
}

function About({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <>
      <Crumbs lang={lang} items={[[t.about, "about"]]} />
      <JsonLd data={orgSchema(lang)} />
      <section className="phero"><div className="wrap"><div><h1>{t.about_h}</h1></div></div></section>
      <section className="wrap prose">{t.about_p.map((p: string, i: number) => <p key={i}>{p}</p>)}</section>
      <section className="wrap"><h2>{t.products}</h2><CatCards lang={lang} cats={TOP} /></section>
    </>
  );
}

function Contact({ lang }: { lang: Lang }) {
  const t = T[lang]; const ar = lang === "ar";
  const items: [string, string, string][] = [
    [ar ? "التسعير وعروض الأسعار" : "Pricing & quotes", ar ? "ابعت جدول الكميات أو طلب التوريد ونرد بعرض سعر." : "Send your bill of quantities or supply request for a quote.", C.email_sales],
    [ar ? "خدمة العملاء والاستفسارات والشكاوى" : "Customer care, enquiries & complaints", ar ? "أي استفسار عن طلب أو توريد أو شكوى، ونرد خلال يوم عمل." : "Questions about an order or delivery, or a complaint. We reply within one business day.", C.email_support],
    [ar ? "تسجيل الموردين" : "Supplier registration", ar ? "مصنع أو وكيل وعايز تورد لنا؟ سجّل من صفحة الموردين أو ابعت ملف الشركة." : "Manufacturer or agent? Register on the suppliers page or email your company profile.", C.email_suppliers],
  ];
  return (
    <>
      <Crumbs lang={lang} items={[[t.contact, "contact"]]} />
      <JsonLd data={orgSchema(lang)} />
      <section className="phero"><div className="wrap"><div><h1>{t.contact}</h1><p className="lead">{t.f_hint}</p>
        <div className="actions"><a className="btn wa" href={waLink(t.wa_msg)} rel="noopener">{t.wa}</a><a className="btn ghost" href={`tel:${C.phone_e164}`} dir="ltr">{C.phone_display}</a></div></div></div></section>
      <section className="wrap"><h2>{ar ? "راسلنا" : "Email us"}</h2><div className="cards">
        {items.map(([h, p, m]) => <div className="card" key={m}><h3>{h}</h3><p>{p}</p><a className="mail" href={`mailto:${m}`} dir="ltr">{m}</a></div>)}
      </div></section>
      <Quote lang={lang} />
    </>
  );
}

function OfferGrid({ lang, offers }: { lang: Lang; offers: Awaited<ReturnType<typeof getOffers>> }) {
  const t = T[lang];
  return (
    <div className="cards">
      {offers.map((o) => {
        const title = lang === "ar" ? o.title_ar : o.title_en || o.title_ar;
        const body = lang === "ar" ? o.body_ar : o.body_en || o.body_ar;
        const unit = lang === "ar" ? o.unit_ar : o.unit_en || o.unit_ar;
        return (
          <article className="card offer" key={o.id}>
            {o.image_url && <img className="pimg" src={o.image_url} alt={title} loading="lazy" />}
            {o.discount_label && <span className="tag">{o.discount_label}</span>}
            <h3>{title}</h3>
            {body && <p>{body}</p>}
            {o.new_price != null && <p className="price">{o.old_price != null && <s>{money(o.old_price, lang)}</s>} {money(o.new_price, lang)}{unit ? ` / ${unit}` : ""}</p>}
            {o.ends_on && <p className="unit">{t.until} {o.ends_on}</p>}
            <a className="btn sm" href="#quote" data-quote={title}>{t.quote}</a>
          </article>
        );
      })}
    </div>
  );
}

async function Offers({ lang }: { lang: Lang }) {
  const t = T[lang];
  const offers = await getOffers();
  return (
    <>
      <Crumbs lang={lang} items={[[t.offers, "offers"]]} />
      <section className="phero"><div className="wrap"><span className="ic big"><Icon name="tile" size={56} /></span><div><h1>{t.offers_h}</h1><p className="lead">{t.offers_lead}</p>
        <div className="actions"><a className="btn big" href="#quote">{t.contact}</a><a className="btn wa" href={waLink(t.wa_msg + " " + t.offers)} rel="noopener">{t.wa}</a></div></div></div></section>
      <section className="wrap">{offers.length ? <OfferGrid lang={lang} offers={offers} /> : <p className="empty">{t.offers_empty}</p>}</section>
      <Quote lang={lang} />
    </>
  );
}

function Suppliers({ lang }: { lang: Lang }) {
  const t = T[lang];
  const steps = String(t.sup_steps).split("|");
  return (
    <>
      <Crumbs lang={lang} items={[[t.suppliers, "suppliers"]]} />
      <section className="phero"><div className="wrap"><span className="ic big"><Icon name="brick" size={56} /></span><div><h1>{t.suppliers_h}</h1><p className="lead">{t.suppliers_lead}</p>
        <div className="actions"><Link className="btn" href={upath(lang, "account") + "?type=supplier"}>{t.sup_cta}</Link><a className="btn ghost" href={`mailto:${C.email_suppliers}`} dir="ltr">{C.email_suppliers}</a></div></div></div></section>
      <section className="wrap"><ol className="steps">{steps.map((s, i) => <li key={i}><span className="n">{i + 1}</span><h3>{s}</h3></li>)}</ol></section>
      <section className="wrap"><h2>{t.cats}</h2><CatCards lang={lang} cats={TOP} /></section>
    </>
  );
}

async function CategoryPage({ lang, slug }: { lang: Lang; slug: string }) {
  const t = T[lang];
  const c = bySlug(slug)!;
  const d = c[lang];
  const crumbs: [string, string][] = [];
  if (c.parent) { const p = bySlug(c.parent)!; crumbs.push([p[lang].nav, p.slug]); }
  crumbs.push([d.nav, slug]);
  const children = CATEGORIES.filter((x) => x.parent === slug);
  const media = await getCategoryMedia();
  const db = await getProducts(slug);
  type P = { name: string; spec: string; unit: string; image?: string | null; price?: string };
  const products: P[] = db && db.length
    ? db.map((p) => ({
        name: lang === "ar" ? p.name_ar : p.name_en || p.name_ar,
        spec: (lang === "ar" ? p.spec_ar : p.spec_en || p.spec_ar) || "",
        unit: (lang === "ar" ? p.unit_ar : p.unit_en || p.unit_ar) || "",
        image: p.image_url || prodArt(slug, d.products.findIndex(([n]) => n === (lang === "ar" ? p.name_ar : p.name_en || p.name_ar))) || catArt(slug),
        price: p.show_price && p.price != null ? money(p.price, lang) : undefined,
      }))
    : d.products.map(([name, spec, unit], i) => ({ name, spec, unit, image: prodArt(slug, i) }));
  const url = D + upath(lang, slug);
  const schemas: object[] = [orgSchema(lang)];
  // Google requires a price on Product offers; list unpriced items by name only.
  if (products.length) schemas.push({
    "@context": "https://schema.org", "@type": "ItemList", name: d.h1,
    itemListElement: products.map((p, i) => {
      const raw = db?.find((x) => (lang === "ar" ? x.name_ar : x.name_en || x.name_ar) === p.name);
      const priced = raw && raw.show_price && raw.price != null;
      return priced
        ? { "@type": "ListItem", position: i + 1,
            item: { "@type": "Product", name: p.name, description: p.spec, ...(p.image ? { image: p.image.startsWith("/") ? D + p.image : p.image } : {}), brand: { "@type": "Brand", name: C.brand_en }, category: d.nav,
              offers: { "@type": "Offer", price: raw!.price, priceCurrency: "EGP", availability: "https://schema.org/InStock", seller: { "@id": D + "/#business" }, url } } }
        : { "@type": "ListItem", position: i + 1, name: p.name };
    }),
  });
  const rel = TOP.filter((x) => x.slug !== slug && x.slug !== c.parent).slice(0, 4);
  const guides = lang === "ar" ? GUIDES.filter((g) => g.related.includes(slug) || (c.parent && g.related[0] === c.parent)).slice(0, 3) : [];
  const m = media[slug];
  return (
    <>
      <Crumbs lang={lang} items={crumbs} />
      <JsonLd data={schemas} />
      <section className="phero"><div className="wrap">
        <span className="ic big">{m?.icon_url ? <img src={m.icon_url} alt="" width={56} height={56} /> : <Icon name={c.icon} size={56} />}</span>
        <div><h1>{d.h1}</h1><p className="lead">{d.lead}</p>
          <div className="actions"><a className="btn big" href="#quote">{t.contact}</a><a className="btn wa" href={waLink(t.wa_msg + " " + d.nav)} rel="noopener">{t.wa}</a></div>
          <p className="upd">{t.updated}: <time dateTime={CONTENT_UPDATED}>{fmtDate(CONTENT_UPDATED, lang)}</time></p></div>
        {(m?.image_url || catArt(slug)) && <img className="hero-img" src={m?.image_url || catArt(slug)} alt={d.h1} width={800} height={600} fetchPriority="high" />}
      </div></section>
      {children.length > 0 && <section className="wrap"><h2>{t.products}</h2><CatCards lang={lang} cats={children} media={media} /></section>}
      {products.length > 0 && (
        <section className="wrap"><h2>{t.products}</h2><div className="cards">
          {products.map((p, i) => (
            <article className="card prod" key={i}>
              {p.image && <img className="pimg" src={p.image} alt={p.name} width={800} height={600} loading="lazy" decoding="async" />}
              <h3>{p.name}</h3><p>{p.spec}</p>
              {p.price && <p className="price">{p.price}{p.unit ? ` / ${p.unit}` : ""}</p>}
              <div className="pfoot"><span className="unit">{t.unit}: {p.unit}</span><a className="btn sm" href="#quote" data-quote={p.name}>{t.quote}</a></div>
            </article>
          ))}
        </div></section>
      )}
      <section className="wrap prose">{d.body.map(([h, p], i) => <div key={i}><h2>{h}</h2><p>{p}</p></div>)}</section>
      {guides.length > 0 && <section className="wrap"><h2>{t.related_guides}</h2><GuideCards guides={guides} /></section>}
      <Faq lang={lang} faqs={d.faq} />
      <Quote lang={lang} preset={d.nav} />
      <section className="wrap"><h2>{t.related}</h2><CatCards lang={lang} cats={rel} media={media} /></section>
    </>
  );
}
