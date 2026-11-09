# -*- coding: utf-8 -*-
"""مولّد موقع كي بلس الثابت.
python3 build.py            -> dist/  (للرفع على الاستضافة، روابط نظيفة)
python3 build.py --preview  -> preview/ (روابط index.html للمعاينة)
"""
import json, os, shutil, sys, html
from datetime import date
from content import CONFIG as C, CATEGORIES, GOVS_AR, GOVS_EN

PREVIEW = "--preview" in sys.argv
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "preview" if PREVIEW else "docs")
TODAY = date.today().isoformat()
D = C["domain"].rstrip("/")
E = html.escape

T = {
 "ar": dict(dir="rtl", home="الرئيسية", about="من نحن", contact="اطلب عرض سعر", products="منتجاتنا", quote="اطلب سعر",
   wa="واتساب", call="اتصل بنا", unit="الوحدة", faq="أسئلة شائعة", related="منتجات أخرى", other="English",
   tagline="مفتاحك لأفضل سعر أينما كنت… بجودة بلا تنازل ومن مصادر موثوقة", areas="مناطق التوريد",
   areas_txt="بنورد لكل محافظات مصر، ومنها:", rights="جميع الحقوق محفوظة", member="إحدى شركات",
   hero_h="توريد مواد البناء لمشروعك بأسعار المصنع",
   hero_p="أسمنت، طوب أسمنتي، أبواب خشب ومقاومة للحريق وعازلة للصوت، أدوات صحية إيديال ستاندرد، وسيراميك كليوباترا والجوهرة وأوبليسك — عرض سعر خلال ساعات وتوصيل لموقعك في كل مصر.",
   cats="اختار القسم", why="ليه كي بلس؟", how="إزاي تطلب؟", browse="تصفح", form_h="ابعت طلبك ونرد عليك بعرض سعر",
   f_name="الاسم", f_phone="رقم الموبايل", f_cat="المنتج", f_qty="الكمية", f_loc="موقع المشروع (المحافظة/المدينة)", f_note="ملاحظات",
   f_send="ابعت الطلب على واتساب", f_hint="الطلب بيتبعت لينا على واتساب مباشرة، ومن غير أي التزام.",
   wa_msg="السلام عليكم، عايز عرض سعر:",
   why_items=[("أسعار جملة", "علاقات مباشرة مع المصانع والوكلاء بتخلي سعرك أقل."), ("عرض سعر سريع", "رد بعرض سعر شامل النقل خلال ساعات عمل."),
              ("توصيل لكل مصر", "أسطول نقل للقاهرة والعاصمة والصعيد والدلتا والساحل."), ("فاتورة وضمان", "فاتورة ضريبية وشهادات مطابقة وضمان الوكيل."),
              ("مورد واحد", "كل مواد المشروع من مكان واحد ومسؤول حساب واحد."), ("خبرة مشروعات", "بنورد لمقاولين كبار في مشروعات إسكان ومدارس ومستشفيات.")],
   how_items=[("1", "اختار المنتج", "حدد النوع والمقاس والكمية."), ("2", "استلم عرض السعر", "بنبعتلك السعر شامل النقل على واتساب."), ("3", "استلم في موقعك", "بنوصل في الميعاد ومعاك فاتورة رسمية.")],
   about_h="عن كي بلس", about_p=["كي بلس شركة متخصصة في توريد مواد البناء والتشطيبات للمقاولين والمطورين العقاريين وأصحاب المشروعات في مصر، وهي إحدى شركات " + C["parent_ar"] + "، اللي بتشتغل في تصنيع وتوريد وتركيب الأعمال الخشبية والأبواب لمشروعات الإسكان والمدارس والمستشفيات من سنة " + C["founded"] + ".",
              "هدفنا نوفر للمقاول كل مواد المشروع من مورد واحد موثوق: سعر واضح، توصيل في الميعاد، وفاتورة رسمية.",
              "من عملائنا مقاولين في مشروعات شمال الصعيد، الشروق، جيدار، وكونكريت بلس."],
   home_title="كي بلس K Plus | توريد مواد بناء في مصر — أسمنت، طوب، أبواب، صحي وسيراميك",
   home_desc="كي بلس لتوريد مواد البناء في مصر: أسمنت وطوب أسمنتي وأبواب خشب ومقاومة للحريق وعازلة للصوت وأدوات صحية إيديال ستاندرد وسيراميك كليوباترا والجوهرة. أسعار جملة وتوصيل لموقعك.",
   about_title="من نحن | كي بلس لتوريد مواد البناء", about_desc="تعرف على كي بلس، إحدى شركات الكنانة، مورد مواد البناء والأبواب والتشطيبات للمقاولين والمشروعات في مصر.",
   contact_title="اطلب عرض سعر مواد بناء | كي بلس", contact_desc="ابعت طلب عرض سعر أسمنت أو طوب أو أبواب أو أدوات صحية أو سيراميك، ونرد عليك خلال ساعات على واتساب.",
   nf_title="الصفحة غير موجودة | كي بلس", nf_h="الصفحة دي مش موجودة", nf_p="ممكن تكون اتنقلت. ارجع للرئيسية أو اختار قسم.",
 ),
 "en": dict(dir="ltr", home="Home", about="About", contact="Request a Quote", products="Products", quote="Get price",
   wa="WhatsApp", call="Call us", unit="Unit", faq="FAQ", related="Other products", other="العربية",
   tagline="Your key to the best price, wherever you are. Uncompromised quality, trusted sources.", areas="Delivery areas",
   areas_txt="We deliver to all Egyptian governorates, including:", rights="All rights reserved", member="A member of",
   hero_h="Building Materials Delivered at Factory Prices",
   hero_p="Cement, cement bricks, wooden, fire-rated and soundproof doors, Ideal Standard sanitary ware, and Cleopatra, Al-Gawhara and Obelisk ceramics — quotes within hours and delivery anywhere in Egypt.",
   cats="Shop by category", why="Why K Plus?", how="How to order", browse="Browse", form_h="Send your request and get a quote",
   f_name="Name", f_phone="Mobile", f_cat="Product", f_qty="Quantity", f_loc="Project location (governorate/city)", f_note="Notes",
   f_send="Send request on WhatsApp", f_hint="Your request goes straight to our WhatsApp — no obligation.",
   wa_msg="Hello, I would like a quote for:",
   why_items=[("Wholesale prices", "Direct relationships with plants and agents lower your price."), ("Fast quotes", "All-in delivered quote within business hours."),
              ("Nationwide delivery", "Fleet covering Cairo, the New Capital, Upper Egypt, the Delta and the coast."), ("Invoice & warranty", "Tax invoice, compliance certificates and agent warranty."),
              ("One supplier", "All project materials from one place with one account manager."), ("Project experience", "Supplying major contractors on housing, school and hospital projects.")],
   how_items=[("1", "Pick a product", "Choose type, size and quantity."), ("2", "Get your quote", "We send a delivered price on WhatsApp."), ("3", "Receive on site", "On-time delivery with an official invoice.")],
   about_h="About K Plus", about_p=["K Plus supplies building and finishing materials to contractors, developers and project owners across Egypt. It is part of " + C["parent_en"] + ", which has manufactured, supplied and installed doors and woodwork for housing, school and hospital projects since " + C["founded"] + ".",
              "Our goal is to give contractors every project material from one trusted supplier: clear pricing, on-time delivery and an official invoice.",
              "Our clients include contractors on projects in North Upper Egypt, El Shorouk, Gedar and Concrete Plus."],
   home_title="K Plus | Building Materials Supplier in Egypt — Cement, Bricks, Doors, Sanitary & Ceramics",
   home_desc="K Plus supplies building materials in Egypt: cement, cement bricks, wooden, fire-rated and soundproof doors, Ideal Standard sanitary ware and Cleopatra & Al-Gawhara ceramics. Wholesale prices, delivered to site.",
   about_title="About Us | K Plus Building Materials", about_desc="Meet K Plus, part of Al-Kenana — supplier of building materials, doors and finishes to contractors and projects in Egypt.",
   contact_title="Request a Building Materials Quote | K Plus", contact_desc="Request a quote for cement, bricks, doors, sanitary ware or ceramics and get a reply within hours on WhatsApp.",
   nf_title="Page not found | K Plus", nf_h="Page not found", nf_p="It may have moved. Go back home or pick a category.",
 ),
}

