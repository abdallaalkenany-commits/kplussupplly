import { SitePage, sitePageMeta } from "@/components/pages";
import { AR_ONLY_SLUGS, STATIC_SLUGS } from "@/lib/content";

export const revalidate = 300;
// sections added from the admin panel are rendered on first visit (unknown slugs still 404)
export const dynamicParams = true;

export function generateStaticParams() {
  return [...STATIC_SLUGS, ...AR_ONLY_SLUGS].map((s) => ({ slug: s.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  return sitePageMeta("ar", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  return <SitePage lang="ar" parts={(await params).slug} />;
}
