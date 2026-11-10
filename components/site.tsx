import Link from "next/link";
import { AR_ONLY_SLUGS, C, CATEGORIES, ICONS, MENU, T, TOP, D, upath, waLink, type Category, type Lang } from "@/lib/content";
import type { DbCategory } from "@/lib/db";

export function Icon({ name, size = 40 }: { name: string; size?: number }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}

export function JsonLd({ data }: { data: object | object[] }) {
  const arr = Array.isArray(data) ? data : [data];
  return (
    <>
      {arr.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}

export function orgSchema(lang: Lang) {
  return {
    "@context": "https://schema.org", "@type": ["HomeAndConstructionBusiness", "Store"], "@id": D + "/#business",
    name: C.brand_en, alternateName: [C.brand_ar, C.legal_ar, C.legal_en, "KPLUS", "كي بلاس", "K Plus Supply"], legalName: C.legal_en,
    slogan: "Key to better supply",
    identifier: [{ "@type": "PropertyValue", name: "Commercial Register", value: C.cr }, { "@type": "PropertyValue", name: "Tax ID", value: C.tax }],
    url: D + "/", logo: D + "/assets/logo.png", image: D + "/assets/og.png", telephone: C.phone_e164, email: C.email, priceRange: "$$",
    address: { "@type": "PostalAddress", streetAddress: lang === "ar" ? C.street_ar : C.street_en, addressLocality: C.city, addressRegion: C.region, addressCountry: "EG" },
    geo: { "@type": "GeoCoordinates", latitude: C.lat, longitude: C.lng },
    openingHours: C.hours, areaServed: { "@type": "Country", name: "Egypt" },
    parentOrganization: { "@type": "Organization", name: C.parent_en, alternateName: C.parent_ar },
    contactPoint: [
      { "@type": "ContactPoint", telephone: C.phone_e164, email: C.email_sales, contactType: "sales", availableLanguage: ["Arabic", "English"] },
      { "@type": "ContactPoint", telephone: C.phone_e164, email: C.email_support, contactType: "customer service", availableLanguage: ["Arabic", "English"] },
      { "@type": "ContactPoint", email: C.email_suppliers, contactType: "purchasing", availableLanguage: ["Arabic", "English"] },
    ],
    hasOfferCatalog: { "@type": "OfferCatalog", name: "Building materials", itemListElement: TOP.map((c) => ({ "@type": "OfferCatalog", name: c.en.nav, url: D + upath(lang, c.slug) })) },
  };
}

export function Crumbs({ lang, items }: { lang: Lang; items: [string, string][] }) {
  const all: [string, string][] = [[T[lang].home, ""], ...items];
  const schema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: all.map(([n, s], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: D + upath(lang, s) })),
  };
  return (
    <>
      <nav className="crumbs" aria-label="breadcrumb">
        <ol>
          {all.map(([n, s], i) => (
            <li key={i} aria-current={i === all.length - 1 ? "page" : undefined}>
              {i < all.length - 1 ? <Link href={upath(lang, s)}>{n}</Link> : n}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={schema} />
    </>
  );
}

export function Shell({ lang, slug, children }: { lang: Lang; slug: string; children: React.ReactNode }) {
  const t = T[lang];
  const other: Lang = lang === "ar" ? "en" : "ar";
  const brand = lang === "ar" ? C.brand_ar : C.brand_en;
  const switchSlug = ["account", ...AR_ONLY_SLUGS].includes(slug) ? "" : slug;
  return (
    <>
      <a className="skip" href="#main">{lang === "ar" ? "تخطي للمحتوى" : "Skip to content"}</a>
      <header className="top">
        <div className="wrap bar">
          <Link className="logo" href={upath(lang)} aria-label={brand}>
            <img className="lmark" src="/assets/mark-hd.png" width={36} height={48} alt="" />
            <span className="lword"><img src="/assets/plus-word.png" width={108} height={24} alt={`KPLUS ${brand}`} /><span className="slog">KEY TO BETTER SUPPLY</span></span>
          </Link>
          <MenuButton />
          <nav id="nav" className="nav">
            {MENU.map((c) => <Link key={c.slug} href={upath(lang, c.slug)}>{c[lang].nav}</Link>)}
            <Link className="hot" href={upath(lang, "offers")}>{t.offers}</Link>
            <Link href={upath(lang, "account")}>{t.account}</Link>
            <Link className="lang" hrefLang={other} href={upath(other, switchSlug)}>{t.other}</Link>
          </nav>
          <Link className="btn cta" href={upath(lang, "contact")}>{t.contact}</Link>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="foot">
        <div className="wrap cols">
          <div>
            <img className="flogo" src="/assets/logo-slogan-white.png" width={280} height={95} alt="KPLUS — Key to better supply" />
            <p><b>{lang === "ar" ? C.legal_ar : C.legal_en}</b><br />{t.tagline}</p>
            <p className="legal">{lang === "ar" ? "سجل تجاري" : "C.R."}: {C.cr} · {lang === "ar" ? "بطاقة ضريبية" : "Tax ID"}: <span dir="ltr">{C.tax}</span></p>
          </div>
          <div>
            <b>{t.products}</b>
            <ul>
              {CATEGORIES.map((c) => <li key={c.slug}><Link href={upath(lang, c.slug)}>{c[lang].nav}</Link></li>)}
              <li><Link href={upath(lang, "offers")}>{t.offers}</Link></li>
              <li><Link href={upath(lang, "calculator")}>{t.calc}</Link></li>
              {lang === "ar" && <li><Link href="/guides/">{t.guides}</Link></li>}
              <li><Link href={upath(lang, "suppliers")}>{t.suppliers}</Link></li>
              <li><Link href={upath(lang, "about")}>{t.about}</Link></li>
            </ul>
          </div>
          <div>
            <b>{t.call}</b>
            <ul className="contact">
              <li><a href={`tel:${C.phone_e164}`} dir="ltr">{C.phone_display}</a></li>
              <li><a href={waLink(t.wa_msg)} rel="noopener">{t.wa}</a></li>
              <li>{lang === "ar" ? "التسعير" : "Quotes"}: <a href={`mailto:${C.email_sales}`}>{C.email_sales}</a></li>
              <li>{lang === "ar" ? "خدمة العملاء والشكاوى" : "Customer care"}: <a href={`mailto:${C.email_support}`}>{C.email_support}</a></li>
              <li>{lang === "ar" ? "تسجيل الموردين" : "Supplier registration"}: <a href={`mailto:${C.email_suppliers}`}>{C.email_suppliers}</a></li>
              <li>{lang === "ar" ? C.street_ar : C.street_en}</li>
            </ul>
          </div>
        </div>
        <div className="wrap copy">© {new Date().getFullYear()} {brand} — {t.rights}</div>
      </footer>
      <nav className="mbar" aria-label={lang === "ar" ? "تواصل سريع" : "Quick contact"}>
        <a className="mq" href={upath(lang, "contact") + "#quote"} data-goquote="1">{t.contact}</a>
        <a className="mw" href={waLink(t.wa_msg)} rel="noopener">{t.wa}</a>
        <a className="mc" href={`tel:${C.phone_e164}`} aria-label={t.call}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg></a>
      </nav>
      <WaTracker lang={lang} />
      <a className="wa-float" href={waLink(t.wa_msg)} rel="noopener" aria-label={t.wa}>
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.5 6.5 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.8 2.8 0 0 0 .2-1.6c-.1-.2-.3-.3-.6-.4z" /></svg>
      </a>
    </>
  );
}

import MenuButton from "./menu-button";
import WaTracker from "./wa-tracker";

export function CatCards({ lang, cats, media }: { lang: Lang; cats: Category[]; media?: Record<string, DbCategory> }) {
  return (
    <div className="cards">
      {cats.map((c) => {
        const m = media?.[c.slug];
        return (
          <Link key={c.slug} className="card cat" href={upath(lang, c.slug)}>
            {m?.image_url && <img className="cimg" src={m.image_url} alt="" loading="lazy" />}
            <span className="ic">{m?.icon_url ? <img src={m.icon_url} alt="" width={40} height={40} /> : <Icon name={c.icon} />}</span>
            <h3>{c[lang].nav}</h3>
            <p>{c[lang].lead.slice(0, 110)}…</p>
            <span className="more">{T[lang].browse} {lang === "ar" ? "←" : "→"}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Faq({ lang, faqs }: { lang: Lang; faqs: [string, string][] }) {
  const schema = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <section className="wrap faq">
      <h2>{T[lang].faq}</h2>
      {faqs.map(([q, a], i) => <details key={i}><summary>{q}</summary><p>{a}</p></details>)}
      <JsonLd data={schema} />
    </section>
  );
}

export function money(v: number | null | undefined, lang: Lang) {
  if (v == null) return "";
  return Number(v).toLocaleString(lang === "ar" ? "ar-EG" : "en-EG") + (lang === "ar" ? " ج.م" : " EGP");
}