ICONS = {
 "cement": '<path d="M12 10h40l-6 44H18z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 24h32M18 38h28" stroke="currentColor" stroke-width="3"/>',
 "brick": '<g fill="none" stroke="currentColor" stroke-width="3"><rect x="6" y="12" width="52" height="40" rx="2"/><path d="M6 25h52M6 39h52M24 12v13M42 25v14M24 39v13"/></g>',
 "door": '<g fill="none" stroke="currentColor" stroke-width="3"><rect x="16" y="6" width="32" height="52" rx="2"/><path d="M22 12h20v18H22zM22 36h20v16H22z"/></g><circle cx="42" cy="33" r="2.5" fill="currentColor"/>',
 "fire": '<path d="M32 6c4 10 14 15 14 30a14 14 0 0 1-28 0c0-8 4-12 7-16 0 6 3 9 6 9-2-9 1-16 1-23z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
 "sound": '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M10 26h10l12-10v32L20 38H10z"/><path d="M42 24l12 16M54 24L42 40"/></g>',
 "bath": '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 32h52v6a12 12 0 0 1-12 12H18A12 12 0 0 1 6 38z"/><path d="M14 32V14a6 6 0 0 1 12 0M18 50l-3 6M46 50l3 6"/></g>',
 "tile": '<g fill="none" stroke="currentColor" stroke-width="3"><path d="M32 6l26 26-26 26L6 32z"/><path d="M19 19l26 26M45 19L19 45"/></g>',
}
def icon(name, size=40):
    return f'<svg viewBox="0 0 64 64" width="{size}" height="{size}" aria-hidden="true">{ICONS[name]}</svg>'

