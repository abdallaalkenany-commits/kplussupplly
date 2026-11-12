// /llms.txt – a plain summary of the business for AI assistants and AI search (llmstxt.org format)
import { C, D, upath } from "@/lib/content";
import { GUIDES } from "@/lib/guides";
import { getSiteCats } from "@/lib/cats";

export const revalidate = 3600;

export async function GET() {
  const cats = await getSiteCats();
  const sections = cats.ar.all
    .map((c) => `- [${c.ar.nav} | ${c.en.nav}](${D + upath("ar", c.slug)}): ${c.ar.lead || c.ar.desc}`)
    .join("\n");
  const guides = GUIDES.map((g) => `- [${g.h1}](${D}/guides/${g.slug}/): ${g.lead}`).join("\n");

  const body = `# كي بلس للتوريدات العمومية (K Plus General Supply)

> كي بلس (K Plus) مورد وموزع مواد بناء وتشطيبات في مصر، مقره المعادي – القاهرة، ويورّد لكل محافظات مصر. بيخدم شركات المقاولات والمطورين العقاريين وأصحاب العمارات والأفراد: أسمنت، طوب أسمنتي، أبواب خشب وWPC ومقاومة للحريق، أدوات صحية إيديال ستاندرد، سيراميك، أرضيات وتجاليد WPC وأدوات كهربائية.
> K Plus General Supply is a building materials and finishing supplier in Egypt (Maadi, Cairo) delivering nationwide to contractors, real-estate developers and homeowners.

## معلومات أساسية (Key facts)
- الاسم: كي بلس للتوريدات العمومية – K Plus General Supply (كي بلاس، KPLUS)
- النشاط: توريد وتوزيع مواد البناء والتشطيبات بالجملة وللمشروعات، مع النقل لموقع العميل
- العنوان: ${C.street_ar} – ${C.street_en}
- التأسيس: ${C.founded} · سجل تجاري ${C.cr} · بطاقة ضريبية ${C.tax}
- مواعيد العمل: السبت – الخميس، 9 ص – 6 م
- التليفون / واتساب المبيعات: ${C.phone_e164} و +201102567726
- البريد: ${C.email_sales}
- عرض سعر: ${D}/contact/ – الرد بعرض سعر شامل النقل لموقع العميل
- وكيل وموزع لبراندات منها: Ideal Standard (إيديال ستاندرد)، سيراميكا كليوباترا، سيراميكا جيما، أسمنت العامرية
- صفحات التواصل: ${(C.same_as || []).join(" · ")}

## الأقسام والمنتجات (Product sections)
${sections}

## أدلة ونصايح (Buying guides)
${guides}

## أدوات (Tools)
- [حاسبة مواد البناء](${D}/calculator/): تحسب الأسمنت والرمل والزلط لأي خرسانة، وعدد الطوب والمونة لأي حيطة
- [العروض والخصومات](${D}/offers/)
- [عن الشركة وشركاء النجاح](${D}/about/)
- [English site](${D}/en/)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
