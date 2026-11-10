import data from "./data.json";

export type Lang = "ar" | "en";
export type ProductRow = [string, string, string];
export type LangBlock = {
  nav: string; title: string; desc: string; h1: string; lead: string;
  body: [string, string][]; products: ProductRow[]; faq: [string, string][];
};
export type Category = { slug: string; icon: string; parent: string | null; ar: LangBlock; en: LangBlock };

export const C = data.config as Record<string, any>;
export const CATEGORIES = data.categories as unknown as Category[];
export const TOP = CATEGORIES.filter((c) => c.parent === null);
export const GOVS = data.govs as Record<Lang, string[]>;
export const ICONS = data.icons as Record<string, string>;
export const D = (process.env.NEXT_PUBLIC_SITE_URL || C.domain).replace(/\/$/, "");

const base = data.t as Record<Lang, Record<string, any>>;

// strings added for the dynamic site
const extra: Record<Lang, Record<string, string>> = {
  ar: {
    offers: "العروض والخصومات", offers_h: "عروض وخصومات مواد البناء",
    offers_lead: "أحدث عروض كي بلس على الأسمنت والطوب والأبواب والصحي والسيراميك. العروض لفترة محدودة وحسب الكمية المتاحة.",
    offers_title: "عروض وخصومات مواد البناء | كي بلس", offers_desc: "أحدث عروض وخصومات كي بلس على الأسمنت والطوب والأبواب والأدوات الصحية والسيراميك في مصر.",
    offers_empty: "مفيش عروض حاليًا. تابعنا أو ابعتلنا على واتساب نبلغك بأول عرض.", until: "العرض ساري لحد",
    suppliers: "سجّل كمورد", suppliers_h: "انضم لشبكة موردي كي بلس",
    suppliers_lead: "مصنع أو وكيل أو تاجر مواد بناء؟ سجّل شركتك وابدأ توريد لمشروعات المقاولين والمطورين معانا.",
    suppliers_title: "سجّل كمورد مواد بناء | كي بلس", suppliers_desc: "سجّل شركتك كمورد لدى كي بلس لتوريد الأسمنت والطوب والأبواب والصحي والسيراميك لمشروعات المقاولين في مصر.",
    sup_steps: "اعمل حساب مورد|ارفع السجل التجاري والبطاقة الضريبية|فريقنا يراجع ويوافق خلال 3 أيام عمل",
    sup_cta: "سجّل الآن", account: "حسابي", login: "دخول",
    ok: "✓ وصلنا طلبك، وفريق المبيعات هيكلمك قريب.", err: "حصلت مشكلة في الحفظ، فهنفتحلك واتساب تبعت منه الطلب.",
    q_send: "ابعت طلب السعر", q_hint: "طلبك بيتسجل عندنا وبيتفتح واتساب عشان تبعته لفريق المبيعات. من غير أي التزام.", wa_follow: "لو واتساب مافتحش، دوس هنا",
    f_company: "اسم الشركة (اختياري)", f_ctype: "نوع النشاط (اختياري)", ctypes: "developer:مطور عقاري|contractor:مقاول|supplier:مورد|factory:مصنع|concrete_plant:محطة خرسانة",
    f_map: "لوكيشن الموقع على الخريطة (اختياري)", f_map_btn: "📍 حدد موقعي الحالي", f_map_ph: "أو الصق رابط جوجل ماب", f_map_ok: "✓ اتحدد الموقع", f_map_err: "مقدرناش نحدد موقعك، الصق رابط جوجل ماب بدلها.", f_prefill: "ملينا بياناتك من آخر مرة.", f_more: "＋ تفاصيل إضافية (الشركة، النشاط، اللوكيشن، ملاحظات)",
    price: "السعر",
  },
  en: {
    offers: "Offers & Discounts", offers_h: "Building Materials Offers & Discounts",
    offers_lead: "The latest K Plus deals on cement, bricks, doors, sanitary ware and ceramics. Limited time, while stocks last.",
    offers_title: "Building Materials Offers & Discounts | K Plus", offers_desc: "Latest K Plus offers and discounts on cement, bricks, doors, sanitary ware and ceramics in Egypt.",
    offers_empty: "No offers right now. Message us on WhatsApp and we will tell you about the next one.", until: "Valid until",
    suppliers: "Become a Supplier", suppliers_h: "Join the K Plus Supplier Network",
    suppliers_lead: "Manufacturer, agent or trader of building materials? Register your company and start supplying contractors' projects with us.",
    suppliers_title: "Become a Building Materials Supplier | K Plus", suppliers_desc: "Register your company as a K Plus supplier of cement, bricks, doors, sanitary ware and ceramics for contractor projects in Egypt.",
    sup_steps: "Create a supplier account|Upload your commercial register and tax card|Our team reviews and approves within 3 business days",
    sup_cta: "Register now", account: "My account", login: "Sign in",
    ok: "✓ We got your request. Our sales team will contact you soon.", err: "Saving failed, so we are opening WhatsApp for you to send it.",
    q_send: "Send quote request", q_hint: "Your request is saved and WhatsApp opens so you can send it to our sales team. No obligation.", wa_follow: "If WhatsApp did not open, tap here",
    f_company: "Company name (optional)", f_ctype: "Business type (optional)", ctypes: "developer:Real estate developer|contractor:Contractor|supplier:Supplier|factory:Factory|concrete_plant:Concrete plant",
    f_map: "Site location on the map (optional)", f_map_btn: "📍 Use my current location", f_map_ph: "or paste a Google Maps link", f_map_ok: "✓ Location set", f_map_err: "Couldn't get your location. Paste a Google Maps link instead.", f_prefill: "We filled in your details from last time.", f_more: "＋ More details (company, business type, location, notes)",
    price: "Price",
  },
};

export const T: Record<Lang, Record<string, any>> = {
  ar: { ...base.ar, ...extra.ar },
  en: { ...base.en, ...extra.en },
};

export function upath(lang: Lang, slug = "") {
  return (lang === "en" ? "/en/" : "/") + (slug ? slug + "/" : "");
}

export function bySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function waLink(text: string) {
  return `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const STATIC_SLUGS = ["about", "contact", "offers", "suppliers", ...CATEGORIES.map((c) => c.slug)];
