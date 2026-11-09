import { SitePage, pageMeta } from "@/components/pages";
import { STATIC_SLUGS } from "@/lib/content";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_SLUGS.map((s) => ({ slug: s.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  return pageMeta("en", (await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  return <SitePage lang="en" parts={(await params).slug} />;
}
