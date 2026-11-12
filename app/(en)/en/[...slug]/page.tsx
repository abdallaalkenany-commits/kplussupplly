import { SitePage, sitePageMeta } from "@/components/pages";
import { STATIC_SLUGS } from "@/lib/content";

export const revalidate = 300;
// sections added from the admin panel (with English texts) are rendered on first visit
export const dynamicParams = true;

export function generateStaticParams() {
  return STATIC_SLUGS.map((s) => ({ slug: s.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  return sitePageMeta("en", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  return <SitePage lang="en" parts={(await params).slug} />;
}
