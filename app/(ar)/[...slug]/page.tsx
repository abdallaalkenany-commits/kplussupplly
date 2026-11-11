import { SitePage, pageMeta, pricesMeta } from "@/components/pages";
import { AR_ONLY_SLUGS, STATIC_SLUGS } from "@/lib/content";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return [...STATIC_SLUGS, ...AR_ONLY_SLUGS].map((s) => ({ slug: s.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const parts = (await params).slug;
  if (parts.join("/") === "prices") return pricesMeta();
  return pageMeta("ar", parts);
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  return <SitePage lang="ar" parts={(await params).slug} />;
}