def upath(lang, slug=""):
    """public URL path: /cement/ or /en/cement/"""
    p = ("/en/" if lang == "en" else "/") + (slug + "/" if slug else "")
    return p

def link(cur, lang, slug=""):
    """relative link from page `cur` (url path) to target"""
    target = upath(lang, slug)
    depth = cur.strip("/").count("/") + (1 if cur.strip("/") else 0)
    rel = "../" * depth + target.lstrip("/")
    if PREVIEW:
        rel += "index.html"
    return rel or "./"

def asset(cur, name):
    depth = cur.strip("/").count("/") + (1 if cur.strip("/") else 0)
    return "../" * depth + "assets/" + name

def wa_link(text):
    from urllib.parse import quote
    return f"https://wa.me/{C['whatsapp']}?text={quote(text)}"

def by_slug(s): return next(c for c in CATEGORIES if c["slug"] == s)
TOP = [c for c in CATEGORIES if c["parent"] is None]

def org_schema(lang):
    return {
      "@context": "https://schema.org", "@type": ["HomeAndConstructionBusiness", "Store"], "@id": D + "/#business",
      "name": C["brand_en"], "alternateName": [C["brand_ar"], C["legal_ar"], C["legal_en"], "KPLUS", "كي بلاس", "K Plus Supply"], "legalName": C["legal_en"], "slogan": "Key to better supply",
      "identifier": [{"@type": "PropertyValue", "name": "Commercial Register", "value": C["cr"]}, {"@type": "PropertyValue", "name": "Tax ID", "value": C["tax"]}],
      "url": D + "/", "logo": D + "/assets/logo.png", "image": D + "/assets/og.png",
      "telephone": C["phone_e164"], "email": C["email"], "priceRange": "EGP",
      "address": {"@type": "PostalAddress", "streetAddress": C["street_ar"] if lang == "ar" else C["street_en"],
                  "addressLocality": C["city"], "addressRegion": C["region"], "addressCountry": "EG"},
      "geo": {"@type": "GeoCoordinates", "latitude": C["lat"], "longitude": C["lng"]},
      "openingHours": C["hours"], "areaServed": {"@type": "Country", "name": "Egypt"},
      "parentOrganization": {"@type": "Organization", "name": C["parent_en"], "alternateName": C["parent_ar"]},
      "contactPoint": [{"@type": "ContactPoint", "telephone": C["phone_e164"], "email": C["email_sales"], "contactType": "sales", "availableLanguage": ["Arabic", "English"]},
        {"@type": "ContactPoint", "telephone": C["phone_e164"], "email": C["email_support"], "contactType": "customer service", "availableLanguage": ["Arabic", "English"]},
        {"@type": "ContactPoint", "email": C["email_suppliers"], "contactType": "purchasing", "availableLanguage": ["Arabic", "English"]}],
      "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Building materials",
         "itemListElement": [{"@type": "OfferCatalog", "name": c["en"]["nav"], "url": D + upath(lang, c["slug"])} for c in TOP]},
    }

def page(lang, slug, title, desc, body, schemas, crumbs=None):
    t = T[lang]; cur = upath(lang, slug); other = "en" if lang == "ar" else "ar"
    canon = D + cur
    alt_ar, alt_en = D + upath("ar", slug), D + upath("en", slug)
    nav = "".join(f'<a href="{link(cur, lang, c["slug"])}">{E(c[lang]["nav"])}</a>' for c in TOP)
    if crumbs:
        items = [(t["home"], "")] + crumbs
        bc = '<nav class="crumbs" aria-label="breadcrumb"><ol>' + "".join(
            (f'<li><a href="{link(cur, lang, s)}">{E(n)}</a></li>' if i < len(items) - 1 else f'<li aria-current="page">{E(n)}</li>')
            for i, (n, s) in enumerate(items)) + '</ol></nav>'
        schemas = schemas + [{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": D + upath(lang, s)} for i, (n, s) in enumerate(items)]}]
    else:
        bc = ""
    ld = "".join(f'<script type="application/ld+json">{json.dumps(s, ensure_ascii=False)}</script>' for s in schemas)
    foot_cats = "".join(f'<li><a href="{link(cur, lang, c["slug"])}">{E(c[lang]["nav"])}</a></li>' for c in CATEGORIES)
    brand = C["brand_ar"] if lang == "ar" else C["brand_en"]
    return f'''<!doctype html>
<html lang="{lang}-EG" dir="{t["dir"]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{canon}">
<link rel="alternate" hreflang="ar-EG" href="{alt_ar}">
<link rel="alternate" hreflang="en-EG" href="{alt_en}">
<link rel="alternate" hreflang="x-default" href="{alt_ar}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#0B2545">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{E(brand)}">
<meta property="og:locale" content="{"ar_EG" if lang == "ar" else "en_US"}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{D}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{asset(cur, "favicon.png")}" type="image/png">
<link rel="apple-touch-icon" href="{asset(cur, "apple-touch-icon.png")}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Inter:wght@400;600;800&display=swap">
<link rel="stylesheet" href="{asset(cur, "style.css")}">
{ld}
</head>
<body>
<a class="skip" href="#main">{"تخطي للمحتوى" if lang == "ar" else "Skip to content"}</a>
<header class="top">
 <div class="wrap bar">
  <a class="logo" href="{link(cur, lang)}" aria-label="{E(brand)}"><img src="{asset(cur, "logo.png")}" width="130" height="43" alt="KPLUS {E(brand)}"><span><small>{"توريدات مواد البناء والتوكيلات التجارية" if lang == "ar" else "Key to better supply"}</small></span></a>
  <button class="menu" aria-expanded="false" aria-controls="nav" aria-label="menu">☰</button>
  <nav id="nav" class="nav">{nav}<a href="{link(cur, lang, "about")}">{t["about"]}</a><a class="lang" hreflang="{other}" href="{link(cur, other, slug)}">{t["other"]}</a></nav>
  <a class="btn cta" href="{link(cur, lang, "contact")}">{t["contact"]}</a>
 </div>
</header>
<main id="main">
{bc}
{body}
</main>
<footer class="foot">
 <div class="wrap cols">
  <div><img src="{asset(cur, "logo-white.png")}" width="140" height="46" alt="KPLUS"><p><b>{E(C["legal_ar"] if lang == "ar" else C["legal_en"])}</b><br>{E(t["tagline"])}</p><p class="legal">{"سجل تجاري" if lang == "ar" else "C.R."}: {C["cr"]} · {"بطاقة ضريبية" if lang == "ar" else "Tax ID"}: <span dir="ltr">{C["tax"]}</span></p></div>
  <div><b>{t["products"]}</b><ul>{foot_cats}</ul></div>
  <div><b>{t["call"]}</b><ul class="contact">
   <li><a href="tel:{C["phone_e164"]}" dir="ltr">{C["phone_display"]}</a></li>
   <li><a href="{wa_link(t["wa_msg"])}" rel="noopener">{t["wa"]}</a></li>
   <li>{"التسعير" if lang == "ar" else "Quotes"}: <a href="mailto:{C["email_sales"]}">{C["email_sales"]}</a></li>
   <li>{"خدمة العملاء والشكاوى" if lang == "ar" else "Customer care"}: <a href="mailto:{C["email_support"]}">{C["email_support"]}</a></li>
   <li>{"تسجيل الموردين" if lang == "ar" else "Supplier registration"}: <a href="mailto:{C["email_suppliers"]}">{C["email_suppliers"]}</a></li>
   <li>{E(C["street_ar"] if lang == "ar" else C["street_en"])}</li></ul></div>
 </div>
 <div class="wrap copy">© {date.today().year} {E(brand)} — {t["rights"]}</div>
</footer>
<a class="wa-float" href="{wa_link(t["wa_msg"])}" rel="noopener" aria-label="{t["wa"]}"><svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.5 6.5 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.8 2.8 0 0 0 .2-1.6c-.1-.2-.3-.3-.6-.4z"/></svg></a>
<script src="{asset(cur, "app.js")}" defer></script>
</body>
</html>'''

def faq_html(lang, faqs):
    t = T[lang]
    items = "".join(f'<details><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in faqs)
    schema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}
    return f'<section class="wrap faq"><h2>{t["faq"]}</h2>{items}</section>', schema

def cat_cards(cur, lang, cats):
    return '<div class="cards">' + "".join(
        f'<a class="card cat" href="{link(cur, lang, c["slug"])}"><span class="ic">{icon(c["icon"])}</span><h3>{E(c[lang]["nav"])}</h3><p>{E(c[lang]["lead"][:110])}…</p><span class="more">{T[lang]["browse"]} {"←" if lang == "ar" else "→"}</span></a>'
        for c in cats) + '</div>'

def quote_form(lang, preset=""):
    t = T[lang]
    opts = "".join(f'<option{" selected" if c[lang]["nav"] == preset else ""}>{E(c[lang]["nav"])}</option>' for c in CATEGORIES)
    return f'''<section class="wrap quote" id="quote"><h2>{t["form_h"]}</h2>
<form class="qform" data-wa="{C["whatsapp"]}" data-msg="{E(t["wa_msg"])}">
 <label>{t["f_name"]}<input name="{t["f_name"]}" required autocomplete="name"></label>
 <label>{t["f_phone"]}<input name="{t["f_phone"]}" type="tel" required autocomplete="tel" dir="ltr"></label>
 <label>{t["f_cat"]}<select name="{t["f_cat"]}">{opts}</select></label>
 <label>{t["f_qty"]}<input name="{t["f_qty"]}"></label>
 <label class="full">{t["f_loc"]}<input name="{t["f_loc"]}"></label>
 <label class="full">{t["f_note"]}<textarea name="{t["f_note"]}" rows="3"></textarea></label>
 <button class="btn wa full" type="submit">{t["f_send"]}</button>
 <p class="hint full">{t["f_hint"]}</p>
</form></section>'''

def build_category(c, lang):
    t = T[lang]; d = c[lang]; slug = c["slug"]; cur = upath(lang, slug)
    crumbs = []
    if c["parent"]:
        p = by_slug(c["parent"]); crumbs.append((p[lang]["nav"], p["slug"]))
    crumbs.append((d["nav"], slug))
    children = [x for x in CATEGORIES if x["parent"] == slug]
    body = f'''<section class="phero"><div class="wrap"><span class="ic big">{icon(c["icon"], 56)}</span><div><h1>{E(d["h1"])}</h1><p class="lead">{E(d["lead"])}</p>
<div class="actions"><a class="btn wa" href="{wa_link(t["wa_msg"] + " " + d["nav"])}" rel="noopener">{t["wa"]}</a><a class="btn ghost" href="#quote">{t["contact"]}</a></div></div></div></section>'''
    if children:
        body += f'<section class="wrap"><h2>{t["products"]}</h2>{cat_cards(cur, lang, children)}</section>'
    if d["products"]:
        rows = "".join(f'''<article class="card prod"><h3>{E(n)}</h3><p>{E(s)}</p><div class="pfoot"><span class="unit">{t["unit"]}: {E(u)}</span>
<a class="btn sm" href="{wa_link(t["wa_msg"] + " " + n)}" rel="noopener">{t["quote"]}</a></div></article>''' for n, s, u in d["products"])
        body += f'<section class="wrap"><h2>{t["products"]}</h2><div class="cards">{rows}</div></section>'
    body += '<section class="wrap prose">' + "".join(f'<h2>{E(h)}</h2><p>{E(p)}</p>' for h, p in d["body"]) + '</section>'
    schemas = [org_schema(lang)]
    if d["products"]:
        schemas.append({"@context": "https://schema.org", "@type": "ItemList", "name": d["h1"], "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": {"@type": "Product", "name": n, "description": s,
              "brand": {"@type": "Brand", "name": C["brand_en"]}, "category": d["nav"],
              "offers": {"@type": "Offer", "priceCurrency": "EGP", "availability": "https://schema.org/InStock",
                         "seller": {"@id": D + "/#business"}, "url": D + cur}}}
            for i, (n, s, u) in enumerate(d["products"])]})
    fh, fs = faq_html(lang, d["faq"]); body += fh; schemas.append(fs)
    body += quote_form(lang, d["nav"])
    rel = [x for x in TOP if x["slug"] != slug and x["slug"] != c["parent"]][:4]
    body += f'<section class="wrap"><h2>{t["related"]}</h2>{cat_cards(cur, lang, rel)}</section>'
    return page(lang, slug, d["title"], d["desc"], body, schemas, crumbs)

def build_home(lang):
    t = T[lang]; cur = upath(lang)
    why = "".join(f'<div class="why"><h3>{E(h)}</h3><p>{E(p)}</p></div>' for h, p in t["why_items"])
    how = "".join(f'<li><span class="n">{n}</span><h3>{E(h)}</h3><p>{E(p)}</p></li>' for n, h, p in t["how_items"])
    govs = GOVS_AR if lang == "ar" else GOVS_EN
    brands = ["Ideal Standard", "Cleopatra", "Al-Gawhara", "Obelisk"]
    body = f'''<section class="hero"><div class="wrap"><h1>{E(t["hero_h"])}</h1><p class="lead">{E(t["hero_p"])}</p>
<div class="actions"><a class="btn wa" href="{wa_link(t["wa_msg"])}" rel="noopener">{t["wa"]}</a><a class="btn light" href="{link(cur, lang, "contact")}">{t["contact"]}</a></div>
<ul class="badges"><li>{t["why_items"][0][0]}</li><li>{t["why_items"][2][0]}</li><li>{t["why_items"][3][0]}</li></ul></div></section>
<section class="wrap"><h2>{t["cats"]}</h2>{cat_cards(cur, lang, TOP)}</section>
<section class="wrap"><h2>{t["how"]}</h2><ol class="steps">{how}</ol></section>
<section class="band"><div class="wrap"><h2>{t["why"]}</h2><div class="whys">{why}</div></div></section>
<section class="wrap brands" aria-label="brands">{"".join(f"<span>{b}</span>" for b in brands)}</section>
<section class="wrap prose"><h2>{t["areas"]}</h2><p>{t["areas_txt"]}</p><ul class="govs">{"".join(f"<li>{E(g)}</li>" for g in govs)}</ul></section>'''
    faqs = [q for c in TOP for q in c[lang]["faq"][:1]]
    fh, fs = faq_html(lang, faqs); body += fh
    body += quote_form(lang)
    site = {"@context": "https://schema.org", "@type": "WebSite", "@id": D + "/#website", "url": D + upath(lang),
            "name": C["brand_ar"] if lang == "ar" else C["brand_en"], "inLanguage": lang + "-EG", "publisher": {"@id": D + "/#business"}}
    return page(lang, "", t["home_title"], t["home_desc"], body, [org_schema(lang), site, fs])

def build_about(lang):
    t = T[lang]; cur = upath(lang, "about")
    body = f'<section class="phero"><div class="wrap"><div><h1>{t["about_h"]}</h1></div></div></section><section class="wrap prose">' + "".join(f"<p>{E(p)}</p>" for p in t["about_p"]) + '</section>'
    body += f'<section class="wrap"><h2>{t["products"]}</h2>{cat_cards(cur, lang, TOP)}</section>'
    return page(lang, "about", t["about_title"], t["about_desc"], body, [org_schema(lang)], [(t["about"], "about")])

def email_cards(lang):
    ar = lang == "ar"
    items = [
      ("التسعير وعروض الأسعار" if ar else "Pricing & quotes", "ابعت جدول الكميات أو طلب التوريد ونرد بعرض سعر." if ar else "Send your bill of quantities or supply request for a quote.", C["email_sales"]),
      ("خدمة العملاء والاستفسارات والشكاوى" if ar else "Customer care, enquiries & complaints", "أي استفسار عن طلب أو توريد أو شكوى، ونرد خلال يوم عمل." if ar else "Questions about an order or delivery, or a complaint. We reply within one business day.", C["email_support"]),
      ("تسجيل الموردين" if ar else "Supplier registration", "مصنع أو وكيل وعايز تورد لنا؟ ابعت ملف الشركة والسجل التجاري وقائمة المنتجات." if ar else "Manufacturer or agent? Send your company profile, commercial register and product list.", C["email_suppliers"]),
    ]
    cards = "".join(f'<div class="card"><h3>{E(h)}</h3><p>{E(p)}</p><a class="mail" href="mailto:{m}" dir="ltr">{m}</a></div>' for h, p, m in items)
    return f'<section class="wrap"><h2>{"راسلنا" if ar else "Email us"}</h2><div class="cards">{cards}</div></section>'

def build_contact(lang):
    t = T[lang]
    body = f'''<section class="phero"><div class="wrap"><div><h1>{t["contact"]}</h1><p class="lead">{t["f_hint"]}</p>
<div class="actions"><a class="btn wa" href="{wa_link(t["wa_msg"])}" rel="noopener">{t["wa"]}</a><a class="btn ghost" href="tel:{C["phone_e164"]}" dir="ltr">{C["phone_display"]}</a></div></div></div></section>''' + email_cards(lang) + quote_form(lang)
    return page(lang, "contact", t["contact_title"], t["contact_desc"], body, [org_schema(lang)], [(t["contact"], "contact")])

def build_404(lang):
    t = T[lang]; cur = upath(lang, "404")
    body = f'<section class="phero"><div class="wrap"><div><h1>{t["nf_h"]}</h1><p class="lead">{t["nf_p"]}</p></div></div></section><section class="wrap">{cat_cards(cur, lang, TOP)}</section>'
    return page(lang, "404", t["nf_title"], t["nf_p"], body, []).replace('content="index,follow,max-image-preview:large"', 'content="noindex"')

def write(slug, lang, html_):
    p = os.path.join(OUT, upath(lang, slug).lstrip("/"), "index.html")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(html_)

def main():
    if os.path.exists(OUT): shutil.rmtree(OUT)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(OUT, "assets"))
    urls = []
    for lang in ("ar", "en"):
        write("", lang, build_home(lang)); urls.append(("", 1.0))
        write("about", lang, build_about(lang)); urls.append(("about", 0.5))
        write("contact", lang, build_contact(lang)); urls.append(("contact", 0.7))
        for c in CATEGORIES:
            write(c["slug"], lang, build_category(c, lang)); urls.append((c["slug"], 0.9 if c["parent"] is None else 0.8))
    n404 = build_404("ar"); open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(n404)
    shutil.rmtree(os.path.join(OUT, "404"), ignore_errors=True)
    seen = []
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for slug, pr in urls:
        if slug in seen: continue
        seen.append(slug)
        for lang in ("ar", "en"):
            sm.append(f'<url><loc>{D}{upath(lang, slug)}</loc><lastmod>{TODAY}</lastmod><priority>{pr if lang == "ar" else round(pr - 0.1, 1)}</priority>'
                      f'<xhtml:link rel="alternate" hreflang="ar-EG" href="{D}{upath("ar", slug)}"/><xhtml:link rel="alternate" hreflang="en-EG" href="{D}{upath("en", slug)}"/>'
                      f'<xhtml:link rel="alternate" hreflang="x-default" href="{D}{upath("ar", slug)}"/></url>')
    sm.append("</urlset>")
    open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm))
    open(os.path.join(OUT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {D}/sitemap.xml\n")
    open(os.path.join(OUT, "_headers"), "w").write("/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n")
    if not PREVIEW:
        open(os.path.join(OUT, "CNAME"), "w").write(D.split("//")[1] + "\n")
        open(os.path.join(OUT, ".nojekyll"), "w").close()
    print("built", len(seen) * 2, "pages ->", OUT)

if __name__ == "__main__":
    main()
